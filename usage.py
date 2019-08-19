import dash
import dash_html_components as html
import webviz_core_components

app = dash.Dash(__name__)

app.layout = html.Div([
    webviz_core_components.WebvizContainerPlaceholder(
        id='container',
        children=['Hello world']
    ),
    html.Div(id='output')
])

if __name__ == '__main__':
    app.run_server(debug=True)
