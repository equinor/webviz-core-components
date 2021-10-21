from typing import Any

from dash import html
from webviz_core_components import Select as BaseSelect


class SelectWithLabel(html.Div):
    """A Div wrapping a wcc.Select with an optional label.

    Keyword arguments:

    - label (string; optional):
        The text of the label

    - collapsible (bool; optional):
        Wraps the select in a collapsible box

    - open_details (bool; default True):
        Used to set initial opened/closed state if the collapsible box is used

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
        collapsible: bool = False,
        open_details: bool = True,
        wrapper_id: str = None,
        persistence: bool = True,
        persistence_type: str = "session",
        **kwargs: Any
    ) -> None:
        super().__init__()
        if wrapper_id is not None:
            self.id = wrapper_id
        if collapsible:
            children = [html.Summary(label)] if label else []
        else:
            children = [html.Label(label)] if label else []
        children.append(
            BaseSelect(
                persistence=persistence,
                persistence_type=persistence_type,
                **kwargs,
            )
        )
        if collapsible:
            self.children = html.Div(
                style={"fontSize": "15px"},
                children=html.Details(open=open_details, children=children),
            )
        else:
            self.children = html.Div(style={"fontSize": "15px"}, children=children)
