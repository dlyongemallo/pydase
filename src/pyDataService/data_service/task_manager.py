import asyncio
import inspect
from functools import wraps
from typing import Any

from loguru import logger

from .abstract_service_classes import AbstractDataService, AbstractTaskManager


class TaskManager(AbstractTaskManager):
    """
    The TaskManager class is a utility designed to manage asynchronous tasks. It
    provides functionality for starting, stopping, and tracking these tasks. The class
    is primarily used by the DataService class to manage its tasks.

    A task in TaskManager is any asynchronous function. To add a task, you simply need
    to define an async function within your class that extends TaskManager. For example:

    ```python
    class MyService(DataService):
        async def my_task(self):
            # Your task implementation here
            pass
    ```

    With the above definition, TaskManager automatically creates `start_my_task` and
    `stop_my_task` methods that can be used to control the task.

    TaskManager also supports auto-starting tasks. If there are tasks that should start
    running as soon as an instance of your class is created, you can define them in
    `self._autostart_tasks` in your class constructor (__init__ method). Here's how:

    ```python
    class MyService(DataService):
        def __init__(self):
            self._autostart_tasks = {
                "my_task": (*args)  # Replace with actual arguments
            }
            self.wait_time = 1
            super().__init__()

        async def my_task(self, *args):
            while True:
                # Your task implementation here
                await asyncio.sleep(self.wait_time)
    ```

    In the above example, `my_task` will start running as soon as
    `_start_autostart_tasks` is called which is done when the DataService instance is
    passed to the `pyDataService.Server` class.

    The responsibilities of the TaskManager class are:

    - Track all running tasks: Keeps track of all the tasks that are currently running.
    This allows for monitoring of task statuses and for making sure tasks do not
    overlap.
    - Provide the ability to start and stop tasks: Automatically creates methods to
    start and stop each task.
    - Emit notifications when the status of a task changes: Has a built-in mechanism for
    emitting notifications when a task starts or stops. This is used to update the user
    interfaces, but can also be used to write logs, etc.
    """

    def __init__(self, service: AbstractDataService) -> None:
        self.service = service
        self._loop = asyncio.get_event_loop()

        self.tasks = {}

        self.task_status_change_callbacks = []

        self._set_start_and_stop_for_async_methods()

    def _set_start_and_stop_for_async_methods(self) -> None:  # noqa: C901
        # inspect the methods of the class
        for name, method in inspect.getmembers(
            self.service, predicate=inspect.iscoroutinefunction
        ):

            @wraps(method)
            def start_task(*args: Any, **kwargs: Any) -> None:
                async def task(*args: Any, **kwargs: Any) -> None:
                    try:
                        await method(*args, **kwargs)
                    except asyncio.CancelledError:
                        print(f"Task {name} was cancelled")

                if not self.tasks.get(name):
                    # Get the signature of the coroutine method to start
                    sig = inspect.signature(method)

                    # Create a list of the parameter names from the method signature.
                    parameter_names = list(sig.parameters.keys())

                    # Extend the list of positional arguments with None values to match
                    # the length of the parameter names list. This is done to ensure
                    # that zip can pair each parameter name with a corresponding value.
                    args_padded = list(args) + [None] * (
                        len(parameter_names) - len(args)
                    )

                    # Create a dictionary of keyword arguments by pairing the parameter
                    # names with the values in 'args_padded'. Then merge this dictionary
                    # with the 'kwargs' dictionary. If a parameter is specified in both
                    # 'args_padded' and 'kwargs', the value from 'kwargs' is used.
                    kwargs_updated = {
                        **dict(zip(parameter_names, args_padded)),
                        **kwargs,
                    }

                    # Store the task and its arguments in the '__tasks' dictionary. The
                    # key is the name of the method, and the value is a dictionary
                    # containing the task object and the updated keyword arguments.
                    self.tasks[name] = {
                        "task": self._loop.create_task(task(*args, **kwargs)),
                        "kwargs": kwargs_updated,
                    }

                    # emit the notification that the task was started
                    for callback in self.task_status_change_callbacks:
                        callback(name, kwargs_updated)
                else:
                    logger.error(f"Task `{name}` is already running!")

            def stop_task() -> None:
                # cancel the task
                task = self.tasks.pop(name)
                if task is not None:
                    self._loop.call_soon_threadsafe(task["task"].cancel)

                    # emit the notification that the task was stopped
                    for callback in self.task_status_change_callbacks:
                        callback(name, None)

            # create start and stop methods for each coroutine
            setattr(self.service, f"start_{name}", start_task)
            setattr(self.service, f"stop_{name}", stop_task)

    def start_autostart_tasks(self) -> None:
        if self.service._autostart_tasks is not None:
            for service_name, args in self.service._autostart_tasks.items():
                start_method = getattr(self, f"start_{service_name}", None)
                if start_method is not None and callable(start_method):
                    start_method(*args)
                else:
                    logger.warning(
                        f"No start method found for service '{service_name}'"
                    )