from typing import Any

import dash_html_components as html


class Header(html.Div):
    """Returns a styled Header using html.Div"""

    def __init__(self, *args, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.className = "webviz-header"
