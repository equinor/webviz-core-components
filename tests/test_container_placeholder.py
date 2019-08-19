import dash
import dash_html_components as html
import webviz_core_components

def test_container_placeholder(dash_duo):

    app = dash.Dash(__name__)

    app.layout = html.Div([
        webviz_core_components.WebvizContainerPlaceholder(
            id='container',
            children=['Hello world']
        ),
        html.Div(id='output')
    ])

    dash_duo.start_server(app)

    assert dash_duo.get_logs() == [], "browser console should contain no error"
