from typing import Union, Any
import dash_html_components as html


class FlexColumn(html.Div):
    """Used as a child of wcc.Flexbox to arrange components in a grid.

    Keyword arguments:

    - children (a list of or a singular dash component, string or number; required):
        The children of this component.

    - flex (int, str; default 1):
        The fraction of width this component will have

    - min_width (str; optional):
        The minimum width before the component will rearrange to a new row

    - style (string; optional):
        Additional css class to apply

    """

    def __init__(
        self,
        children: Any,
        flex: Union[str, int] = 1,
        min_width: str = None,
        style: dict = None,
        **kwargs: Any,
    ) -> None:
        super().__init__(**kwargs)
        style = style if style else {}
        style.update({"flex": flex})
        if min_width is not None:
            style.update({"minWidth": min_width})
        self.style = style
        self.children = children
