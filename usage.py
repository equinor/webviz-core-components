import dash
from dash.dependencies import Input, Output, State
import dash_html_components as html
import webviz_core_components

app = dash.Dash(__name__)

app.layout = html.Div(
    [
        webviz_core_components.WebvizContainerPlaceholder(
            id="container", children=["Hello world"]
        ),
        webviz_core_components.WebvizContainerPlaceholder(
            id="some-other-container",
            children=[
                webviz_core_components.ColorScales(id="colorscale"),
                webviz_core_components.Graph(
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
