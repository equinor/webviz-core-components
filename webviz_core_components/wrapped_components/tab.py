from typing import Any

import dash_core_components as dcc


class Tab(dcc.Tab):
    """A dcc.Tab with styling

    Keyword arguments:

    - children (a list of or a singular dash component, string or number; required):
        The children of this component.

    - style (dict; optional):
        Additional styling

    - selected_style (dict; optional):
        Additional styling when the tab is selected

    """

    def __init__(
        self,
        *args: Any,
        **kwargs: Any,
    ) -> None:
        super().__init__(*args, **kwargs)
        self.className = "webviz-tab"
        self.selected_className = "webviz-tab-selected"
