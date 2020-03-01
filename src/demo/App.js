/* eslint no-magic-numbers: 0 */
import React, { Component } from "react";

import { Draggable } from "../lib";

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
                <Draggable id={"test"} children={"Drag me"} />
            </div>
        );
    }
}

export default App;
