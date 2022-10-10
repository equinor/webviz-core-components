import React from "react";
import * as ReactDOM from "react-dom";

type RendererProps = {
    target: Element | DocumentFragment | null;
};

export const Renderer: React.FC<RendererProps> = (props) => {
    if (props.target) {
        return ReactDOM.createPortal(props.children, props.target);
    } else {
        return <div></div>;
    }
};
