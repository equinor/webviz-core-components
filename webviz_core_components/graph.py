import dash_core_components as dcc

from ._argument_modifier import argument_modifier


class Graph(dcc.Graph):
    def __init__(self, *args, **kwargs):

        args, kwargs = argument_modifier(
            dcc.Graph, "config", Graph.populate_config, args, kwargs
        )
        super().__init__(*args, **kwargs)

    @staticmethod
    def populate_config(input_config=None):
        """Populates an optionally given plotly config with default values
        """

        if input_config is None:
            config = {}
        else:
            config = input_config.copy()

        if "modeBarButtonsToRemove" not in config:
            config["modeBarButtonsToRemove"] = ["sendDataToCloud", "toImage"]

        if "displaylogo" not in config:
            config["displaylogo"] = False

        if "responsive" not in config:
            config["responsive"] = True

        return config
