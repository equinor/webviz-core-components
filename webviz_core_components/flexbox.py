import copy

import dash_html_components as html

from ._argument_modifier import argument_modifier


class FlexBox(html.Div):
    """Behaves like Div from dash_html_components, but extends that container with
    flexbox style settings. It also adds min-width CSS style to direct children.
    """

    def __init__(self, *args, **kwargs):
        def add_flexbox_css_class(className):
            return (
                "" if className is None else className + " "
            ) + "webviz-core-components-flexbox"

        args, kwargs = argument_modifier(
            html.Div, "className", add_flexbox_css_class, args, kwargs
        )

        super().__init__(*args, **kwargs)
