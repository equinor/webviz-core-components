import React from 'react';
import PropTypes from 'prop-types';

import { WebvizPluginPlaceholder } from '../src/lib';
import { PropType } from './WebvizPluginPlaceholder.test';


export const WebvizPluginPlaceholderInteractiveContainer: React.FC = (): JSX.Element => {
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

    const setProps = (props: PropType): void => {
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

WebvizPluginPlaceholderInteractiveContainer.propTypes = {
    data_requested: PropTypes.number
};
