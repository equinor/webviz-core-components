import dash
from dash.dependencies import Input, Output, State
import dash_html_components as html
import webviz_core_components as wcc

app = dash.Dash(__name__)

app.layout = html.Div(
    [
        wcc.WebvizPluginPlaceholder(id="plugin", children=["Hello world"]),
        wcc.WebvizPluginPlaceholder(
            children=[
                wcc.FlexBox(
                    children=[
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


if __name__ == "__main__":
    app.run_server(debug=True)
