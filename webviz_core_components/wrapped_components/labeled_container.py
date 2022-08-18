from typing import Any

from dash import html


class LabeledContainer(html.Div):
    """Creates a container with a header label and padded content

    Keyword arguments:

    - children (a list of or a singular dash component, string or number; required):
        The children of this component.

    - label (str; optional):
        The text of the label

    - className (string; optional):
        Additional css class to apply

    """

    def __init__(
        self, children: Any, label: str = "", className: str = "", **kwargs: Any
    ) -> None:
        super().__init__()
        self.className = (className + " WebvizLabeledContainer").strip()
        if "id" in kwargs:
            self.id = kwargs["id"]
        self.children = [
            html.Summary(children=label, className="webviz-underlined-label"),
            html.Div(style={"padding": "10px"}, children=children),
        ]
