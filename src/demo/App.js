/* eslint no-magic-numbers: 0 */
import React, { Component } from "react";

import { WebvizContainerPlaceholder } from "../lib";

const steps = [
    {
        target: "#green-rect",
        content: "This is my awesome feature!",
        disableBeacon: true,
        placement: "auto",
        title: "Some title1",
    },
    {
        target: "#blue-rect",
        content: "This is another awesome feature!",
        disableBeacon: true,
        placement: "auto",
        title: "Some title2",
    },
];

class App extends Component {
    constructor() {
        super();

        this.setProps = this.setProps.bind(this);
    }

    setProps(newProps) {
        this.setState(newProps);
    }

    render() {
        return (
            <div>
                <WebvizContainerPlaceholder
                    setProps={this.setProps}
                    tour_steps={steps}
                />
            </div>
        );
    }
}

export default App;
