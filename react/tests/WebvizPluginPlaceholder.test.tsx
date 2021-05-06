import React from 'react';
import { render, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WebvizPluginPlaceholder } from '../src/lib';
import { WebvizPluginPlaceholderInteractiveContainer } from './WebvizPluginPlaceholderInteractiveContainer';

export type PropType = {
    data_requested?: number;
};


const renderWebvizPluginPlaceholder = (
): RenderResult => {
    const steps = [
        {
            selector: "#blue-rect",
            content: "This is my first step",
        },
        {
            selector: "#green-rect",
            content: "This is my second step",
        },
    ];
    return render(
        <WebvizPluginPlaceholder
            id="WebvizPluginPlaceholder"
            tour_steps={steps}
            setProps={() => { return; }}
            deprecation_warnings={
                [
                    {
                        message: "Deprecated 1",
                        url: "https://github.com/equinor/webviz-core-components"
                    },
                    {
                        message: "Deprecated 2",
                        url: "https://github.com/equinor/webviz-core-components"
                    }
                ]
            }
        />
    );
}

const renderInteractiveWebvizPluginPlaceholder = (): RenderResult => {
    return render(<WebvizPluginPlaceholderInteractiveContainer />);
};

describe('WebvizPluginPlaceholder', () => {

    it('Renders correctly (compare to snapshot in ./__snapshots__/WebvizPluginPlaceholder.test.tsx.snap)', () => {
        const { container } = renderWebvizPluginPlaceholder();
        expect(container).toMatchSnapshot();
    });

    it('Data is downloaded correctly', () => {
        const { container } = renderInteractiveWebvizPluginPlaceholder();

        const link = document.createElement("a");

        jest.spyOn(document, "createElement").mockImplementationOnce(() => link);

        expect(container).toBeDefined();

        const button = container.querySelectorAll(".webviz-config-plugin-button")[2] as HTMLElement;
        expect(button).toBeDefined();

        userEvent.click(button);

        expect(link.href).toEqual('data:application/txt;base64,test');
        expect(link.download).toEqual("test.txt");
        jest.spyOn(document, "createElement").mockRestore();
    });

});
