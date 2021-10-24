import React from "react";
import { fireEvent, render, RenderResult } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SmartNodeSelector } from "../src/lib";
import { SmartNodeSelectorInteractiveContainer } from "./SmartNodeSelectorInteractiveContainer";

export type PropType = {
    selectedTags: string[];
    selectedNodes: string[];
    selectedIds: string[];
};

let parentProps: PropType = {
    selectedTags: [],
    selectedNodes: [],
    selectedIds: [],
};

const setProps = (props: PropType): void => {
    parentProps = props;
};

enum RenderDataStructure {
    Flat = 1,
    Deep,
    DeepWithMetaData,
    InvalidData,
}

const clearParentProps = () => {
    parentProps = {
        selectedTags: [],
        selectedNodes: [],
        selectedIds: [],
    };
};

const renderSmartNodeSelector = (
    renderDataStructure: RenderDataStructure,
    options: {
        showSuggestions?: boolean;
        initialTags?: string[];
        maxNumSelectedNodes?: number;
    } = {
        showSuggestions: true,
        initialTags: [],
        maxNumSelectedNodes: -1,
    }
): RenderResult => {
    let data = [];
    switch (renderDataStructure) {
        case RenderDataStructure.Flat:
            data = [
                {
                    id: "1",
                    name: "Data",
                    description: "Description",
                },
            ];
            break;
        case RenderDataStructure.Deep:
            data = [
                {
                    id: "1",
                    name: "Data",
                    description: "Description",
                    children: [
                        {
                            id: "1.1",
                            name: "Subdata",
                            description: "Description",
                        },
                    ],
                },
            ];
            break;
        case RenderDataStructure.DeepWithMetaData:
            data = [
                {
                    id: "1",
                    name: "Metadata 1",
                    description: "A first data source",
                    color: "#0095FF",
                    children: [
                        {
                            id: "1.1.1",
                            name: "Node 1",
                            description: "A first data node",
                            children: [
                                {
                                    id: "1.1.1.1",
                                    name: "Subnode 1",
                                    description: "A first sub node",
                                },
                            ],
                        },
                    ],
                },
            ];
            break;
        case RenderDataStructure.InvalidData:
            data = [
                {
                    id: "1",
                    name: "Metadata 1",
                    description: "Description",
                    children: [
                        {
                            id: "1.1",
                            name: "",
                            description: "Description",
                        },
                    ],
                },
            ];
    }

    return render(
        <SmartNodeSelector
            id="SmartNodeSelector"
            key="SmartNodeSelector"
            delimiter=":"
            selectedTags={options.initialTags}
            showSuggestions={options.showSuggestions}
            setProps={setProps}
            label="Smart Node Selector"
            numSecondsUntilSuggestionsAreShown={0.5}
            data={data}
        />
    );
};

const renderInteractiveSmartNodeSelector = (): RenderResult => {
    return render(
        <SmartNodeSelectorInteractiveContainer setProps={setProps} />
    );
};

describe("SmartNodeSelector", () => {
    afterEach(() => {
        clearParentProps();
    });

    it("Renders correctly (compare to snapshot in ./__snapshots__/SmartNodeSelector.test.tsx.snap)", () => {
        const { container } = renderSmartNodeSelector(RenderDataStructure.Flat);
        expect(container).toMatchSnapshot();
    });

    it("Entering valid data node name and checking if tag is created (tree levels: 1)", () => {
        const { container } = renderSmartNodeSelector(
            RenderDataStructure.Flat,
            { showSuggestions: false }
        );

        const smartNodeSelector = container.firstChild as HTMLElement;

        const firstTag = smartNodeSelector.querySelector(
            ".SmartNodeSelector__Tag"
        ) as HTMLElement;
        const firstInput = firstTag.querySelector("input");

        userEvent.type(firstInput, "Data");
        fireEvent.keyDown(firstInput, { key: "Enter" });
        fireEvent.keyUp(firstInput, { key: "Enter" });

        expect(
            firstTag.classList.contains("SmartNodeSelector__Border")
        ).toBeTruthy();
        expect(firstTag.title === firstInput.value).toBeTruthy();
    });

    it("Entering valid data node name and checking if tag is created (tree levels: 2)", () => {
        const { container } = renderSmartNodeSelector(
            RenderDataStructure.Deep,
            { showSuggestions: false }
        );

        const smartNodeSelector = container.firstChild as HTMLElement;

        const firstTag = smartNodeSelector.querySelector(
            ".SmartNodeSelector__Tag"
        ) as HTMLElement;
        const firstInput = firstTag.querySelector("input");

        userEvent.type(firstInput, "Data:");

        expect(
            (firstTag.children[1] as HTMLElement).classList.contains(
                "SmartNodeSelector__InnerTag"
            )
        ).toBeTruthy();
        expect(firstTag.title === "Invalid").toBeTruthy();

        userEvent.type(firstInput, "Subdata");

        fireEvent.keyDown(firstInput, { key: "Enter" });
        fireEvent.keyUp(firstInput, { key: "Enter" });

        expect(
            firstTag.classList.contains("SmartNodeSelector__Border")
        ).toBeTruthy();
        expect(firstTag.title === firstInput.value).toBeTruthy();
    });

    it("Entering valid data node name and then a duplicate", () => {
        const { container } = renderSmartNodeSelector(
            RenderDataStructure.Flat,
            { showSuggestions: false }
        );

        const smartNodeSelector = container.firstChild as HTMLElement;

        const firstTag = smartNodeSelector.querySelector(
            ".SmartNodeSelector__Tag"
        ) as HTMLElement;
        const firstInput = firstTag.querySelector("input");

        userEvent.type(firstInput, "Data");
        fireEvent.keyDown(firstInput, { key: "Enter" });
        fireEvent.keyUp(firstInput, { key: "Enter" });

        const secondTag = smartNodeSelector.querySelectorAll(
            ".SmartNodeSelector__Tag"
        )[1] as HTMLElement;
        const secondInput = secondTag.querySelector("input");

        userEvent.type(secondInput, "Data");
        fireEvent.keyDown(secondInput, { key: "Enter" });
        fireEvent.keyUp(secondInput, { key: "Enter" });

        expect(
            secondTag.classList.contains("SmartNodeSelector__Duplicate")
        ).toBeTruthy();
        expect(secondTag.title === "Duplicate").toBeTruthy();
    });

    it("Entering invalid data source name", () => {
        const { container } = renderSmartNodeSelector(
            RenderDataStructure.Deep,
            { showSuggestions: false }
        );

        const smartNodeSelector = container.firstChild as HTMLElement;

        const firstTag = smartNodeSelector.querySelector(
            ".SmartNodeSelector__Tag"
        ) as HTMLElement;
        const firstInput = firstTag.querySelector("input");

        userEvent.type(firstInput, "Data:Error");
        fireEvent.keyDown(firstInput, { key: "Enter" });
        fireEvent.keyUp(firstInput, { key: "Enter" });

        expect(
            firstTag.classList.contains("SmartNodeSelector__Invalid")
        ).toBeTruthy();
        expect(firstTag.title === "Invalid").toBeTruthy();
    });

    /*
    This test is not working anymore since the suggestions popup was moved to body. Apparently, 
    RTL does not recognize this properly. Disabled the test until a method is find to implemented
    it again.

    - RMT

    it("Suggestions are shown and contain expected options", (done) => {
        // eslint-disable-next-line no-undef
        jest.useFakeTimers();
        const { container } = renderSmartNodeSelector(RenderDataStructure.Deep);

        const smartNodeSelector = container.firstChild as HTMLElement;
        const firstTag = smartNodeSelector.querySelector(
            ".SmartNodeSelector__Tag"
        ) as HTMLElement;
        const firstInput = firstTag.querySelector("input");

        fireEvent.mouseDown(firstInput);

        setTimeout(() => {
            const suggestions = document.body.querySelector(
                ".Suggestions:not(.Suggestions__Position)"
            );
            expect(suggestions !== null).toBeTruthy();
            if (suggestions !== null) {
                const firstSuggestion = suggestions.querySelector(
                    ".Suggestions__Suggestion"
                );
                expect(firstSuggestion !== null).toBeTruthy();
            }
            done();
        }, 500);
        // eslint-disable-next-line no-undef
        jest.advanceTimersByTime(500);
    });
    */

    it("Remove button is working", () => {
        const { container } = renderSmartNodeSelector(
            RenderDataStructure.Flat,
            { showSuggestions: false }
        );

        const smartNodeSelector = container.firstChild as HTMLElement;

        const firstTag = smartNodeSelector.querySelector(
            ".SmartNodeSelector__Tag"
        ) as HTMLElement;
        const firstInput = firstTag.querySelector("input");

        userEvent.type(firstInput, "Data");
        fireEvent.keyDown(firstInput, { key: "Enter" });
        fireEvent.keyUp(firstInput, { key: "Enter" });

        expect(
            (firstTag.children[1] as HTMLElement).classList.contains(
                "SmartNodeSelector__InnerTag"
            )
        ).toBeTruthy();
        expect(firstTag.title === firstInput.value).toBeTruthy();
        expect(
            smartNodeSelector.querySelectorAll(".SmartNodeSelector__Tag")
                .length == 2
        ).toBeTruthy();

        const removeButton = firstTag.querySelector(
            ".SmartNodeSelector__RemoveButton"
        );
        expect(removeButton !== null).toBeTruthy();
        if (removeButton !== null) {
            userEvent.click(removeButton);
            expect(
                smartNodeSelector
                    .querySelector(".SmartNodeSelector__Tag")
                    .classList.contains("SmartNodeSelector__Border")
            ).toBeFalsy();
            expect(
                smartNodeSelector.querySelectorAll(".SmartNodeSelector__Tag")
            ).toHaveLength(1);
        }
    });

    it("Clear all button is working", () => {
        const { container } = renderSmartNodeSelector(
            RenderDataStructure.Flat,
            { showSuggestions: false }
        );

        const smartNodeSelector = container.firstChild as HTMLElement;

        const firstTag = smartNodeSelector.querySelector(
            ".SmartNodeSelector__Tag"
        ) as HTMLElement;
        const firstInput = firstTag.querySelector("input");

        userEvent.type(firstInput, "Data");
        fireEvent.keyDown(firstInput, { key: "Enter" });
        fireEvent.keyUp(firstInput, { key: "Enter" });

        expect(
            (firstTag.children[1] as HTMLElement).classList.contains(
                "SmartNodeSelector__InnerTag"
            )
        ).toBeTruthy();
        expect(firstTag.title === firstInput.value).toBeTruthy();
        expect(
            smartNodeSelector.querySelectorAll(".SmartNodeSelector__Tag")
                .length == 2
        ).toBeTruthy();

        const clearAllButton = smartNodeSelector.querySelector(
            ".SmartNodeSelector__ClearAll"
        ).firstChild as HTMLDivElement;

        expect(clearAllButton !== null).toBeTruthy();
        if (clearAllButton !== null) {
            userEvent.click(clearAllButton);
            expect(
                smartNodeSelector
                    .querySelector(".SmartNodeSelector__Tag")
                    .classList.contains("SmartNodeSelector__Border")
            ).toBeFalsy();
            expect(
                smartNodeSelector.querySelectorAll(".SmartNodeSelector__Tag")
            ).toHaveLength(1);
        }
    });

    const selectingTagsWithKeyboard = (numTags: number): HTMLElement => {
        const { container } = renderSmartNodeSelector(
            RenderDataStructure.Flat,
            { showSuggestions: false }
        );

        const smartNodeSelector = container.firstChild as HTMLElement;

        let lastTag: HTMLElement | undefined = undefined;
        let lastInput: HTMLInputElement | undefined = undefined;

        for (let i = 0; i < numTags; i++) {
            lastTag = smartNodeSelector.querySelectorAll(
                ".SmartNodeSelector__Tag"
            )[
                smartNodeSelector.querySelectorAll(".SmartNodeSelector__Tag")
                    .length - 1
            ] as HTMLElement;
            lastInput = lastTag.querySelector("input");
            userEvent.type(lastInput, "Data");
            fireEvent.keyDown(lastInput, { key: "Enter" });
            fireEvent.keyUp(lastInput, { key: "Enter" });
        }

        lastTag = smartNodeSelector.querySelectorAll(".SmartNodeSelector__Tag")[
            smartNodeSelector.querySelectorAll(".SmartNodeSelector__Tag")
                .length - 1
        ] as HTMLElement;
        lastInput = lastTag.querySelector("input");

        userEvent.click(lastInput);

        for (let i = 0; i < numTags; i++) {
            fireEvent.keyDown(i == 0 ? lastInput : document, {
                key: "ArrowLeft",
                shiftKey: true,
            });
        }

        return smartNodeSelector;
    };

    it("Selecting several tags with keyboard and delete using backspace", () => {
        const smartNodeSelector = selectingTagsWithKeyboard(3);
        expect(
            smartNodeSelector.querySelectorAll(
                ".SmartNodeSelector__TagSelected"
            )
        ).toHaveLength(3);
        fireEvent.keyDown(document, { key: "Backspace" });
        expect(
            smartNodeSelector.querySelectorAll(".SmartNodeSelector__Tag")
        ).toHaveLength(1);
    });

    it("Selecting several tags with keyboard and delete using delete", () => {
        const smartNodeSelector = selectingTagsWithKeyboard(3);

        expect(
            smartNodeSelector.querySelectorAll(
                ".SmartNodeSelector__TagSelected"
            )
        ).toHaveLength(3);
        fireEvent.keyDown(document, { key: "Delete" });
        expect(
            smartNodeSelector.querySelectorAll(".SmartNodeSelector__Tag")
        ).toHaveLength(1);
    });

    it("Selecting several tags and copy and pasting them", () => {
        const smartNodeSelector = selectingTagsWithKeyboard(3);
        const lastTag = smartNodeSelector.querySelectorAll(
            ".SmartNodeSelector__Tag"
        )[
            smartNodeSelector.querySelectorAll(".SmartNodeSelector__Tag")
                .length - 1
        ] as HTMLElement;
        const lastInput = lastTag.querySelector("input");

        expect(
            smartNodeSelector.querySelectorAll(
                ".SmartNodeSelector__TagSelected"
            )
        ).toHaveLength(3);
        fireEvent.keyDown(document, { key: "c", ctrlKey: true });
        userEvent.click(lastInput);
        fireEvent.keyDown(lastInput, { key: "v", ctrlKey: true });

        expect(
            smartNodeSelector.querySelectorAll(".SmartNodeSelector__Tag")
        ).toHaveLength(7);
    });

    it("Check if return values are correct", () => {
        const smartNodeSelector = selectingTagsWithKeyboard(3);
        const lastTag = smartNodeSelector.querySelectorAll(
            ".SmartNodeSelector__Tag"
        )[
            smartNodeSelector.querySelectorAll(".SmartNodeSelector__Tag")
                .length - 1
        ] as HTMLElement;
        const lastInput = lastTag.querySelector("input");

        fireEvent.keyDown(document, { key: "c", ctrlKey: true });
        userEvent.click(lastInput);
        fireEvent.keyDown(lastInput, { key: "v", ctrlKey: true });

        expect(parentProps.selectedTags).toHaveLength(6);
        expect(parentProps.selectedTags).toEqual([
            "Data",
            "Data",
            "Data",
            "Data",
            "Data",
            "Data",
        ]);
        expect(parentProps.selectedNodes).toHaveLength(1);
        expect(parentProps.selectedNodes[0]).toMatch("Data");
        expect(parentProps.selectedIds).toHaveLength(1);
        expect(parentProps.selectedIds[0]).toMatch("1");

        clearParentProps();
    });

    it("Check if initial properties can be set", () => {
        const { container } = renderSmartNodeSelector(
            RenderDataStructure.Deep,
            {
                showSuggestions: false,
                initialTags: ["Data:Subdata"],
            }
        );

        const smartNodeSelector = container.firstChild as HTMLElement;

        const firstTag = smartNodeSelector.querySelector(
            ".SmartNodeSelector__Tag"
        ) as HTMLElement;
        expect(
            (firstTag.children[1] as HTMLElement).classList.contains(
                "SmartNodeSelector__InnerTag"
            )
        ).toBeTruthy();
        expect(firstTag.title === "Data:Subdata").toBeTruthy();
        expect(
            smartNodeSelector.querySelectorAll(".SmartNodeSelector__Tag")
                .length == 2
        ).toBeTruthy();
    });

    it("Check if selected tags can be dynamically changed", () => {
        const { container } = renderInteractiveSmartNodeSelector();

        const smartNodeSelector = container.querySelector("#SmartNodeSelector");
        expect(smartNodeSelector).toBeDefined();

        const button = container.querySelector("#setValuesButton");
        expect(button).toBeDefined();

        expect(parentProps.selectedTags).toHaveLength(0);
        expect(parentProps.selectedNodes).toHaveLength(0);

        userEvent.click(button);

        expect(parentProps.selectedTags).toHaveLength(2);
        expect(parentProps.selectedTags[0]).toMatch("Data1");
        expect(parentProps.selectedTags[1]).toMatch("Data2");
        expect(parentProps.selectedNodes).toHaveLength(2);
        expect(parentProps.selectedNodes[0]).toMatch("Data1");
        expect(parentProps.selectedNodes[1]).toMatch("Data2");
        expect(parentProps.selectedIds).toHaveLength(2);
        expect(parentProps.selectedIds[0]).toMatch("1");
        expect(parentProps.selectedIds[1]).toMatch("2");

        clearParentProps();
    });

    it("Check if data can be dynamically changed", () => {
        const { container } = renderInteractiveSmartNodeSelector();

        const smartNodeSelector = container.querySelector("#SmartNodeSelector");
        expect(smartNodeSelector).toBeDefined();

        const button = container.querySelector("#setDataButton");
        expect(button).toBeDefined();

        const firstTag = smartNodeSelector.querySelector(
            ".SmartNodeSelector__Tag"
        ) as HTMLElement;
        const firstInput = firstTag.querySelector("input");

        userEvent.type(firstInput, "Data1");
        fireEvent.keyDown(firstInput, { key: "Enter" });
        fireEvent.keyUp(firstInput, { key: "Enter" });

        expect(
            firstTag.classList.contains("SmartNodeSelector__Border")
        ).toBeTruthy();
        expect(firstTag.title === firstInput.value).toBeTruthy();

        userEvent.click(button);

        expect(
            firstTag.classList.contains("SmartNodeSelector__Invalid")
        ).toBeTruthy();
        expect(firstTag.title === "Invalid").toBeTruthy();

        const clearAllButton = smartNodeSelector.querySelector(
            ".SmartNodeSelector__ClearAll"
        ).firstChild as HTMLDivElement;

        expect(clearAllButton !== null).toBeTruthy();
        if (clearAllButton !== null) {
            userEvent.click(clearAllButton);
            expect(
                smartNodeSelector
                    .querySelector(".SmartNodeSelector__Tag")
                    .classList.contains("SmartNodeSelector__Border")
            ).toBeFalsy();
            expect(
                smartNodeSelector.querySelectorAll(".SmartNodeSelector__Tag")
            ).toHaveLength(1);
        }

        userEvent.type(firstInput, "ChangedData1");
        fireEvent.keyDown(firstInput, { key: "Enter" });
        fireEvent.keyUp(firstInput, { key: "Enter" });

        expect(
            firstTag.classList.contains("SmartNodeSelector__Border")
        ).toBeTruthy();
        expect(firstTag.title === firstInput.value).toBeTruthy();

        clearParentProps();
    });

    it("Check if selecting a node in a single node selection is calling setProps correctly", () => {
        const { container } = renderSmartNodeSelector(
            RenderDataStructure.Flat,
            {
                showSuggestions: false,
                maxNumSelectedNodes: 1,
            }
        );

        const smartNodeSelector = container.firstChild as HTMLElement;

        const firstTag = smartNodeSelector.querySelector(
            ".SmartNodeSelector__Tag"
        ) as HTMLElement;
        const firstInput = firstTag.querySelector("input");

        userEvent.type(firstInput, "Data");
        fireEvent.keyDown(firstInput, { key: "Enter" });
        fireEvent.keyUp(firstInput, { key: "Enter" });

        expect(
            firstTag.classList.contains("SmartNodeSelector__Border")
        ).toBeTruthy();
        expect(firstTag.title === firstInput.value).toBeTruthy();

        expect(parentProps.selectedTags).toHaveLength(1);
        expect(parentProps.selectedTags[0]).toMatch("Data");
        expect(parentProps.selectedNodes).toHaveLength(1);
        expect(parentProps.selectedNodes[0]).toMatch("Data");
        expect(parentProps.selectedIds).toHaveLength(1);
        expect(parentProps.selectedIds[0]).toMatch("1");

        clearParentProps();
    });

    it("Ensure that invalid data throws exception", () => {
        jest.spyOn(console, "error").mockImplementation(jest.fn());
        const { container } = renderSmartNodeSelector(
            RenderDataStructure.InvalidData
        );

        const smartNodeSelector = container.firstChild as HTMLElement;
        expect(
            smartNodeSelector.classList.contains("SmartNodeSelector--Error")
        ).toBeTruthy();
        jest.spyOn(console, "error").mockRestore();
    });
});
