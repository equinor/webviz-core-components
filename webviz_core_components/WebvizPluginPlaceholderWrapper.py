from functools import wraps
import logging

from .WebvizPluginPlaceholder import WebvizPluginPlaceholder


class WebvizPluginPlaceholderWrapper(WebvizPluginPlaceholder):
    @wraps(WebvizPluginPlaceholder)
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        logging.debug(
            "WebvizPluginPlaceholder has been deprecated. Please consider switching to the Webviz Layout Framework."
        )
