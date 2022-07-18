import { ScrollArea } from "../../../../../ScrollArea";
import React from "react";
import ReactDOM from "react-dom";

import "./values-list.css";

export type ValueProps = {
    checked: boolean;
    selected: boolean;
    children: React.ReactChild;
};

const Value: React.FC<ValueProps> = (props) => {
    return (
        <div
            className={`WebvizAttributesSelector__ValuesList__Value${
                props.selected
                    ? " WebvizAttributesSelector__ValuesList__Value--selected"
                    : ""
            }`}
        >
            <div
                className={`WebvizAttributesSelector__ValuesList__Value__Checkbox${
                    props.checked
                        ? " WebvizAttributesSelector__ValuesList__Value__Checkbox--checked"
                        : ""
                }`}
            ></div>
            {props.children}
        </div>
    );
};

export type ValuesListProps = {
    open: boolean;
    alwaysOpen: boolean;
    values: string[];
    contentRef: React.RefObject<HTMLUListElement>;
};

export const ValuesList: React.FC<ValuesListProps> = (props) => {
    const popup = React.useRef<HTMLDivElement | null>(null);
    const valuesListPositionRef = React.useRef<HTMLDivElement | null>(null);
    const [selection, setSelection] = React.useState<string[]>([]);

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

    const valuesList = React.useCallback(
        (
            maxHeight?: number,
            top?: number,
            left?: number,
            width?: number,
            open = true,
            popup = false
        ) => {
            maxHeight = maxHeight || 300;
            const height = Math.min(maxHeight, (props.values.length + 1) * 34);
            return (
                <div
                    className={`WebvizAttributesSelector__ValuesList${
                        popup
                            ? " WebvizAttributesSelector__ValuesList--popup"
                            : ""
                    }`}
                    style={{
                        height: height,
                        display: open ? "block" : "none",
                        top: top,
                        left: left,
                        width: width,
                    }}
                >
                    <ScrollArea>
                        <div className="WebvizAttributesSelector__ValuesList__Value">
                            <div
                                className={
                                    "WebvizAttributesSelector__ValuesList__Value__Checkbox" +
                                    " WebvizAttributesSelector__ValuesList__Value__Checkbox--indeterminate"
                                }
                            ></div>
                            Select / unselect all
                        </div>
                        {props.values.map((value) => (
                            <Value
                                key={value}
                                checked={false}
                                selected={selection.includes(value)}
                            >
                                {value}
                            </Value>
                        ))}
                    </ScrollArea>
                </div>
            );
        },
        []
    );

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
                    valuesList(
                        maxHeight,
                        boundingRect.top,
                        boundingRect.left,
                        boundingRect.width,
                        props.open && !props.alwaysOpen,
                        true
                    ),
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
    }, [valuesListPositionRef.current, popup.current, props.open]);
    return (
        <>
            <div
                ref={valuesListPositionRef}
                className="WebvizAttributesSelector__ValuesList WebvizAttributesSelector__ValuesList__Position"
            ></div>
            {props.alwaysOpen && valuesList()}
        </>
    );
};
