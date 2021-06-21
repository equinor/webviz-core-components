from typing import Any

import dash_html_components as html
from webviz_core_components import Select as BaseSelect


class SelectWithLabel(html.Div):
    """A Div wrapping a wcc.Select with an optional label.

    Keyword arguments:

    - label (string; optional):
        The text of the label

    - wrapper_id (string; optional):
        Id of the wrapping div

    - persistence (boolean | string | number; default: True):
        Used to allow user interactions in this component to be persisted
        when the component - or the page - is refreshed. If `persisted` is
        truthy and hasn't changed from its previous value, a `value` that
        the user has changed while using the app will keep that change, as
        long as the new `value` also matches what was given originally.
        Used in conjunction with `persistence_type`.

    - persistence_type (a value equal to: 'local', 'session', 'memory'; default 'session'):
        Where persisted user changes will be stored: memory: only kept in
        memory, reset on page refresh. local: window.localStorage, data is
        kept after the browser quit. session: window.sessionStorage, data
        is cleared once the browser quit.
    """

    def __init__(
        self,
        label: str = None,
        wrapper_id: str = None,
        persistence: bool = True,
        persistence_type: str = "session",
        **kwargs: Any
    ) -> None:
        super().__init__()
        if wrapper_id is not None:
            self.id = wrapper_id
        children = [html.Label(label)] if label else []
        children.append(
            BaseSelect(
                persistence=persistence,
                persistence_type=persistence_type,
                **kwargs,
            )
        )
        self.children = html.Div(style={"fontSize": "15px"}, children=children)
