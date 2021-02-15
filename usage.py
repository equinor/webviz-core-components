import dash
from dash.dependencies import Input, Output, State
import dash_html_components as html
import webviz_core_components as wcc

app = dash.Dash(__name__)

app.layout = html.Div(
    [
        wcc.WebvizPluginPlaceholder(id="plugin", children=["Hello world"], screenshot_filename="hello.png"),
        wcc.WebvizPluginPlaceholder(
            children=[
                wcc.FlexBox(
                    children=[
                        html.Div(
                            style={"width": "100%"},
                            children=[
                                wcc.Select(
                                    id="select-test",
                                    size=2,
                                    value=["el1"],
                                    options=[
                                        {"value": "el1", "label": "List element 1"},
                                        {"value": "el2", "label": "List element 2"},
                                    ],
                                )
                            ],
                        ),
                        html.Div(
                            "First element (before break)",
                            style={"background-color": "rgba(0, 255, 255, 0.2)"},
                        ),
                        html.Div(style={"height": "0px", "width": "100%"}),
                        html.Div(
                            "Second",
                            style={
                                "width": "20%",
                                "background-color": "rgba(255, 0, 0, 0.2)",
                            },
                        ),
                        html.Div(
                            "Third",
                            style={
                                "width": "40%",
                                "background-color": "rgba(0, 255, 0, 0.2)",
                            },
                        ),
                        html.Div(
                            "Fourth",
                            style={
                                "width": "40%",
                                "background-color": "rgba(0, 0, 255, 0.2)",
                            },
                        ),
                    ]
                )
            ]
        ),
        wcc.WebvizPluginPlaceholder(
            id="some-other-plugin",
            children=[
                wcc.ColorScales(id="colorscale"),
                wcc.Graph(
                    id="example-graph",
                    figure={
                        "data": [
                            {
                                "x": [1, 2, 3],
                                "y": [4, 1, 2],
                                "type": "bar",
                                "name": "a",
                            },
                            {
                                "x": [1, 2, 3],
                                "y": [2, 4, 5],
                                "type": "bar",
                                "name": "b",
                            },
                            {
                                "x": [1, 2, 3],
                                "y": [1, 4, 5],
                                "type": "bar",
                                "name": "c",
                            },
                            {
                                "x": [1, 2, 3],
                                "y": [2, 3, 5],
                                "type": "bar",
                                "name": "d",
                            },
                            {
                                "x": [1, 2, 3],
                                "y": [2, 2, 5],
                                "type": "bar",
                                "name": "e",
                            },
                            {
                                "x": [1, 2, 3],
                                "y": [2, 4, 6],
                                "type": "bar",
                                "name": "f",
                            },
                            {
                                "x": [1, 2, 3],
                                "y": [2, 4, 1],
                                "type": "bar",
                                "name": "g",
                            },
                        ],
                        "layout": {"title": "Dash Data Visualization", "height": 1200},
                    },
                ),
            ],
        ),
        wcc.WebvizPluginPlaceholder(
            id="tree-tag-plugin",
            children=[
                wcc.TagTreeSelector(
                    id="input",
                    label="Vector Selector",
                    maxNumTags=3,
                    delimiter=":",
                    numMetaData=2,
                    data={
                        "iter-0": {
                            "description": "Iteration 0",
                            "color": "#326dcf",
                            "data": {
                                "well": {
                                    "description": "Oil well",
                                    "icon": "Well",
                                    "data": {
                                        "WOBP": {
                                            "description": "...",
                                            "data": {
                                                "OP_1": {"data": {}},
                                                "OP_2": {"data": {}},
                                                "OP_3": {"data": {}},
                                                "OP_4": {"data": {}},
                                                "OP_5": {"data": {}},
                                                "OP_6": {"data": {}},
                                                "OP_7": {"data": {}},
                                                "OP_8": {"data": {}},
                                                "OP_9": {"data": {}},
                                                "OP_10": {"data": {}},
                                            },
                                        },
                                        "FOBP": {
                                            "type": "field",
                                            "description": "...",
                                            "selectorDescripton": "Select a subgroup...",
                                            "data": {},
                                        },
                                    },
                                }
                            },
                        },
                        "iter-1": {
                            "description": "Iteration 1",
                            "color": "#458906",
                            "data": {
                                "well": {
                                    "description": "Oil well",
                                    "icon": "Well",
                                    "data": {
                                        "WOBP": {
                                            "description": "...",
                                            "data": {
                                                "OP_1": {"data": {}},
                                                "OP_2": {"data": {}},
                                                "OP_3": {"data": {}},
                                                "OP_4": {"data": {}},
                                                "OP_5": {"data": {}},
                                                "OP_6": {"data": {}},
                                                "OP_7": {"data": {}},
                                                "OP_8": {"data": {}},
                                                "OP_9": {"data": {}},
                                                "OP_10": {"data": {}},
                                            },
                                        },
                                        "FOBP": {
                                            "type": "field",
                                            "description": "...",
                                            "selectorDescripton": "Select a subgroup...",
                                            "data": {},
                                        },
                                    },
                                }
                            },
                        },
                    },
                ),
                html.Div(id="output"),
            ]
        )
    ]
)


@app.callback(
    Output("example-graph", "figure"),
    [Input("colorscale", "colorscale")],
    [State("example-graph", "figure")],
)
def update_colors(colorscale, figure):
    figure["layout"]["colorway"] = colorscale
    return figure

@app.callback(Output("output", "children"), [Input("input", "values"), Input("input", "tags")])
def display_output(values, tags):
    return "By using the tags '{}' you have selected the values '{}'".format(tags, values)


if __name__ == "__main__":
    app.run_server(debug=False)
