/* eslint no-magic-numbers: 0 */
import React, { Component } from "react";

import { WebvizContainerPlaceholder } from "../lib";

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
