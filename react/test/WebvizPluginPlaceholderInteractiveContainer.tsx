import React from 'react';
import { WebvizPluginPlaceholder } from '../src/lib';
import { PropType } from './WebvizPluginPlaceholder.test';

type Download = {
    filename: string,
    content: string,
    mime_type: string
};


export const WebvizPluginPlaceholderInteractiveContainer = () => {
    const [download, setDownload] = React.useState(undefined);

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

    const setProps = (props: PropType) => {
        if (props.data_requested) {
            setDownload({
                filename: "test.txt",
                content: "test",
                mime_type: "application/txt"
            });
        }
    };

    return (
        <WebvizPluginPlaceholder
            id="WebvizPluginPlaceholder"
            tour_steps={steps}
            setProps={setProps}
            download={download}
        />
    )
};
