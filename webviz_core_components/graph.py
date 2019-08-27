import inspect
import dash_core_components as dcc


class Graph(dcc.Graph):

    def __init__(self, *args, **kwargs):

        config_arg_index = inspect.getargspec(dcc.Graph).args.index('config')

        if len(args) > config_arg_index:  # config given as positional argument
            args = args[:config_arg_index] + \
                [Graph.populate_config(args[config_arg_index])] + \
                args[config_arg_index + 1:]

        elif 'config' in kwargs:  # config given as keyword argument
            kwargs['config'] = Graph.populate_config(kwargs['config'])

        else:  # config not given - give with only default values
            kwargs['config'] = Graph.populate_config()

        super().__init__(*args, **kwargs)


    @staticmethod
    def populate_config(config=None):
        '''Populates an optionally given plotly config with default values
        '''

        if config is None:
            config = {}

        if 'modeBarButtonsToRemove' not in config:
            config['modeBarButtonsToRemove'] = ['sendDataToCloud', 'toImage']

        if 'displaylogo' not in config:
            config['displaylogo'] = False

        if 'responsive' not in config:
            config['responsive'] = True

        return config
