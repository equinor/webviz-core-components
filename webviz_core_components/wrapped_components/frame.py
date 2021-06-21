from typing import Any

import dash_html_components as html


class Frame(html.Div):
    """A html.Div with border and background styling

    Keyword arguments:

    - children (a list of or a singular dash component, string or number; required):
        The children of this component.

    - color (str; default #F9F9F9):
        Background color of the frame

    - highlight (bool; default: True):
        Adds additional shadow when hovering over the box

    - className (string; optional):
        Additional css class to apply

    - style (string; optional):
        Additional style for the component

    """

    def __init__(
        self,
        children: Any,
        color: str = "#F9F9F9",
        highlight: bool = True,
        className: str = "",
        style: dict = None,
        **kwargs: Any,
    ) -> None:
        super().__init__(**kwargs)

        self.className = (
            className + " webviz-frame"
            if highlight
            else className + " webviz-frame-no-hover"
        )
        self.style = style if style is not None else {}
        self.style.update({"backgroundColor": color})
        self.children = children
