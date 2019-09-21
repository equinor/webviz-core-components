import inspect
import dash_core_components as dcc


# dash-core-components provide their own plotly javascript bundle,
# which is not needed since webviz-core-components does the same
# (however a smaller plotly bundle without the `eval` function)
#
# The whole webviz_core_components.Graph component is only necessary as 
# long as https://github.com/plotly/dash-core-components/issues/462 is
# open. When that is closed, changing default plotly variables can be
# done purely in Python by inheriting from `dcc.Graph`.

dcc._js_dist = [js for js in dcc._js_dist if not js['relative_package_path'].startswith('plotly-')]


class Graph(dcc.Graph):

    def __init__(self, *args, **kwargs):

        config_arg_index = inspect.getfullargspec(dcc.Graph).args.index('config')

        if len(args) > config_arg_index:  # config given as positional argument
            args = args[:config_arg_index] + \
                (Graph.populate_config(args[config_arg_index]),) + \
                args[config_arg_index + 1:]

        elif 'config' in kwargs:  # config given as keyword argument
            kwargs['config'] = Graph.populate_config(kwargs['config'])

        else:  # config not given - give with only default values
            kwargs['config'] = Graph.populate_config()

        super().__init__(*args, **kwargs)


    @staticmethod
    def populate_config(input_config=None):
        '''Populates an optionally given plotly config with default values
        '''

        if input_config is None:
            config = {}
        else:
            config = input_config.copy()

        if 'modeBarButtonsToRemove' not in config:
            config['modeBarButtonsToRemove'] = ['sendDataToCloud', 'toImage']

        if 'displaylogo' not in config:
            config['displaylogo'] = False

        if 'responsive' not in config:
            config['responsive'] = True

        return config
