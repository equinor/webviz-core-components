from typing import Any

import dash_html_components as html


class CollapsiveHeader(html.Details):
    """Creates a collapsible box with a large header label.

    Keyword arguments:

    - children (a list of or a singular dash component, string or number; required):
        The children of this component.

    - open_details (bool; default True):
        Used to set initial opened/closed state

    - label (str; optional):
        The text of the label

    """

    def __init__(
        self, children: Any, open_details: bool = True, label: str = "", **kwargs: Any
    ) -> None:
        super().__init__(**kwargs)
        self.open = open_details
        self.children = [
            html.Summary(children=label, className="webviz-header")
        ] + children
