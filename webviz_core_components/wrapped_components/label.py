from typing import Any

from dash import html


class Label(html.Label):
    """Returns a styled dcc.Label"""

    def __init__(
        self,
        *args: Any,
        **kwargs: Any,
    ) -> None:
        super().__init__(*args, **kwargs)
        self.className = "webviz-label"
