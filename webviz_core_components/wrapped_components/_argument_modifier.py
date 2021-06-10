import inspect


def argument_modifier(parent_class, argument_name, modifying_function, args, kwargs):
    """Intelligently modifies input args and kwargs given to a class __init__ function.

    * parent_class: The parent class to look for wrt. arguments.
    * argument_name: The name of the argument to (potentially) change
    * modifying_function: Reference to a function which should take one value. It is
                          automatically given the current value of the relevant argument
                          (None if not given), and should return the new modified value.
    * args, kwargs: The arguments to be changed.

    Returns new pair of args and kwargs.
    """

    arg_index = inspect.getfullargspec(parent_class).args.index(argument_name)

    if len(args) > arg_index:  # given as positional argument
        args = (
            args[:arg_index]
            + (modifying_function(args[arg_index]),)
            + args[arg_index + 1 :]
        )
    else:
        if modifying_function(kwargs.get(argument_name)) is not None:
            kwargs[argument_name] = modifying_function(kwargs.get(argument_name))

    return args, kwargs
