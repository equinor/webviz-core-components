/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */


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
    constructor(props: object) {
        super(props);

        this.setProps = this.setProps.bind(this);
    }

    setProps(newProps: object): void {
        this.setState(newProps);
    }

    render(): React.ReactNode {
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
