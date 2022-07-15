import React from "react";
import ReactDOM from "react-dom";

import "./values-list.css";

export type ValuesListProps = {
    open: boolean;
    values: string[];
    contentRef: React.RefObject<HTMLDivElement>;
};

export const ValuesList: React.FC<ValuesListProps> = (props) => {
    const popup = React.useRef<HTMLDivElement | null>(null);
    const valuesListPositionRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        popup.current = document.createElement("div");
        document.body.appendChild(popup.current);

        return () => {
            if (popup.current) {
                document.body.removeChild(popup.current);
                popup.current = null;
            }
        };
    }, []);

    React.useEffect(() => {
        const renderValuesList = () => {
            if (valuesListPositionRef.current && popup.current) {
                const maxHeight =
                    window.innerHeight -
                    (props.contentRef.current
                        ? props.contentRef.current.getBoundingClientRect()
                              .bottom + 10
                        : 200);

                const boundingRect = valuesListPositionRef.current
                    ? {
                          top:
                              valuesListPositionRef.current.getBoundingClientRect()
                                  .top + window.scrollY,
                          left:
                              valuesListPositionRef.current.getBoundingClientRect()
                                  .left + window.scrollX,
                          bottom:
                              valuesListPositionRef.current.getBoundingClientRect()
                                  .bottom + window.scrollY,
                          right:
                              valuesListPositionRef.current.getBoundingClientRect()
                                  .right + window.scrollX,
                          width: valuesListPositionRef.current.getBoundingClientRect()
                              .width,
                          height: valuesListPositionRef.current.getBoundingClientRect()
                              .height,
                      }
                    : {
                          top: 0,
                          left: 0,
                          bottom: 0,
                          right: 0,
                          width: 0,
                          height: 0,
                      };
                ReactDOM.render(
                    <div
                        className="WebvizAttributesSelector__ValuesList"
                        style={{
                            maxHeight: maxHeight,
                            display: props.open ? "block" : "none",
                            top: boundingRect.top,
                            left: boundingRect.left,
                            width: boundingRect.width,
                        }}
                    >
                        {props.values.map((value) => (
                            <div className="WebvizAttributesSelector__ValuesList__Value">
                                {value}
                            </div>
                        ))}
                    </div>,
                    popup.current
                );
            }
        };

        window.addEventListener("resize", () => renderValuesList());
        window.addEventListener("scroll", () => renderValuesList(), true);
        renderValuesList();

        return () => {
            window.removeEventListener("resize", () => renderValuesList());
            window.removeEventListener(
                "scroll",
                () => renderValuesList(),
                true
            );
        };
    }, [valuesListPositionRef.current, popup.current]);
    return (
        <div
            ref={valuesListPositionRef}
            className="WebvizAttributesSelector__ValuesList WebvizAttributesSelector__ValuesList__Position"
        ></div>
    );
};
