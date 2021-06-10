from typing import Any

import dash_core_components as dcc


class Tabs(dcc.Tabs):
    """Returns a dcc.Tabs"""

    def __init__(
        self,
        *args: Any,
        **kwargs: Any,
    ) -> None:
        super().__init__(*args, **kwargs)
