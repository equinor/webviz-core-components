import copy

import dash_html_components as html

from ._argument_modifier import argument_modifier


class FlexBox(html.Div):
    """Behaves like Div from dash_html_components, but extends that container with
    flexbox style settings. It also adds necessary flex CSS settings to its children.

    Other style settings are untouched.
    """

    def __init__(self, *args, **kwargs):
        def container_style(old_style):
            style = {} if old_style is None else copy.deepcopy(old_style)
            style.update({"display": "flex", "flexWrap": "wrap"})
            return style

        def update_children_style(children):
            if children is not None:
                for child in children:
                    style = (
                        copy.deepcopy(child.style) if hasattr(child, "style") else {}
                    )

                    style["flex"] = style.get("flex", "auto")

                    if "min-width" not in style and "minWidth" not in style:
                        style["minWidth"] = "250px"

                    child.style = style

            return children

        args, kwargs = argument_modifier(
            html.Div, "style", container_style, args, kwargs
        )

        args, kwargs = argument_modifier(
            html.Div, "children", update_children_style, args, kwargs
        )

        super().__init__(*args, **kwargs)
