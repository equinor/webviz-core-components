##################################################################
#
# Copyright (c) 2021- Equinor ASA
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
#
##################################################################

from dash import html, Dash
import dash
import webviz_core_components

print(dir(dash._dash_renderer))
print(dash._dash_renderer._available_react_versions)
print(dash._dash_renderer._env_react_version)
dash._dash_renderer._set_react_version("18.3.1")
print(dash._dash_renderer._env_react_version)
print(dash._dash_renderer.__version__)
app = Dash(__name__)
app.layout = html.Div(
    [
        webviz_core_components.ColorScales(
            id="colorscale",
            colorscale=["red", "blue"],
            nSwatches=12,
            fixSwatches=False,
        ),
    ]
)
app.run_server(debug=True)
