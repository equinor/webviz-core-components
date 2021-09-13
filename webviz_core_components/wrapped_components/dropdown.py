from typing import Any

from dash import html, dcc


class Dropdown(html.Div):
    def __init__(
        self,
        label: str = None,
        wrapper_id: str = None,
        persistence: bool = True,
        persistence_type: str = "session",
        **kwargs: Any,
    ) -> None:
        super().__init__()
        if wrapper_id is not None:
            self.id = wrapper_id
        children = [html.Label(label)] if label else []
        children.append(
            html.Div(
                className="webviz-dropdown",
                children=dcc.Dropdown(
                    persistence=persistence,
                    persistence_type=persistence_type,
                    **kwargs,
                ),
            )
        )
        self.children = html.Div(style={"fontSize": "15px"}, children=children)
