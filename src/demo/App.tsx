/* eslint no-magic-numbers: 0 */
import React, { Component } from "react";

import { WebvizPluginPlaceholder } from "../lib";

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
    constructor(props) {
        super(props);

        this.setProps = this.setProps.bind(this);
    }

    setProps(newProps) {
        this.setState(newProps);
    }

    render() {
        return (
            <div>
                <WebvizPluginPlaceholder
                    id={"placeholder"}
                    setProps={this.setProps}
                    tour_steps={steps}
                />
            </div>
        );
    }
}

export default App;
