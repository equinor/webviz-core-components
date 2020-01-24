import inspect

import dash_core_components as dcc

from ._argument_modifier import argument_modifier

# dash-core-components provide their own plotly javascript bundle,
# which is not needed since webviz-core-components does the same
# (however a smaller plotly bundle without the `eval` function)

dcc._js_dist = [
    js for js in dcc._js_dist if not js["relative_package_path"].startswith("plotly-")
]


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
