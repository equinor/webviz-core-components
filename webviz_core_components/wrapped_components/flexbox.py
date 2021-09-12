from dash import html

from ._argument_modifier import argument_modifier


class FlexBox(html.Div):
    """Behaves like Div from dash.html, but extends that container with
    flexbox style settings. It also adds min-width CSS style to direct children.
    """

    # pylint: disable=too-few-public-methods

    def __init__(self, *args, **kwargs):
        def add_flexbox_css_class(className):  # pylint: disable=invalid-name
            return (
                "" if className is None else className + " "
            ) + "webviz-core-components-flexbox"

        args, kwargs = argument_modifier(
            html.Div, "className", add_flexbox_css_class, args, kwargs
        )

        super().__init__(*args, **kwargs)
