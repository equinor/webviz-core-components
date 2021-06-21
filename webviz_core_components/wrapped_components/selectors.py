from typing import Any

import dash_html_components as html


class Selectors(html.Details):
    """Creates a collapsible box with a header label.

    Keyword arguments:

    - children (a list of or a singular dash component, string or number; required):
        The children of this component.

    - open_details (bool; default True):
        Used to set initial opened/closed state

    - label (str; optional):
        The text of the label

    - className (string; optional):
        Additional css class to apply

    """

    def __init__(
        self,
        children: Any,
        open_details: bool = True,
        label: str = "",
        className: str = "",
        **kwargs: Any
    ) -> None:
        super().__init__()
        self.className = className + "webviz-selectors"
        self.open = open_details
        if "id" in kwargs:
            self.id = kwargs["id"]
        self.children = [
            html.Summary(children=label, className="webviz-underlined-label"),
            html.Div(style={"padding": "10px"}, children=children),
        ]
