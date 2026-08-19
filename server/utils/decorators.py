from utils.logger import current_task_id

def wrap_node(node_func):
    """
    Decorator that sets the current_task_id context variable for logging
    if a task_id is present in the node state.
    """
    def wrapper(state):
        task_id = state.get("task_id") if isinstance(state, dict) else None
        token = None
        if task_id:
            token = current_task_id.set(task_id)
        try:
            return node_func(state)
        finally:
            if token:
                current_task_id.reset(token)
    return wrapper
