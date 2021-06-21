from typing import Any

import dash_html_components as html


class Label(html.Label):
    """Returns a styled dcc.Label"""

    def __init__(
        self,
        *args: Any,
        **kwargs: Any,
    ) -> None:
        super().__init__(*args, **kwargs)
        self.className = "webviz-label"
