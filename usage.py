import dash
import dash_html_components as html
import webviz_core_components

app = dash.Dash(__name__)

app.layout = html.Div([
    webviz_core_components.WebvizContainerPlaceholder(
        id='container',
        children=['Hello world']
    ),
    webviz_core_components.Graph(
        id='example-graph',
        figure={
            'data': [
                {'x': [1, 2, 3], 'y': [4, 1, 2], 'type': 'bar', 'name': 'Trondheim'},
                {'x': [1, 2, 3], 'y': [2, 4, 5], 'type': 'bar', 'name': 'Bergen'}
            ],
            'layout': {
                'title': 'Dash Data Visualization'
            }
        }
    ),
    html.Div(id='output')
])

if __name__ == '__main__':
    app.run_server(debug=True)
