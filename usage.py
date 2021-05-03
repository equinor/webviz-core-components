import dash
from dash.dependencies import Input, Output, State
import dash_html_components as html
import webviz_core_components as wcc

app = dash.Dash(__name__)

app.layout = html.Div(
    [
        wcc.WebvizPluginPlaceholder(
            id="plugin", children=["Hello world"], screenshot_filename="hello.png"
        ),
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
            id="smart-node-selector-plugin",
            children=[
                wcc.SmartNodeSelector(
                    id="SmartNodeSelector",
                    maxNumSelectedNodes=3,
                    numMetaNodes=2,
                    delimiter=":",
                    selectedTags=[],
                    label="Smart Node Selector",
                    data=[
                        {
                            "id": "1",
                            "name": "Metadata 1",
                            "description": "A first data source",
                            "color": "#0095FF",
                            "children": [
                                {
                                    "id": "1.1",
                                    "name": "Submetadata 1",
                                    "description": "A data category",
                                    "icon": (
                                        "https://raw.githubusercontent.com/"
                                        "feathericons/feather/master/icons/anchor.svg"
                                    ),
                                    "children": [
                                        {
                                            "id": "1.1.1",
                                            "name": "Node 1",
                                            "description": "A first data node",
                                            "children": [
                                                {
                                                    "id": "1.1.1.1",
                                                    "name": "Subnode 1",
                                                    "description": "A first sub node",
                                                },
                                                {
                                                    "id": "1.1.1.2",
                                                    "name": "Subnode 2",
                                                    "description": "A second sub node",
                                                },
                                                {
                                                    "id": "1.1.1.3",
                                                    "name": "Subnode 3",
                                                    "description": "A third sub node",
                                                },
                                                {
                                                    "id": "1.1.1.4",
                                                    "name": "Subnode 4",
                                                    "description": "A fourth sub node",
                                                },
                                            ],
                                        },
                                        {
                                            "id": "1.1.2",
                                            "name": "Node 2",
                                            "description": "A second data node",
                                        },
                                    ],
                                },
                                {
                                    "id": "1.2",
                                    "name": "Submetadata 2",
                                    "description": "Another data category",
                                    "icon": (
                                        "https://raw.githubusercontent.com/"
                                        "feathericons/feather/master/icons/activity.svg"
                                    ),
                                },
                            ],
                        },
                        {
                            "id": "2",
                            "name": "Metadata 2",
                            "description": "A second data source",
                            "color": "#FF5555",
                            "children": [
                                {
                                    "id": "2.1",
                                    "name": "Submetadata 1",
                                    "description": "A data category",
                                    "icon": (
                                        "https://raw.githubusercontent.com/"
                                        "feathericons/feather/master/icons/anchor.svg"
                                    ),
                                    "children": [
                                        {
                                            "id": "2.1.1",
                                            "name": "Node 1",
                                            "description": "A first data node",
                                            "children": [
                                                {
                                                    "id": "2.1.1.1",
                                                    "name": "Subnode 1",
                                                    "description": "A first sub node",
                                                },
                                                {
                                                    "id": "2.1.1.2",
                                                    "name": "Subnode 2",
                                                    "description": "A second sub node",
                                                },
                                                {
                                                    "id": "2.1.1.3",
                                                    "name": "Subnode 3",
                                                    "description": "A third sub node",
                                                },
                                                {
                                                    "id": "2.1.1.4",
                                                    "name": "Subnode 4",
                                                    "description": "A fourth sub node",
                                                },
                                            ],
                                        },
                                        {
                                            "id": "2.1.2",
                                            "name": "Node 2",
                                            "description": "A second data node",
                                        },
                                    ],
                                },
                                {
                                    "id": "2.2",
                                    "name": "Submetadata 2",
                                    "description": "Another data category",
                                    "icon": (
                                        "https://raw.githubusercontent.com/"
                                        "feathericons/feather/master/icons/activity.svg"
                                    ),
                                },
                            ],
                        },
                    ],
                ),
                html.Div(id="output"),
            ],
        ),
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


@app.callback(
    Output("output", "children"),
    [
        Input("SmartNodeSelector", "selectedNodes"),
        Input("SmartNodeSelector", "selectedTags"),
        Input("SmartNodeSelector", "selectedIds"),
    ],
)
def display_output(nodes, tags, ids):
    return (
        f"By using the tags '{tags}' you have selected "
        f"the nodes with the paths '{nodes}' with the ids '{ids}'"
    )


if __name__ == "__main__":
    app.run_server(debug=False)
