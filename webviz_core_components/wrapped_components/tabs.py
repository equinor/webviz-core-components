from typing import Any

from dash import dcc


class Tabs(dcc.Tabs):
    """Returns a dcc.Tabs"""

    def __init__(
        self,
        *args: Any,
        **kwargs: Any,
    ) -> None:
        super().__init__(*args, **kwargs)
