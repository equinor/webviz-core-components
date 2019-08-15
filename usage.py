import webviz_core_components
import dash
import numpy as np
from dash.dependencies import Input, Output
import dash_html_components as html
import pandas as pd

df = pd.DataFrame(np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]]),
                  columns=['a', 'b', 'c'])

app = dash.Dash(__name__)

app.layout = html.Div([
    webviz_core_components.WebvizContainerPlaceholder(
        id='container',
        children=['Hello world']
    ),
    html.Div(id='output')
])

@app.callback(Output('container', 'csv_data'),
              [Input('container', 'csv_requested')])
def display_output(csv_requested):
    if not csv_requested:
        return ''
    else:
        return df.to_csv()

if __name__ == '__main__':
    app.run_server(debug=True)
