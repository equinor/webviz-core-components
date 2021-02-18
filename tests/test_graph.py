##################################################################
#
# Copyright (c) 2021- Equinor ASA
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
#
##################################################################

import dash
import dash_html_components as html
import webviz_core_components


def test_container_placeholder(dash_duo):

    app = dash.Dash(__name__)

    app.layout = html.Div(
        [
            webviz_core_components.Graph(
                id="example-graph",
                figure={
                    "data": [
                        {
                            "x": [1, 2, 3],
                            "y": [4, 1, 2],
                            "type": "bar",
                            "name": "Trondheim",
                        },
                        {
                            "x": [1, 2, 3],
                            "y": [2, 4, 5],
                            "type": "bar",
                            "name": "Bergen",
                        },
                    ],
                    "layout": {"title": "Dash Data Visualization"},
                },
                config={"displaylogo": False},
            )
        ]
    )

    dash_duo.start_server(app)

    assert dash_duo.get_logs() == [], "browser console should contain no error"
