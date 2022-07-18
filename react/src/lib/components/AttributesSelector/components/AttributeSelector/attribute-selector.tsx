import React from "react";
import { Attribute } from "../../types";

import { CollapseExpandButton, ValuesList } from "./components";
import "./attribute-selector.css";

export type AttributeSelectorProps = {
    id: string;
    attribute: Attribute;
};

export const AttributeSelector: React.FC<AttributeSelectorProps> = (props) => {
    const [selectedValues, setSelectedValues] = React.useState<string[]>([]);
    const [active, setActive] = React.useState<boolean>(false);
    const [alwaysOpen, setAlwaysOpen] = React.useState<boolean>(false);

    const contentRef = React.useRef<HTMLUListElement | null>(null);

    React.useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
            if (e.target === contentRef.current) {
                const input = document.getElementById(
                    `WebvizAttributeSelector_${props.id}`
                );
                if (input) {
                    input.focus();
                    (input as HTMLInputElement).setSelectionRange(0, 0);
                    e.preventDefault();
                }
            }
        };
        if (contentRef.current) {
            contentRef.current.addEventListener("mousedown", handleMouseDown);
        }

        return () => {
            if (contentRef.current) {
                contentRef.current.removeEventListener(
                    "mousedown",
                    handleMouseDown
                );
            }
        };
    }, [contentRef.current]);

    return (
        <div className="WebvizAttributeSelector">
            <div className="WebvizAttributeSelector__Header">
                <label htmlFor={`WebvizAttributeSelector_${props.id}`}>
                    {props.attribute.name}
                </label>
                <CollapseExpandButton
                    expanded={alwaysOpen}
                    onToggle={(expanded: boolean) => setAlwaysOpen(expanded)}
                />
            </div>
            <ul
                className={`WebvizAttributeSelector__Content${
                    alwaysOpen
                        ? " WebvizAttributeSelector__Content--expanded"
                        : ""
                }`}
                ref={contentRef}
            >
                <input
                    id={`WebvizAttributeSelector_${props.id}`}
                    placeholder="Add attribute"
                    onFocus={() => setActive(true)}
                    onBlur={() => setActive(false)}
                />
            </ul>
            <ValuesList
                open={active}
                alwaysOpen={alwaysOpen}
                values={props.attribute.values}
                contentRef={contentRef}
            />
        </div>
    );
};
