export default class TagDataObject {
    constructor({
        activeDataIndex = 0,
        data = [""],
        ref = undefined,
        selected = false,
        props
    }) {
        // Private members
        var activeDataIndex = activeDataIndex;
        var data = data;
        var ref = ref;
        var selected = selected;

        // Public members
        this.delimiter = props.delimiter;
        this.props = props;
        this.numMatchedTags = 0;

        // Getters
        this.data = (index = undefined) => {
            if (index === undefined) {
                return data;
            }
            if (index >= 0 && index < data.length)
                return data[index];
            else
                throw "The given index is out of bounds";
        }
        this.activeData = () => data[activeDataIndex];
        this.ref = () => ref;
        this.activeDataIndex = () => activeDataIndex;
        this.selected = () => selected;
        this.countData = () => data.length;
        this.numMetaData = () => this.props.numMetaData;

        // Setters
        this.setActiveDataIndex = (index, global = true) => {
            if (!global && activeDataIndex >= this.numMetaData()) {
                activeDataIndex = index + this.numMetaData();
            }
            else {
                activeDataIndex = index;
            }
            this.tidy();
        }
        this.incrementDataIndex = () => {
            if (activeDataIndex < this.countData() - 1) {
                activeDataIndex++;
            }
            else if (!this.isValid()) {
                activeDataIndex++;
                data[activeDataIndex] = "";
            }
        }
        this.decrementDataIndex = () => {
            activeDataIndex--;
            this.tidy();
        };
        this.setData = (d, index = undefined) => {
            if (index !== undefined) {
                data[index] = d;
            }
            else {
                data[activeDataIndex] = d;
            }
        };
        this.setDataArray = (dataArray) => {
            data = dataArray;
        }
        this.unselect = () => selected = false;
        this.select = () => selected = true;
        this.setActive = (active) => this.active = active;
        this.setRef = (r) => ref = r;
    }

    value() {
        return this.data().join(this.delimiter);
    }

    colors() {
        let colors = [];
        for (let i = 0; i < this.countData(); i++) {
            if (i >= this.numMetaData())
                break;

            const availableData = this.availableDataAtIndex(i, true, false);
            for (const data of availableData) {
                if (data["color"] !== undefined && !colors.some((el) => el === data["color"])) {
                    colors.push(data["color"]);
                }
            }
        }
        return colors;
    }

    icons() {
        let icons = [];
        for (let i = 0; i < this.countData(); i++) {
            if (i >= this.numMetaData())
                break;

            const availableData = this.availableDataAtIndex(i, true, false);
            for (const data of availableData) {
                if (data["icon"] !== undefined && !icons.some((el) => el === data["icon"])) {
                    icons.push(data["icon"]);
                }
            }
        }
        return icons;
    }

    equals(other) {
        return JSON.stringify(this.data()) == JSON.stringify(other.data());
    }

    contains(other) {
        if (this.containsWildcard() && !other.containsWildcard()) {
            return this.matchedTags().includes(other.completeName());
        }
        else if (!this.containsWildcard() && other.containsWildcard()) {
            return other.matchedTags().includes(this.completeName());
        }
        else if (this.containsWildcard() && other.containsWildCard()) {
            const otherMatchedTags = other.matchedTags();
            return this.matchedTags.some((el) => otherMatchedTags.contains(el));
        }
        else {
            return this.equals(other);
        }
    }

    isMetaData() {
        return this.activeDataIndex() < this.numMetaData();
    }

    name() {
        if (this.activeDataIndex() < this.numMetaData) {
            return this.activeData();
        } else {
            let text = "";
            for (let i = 0; i < this.data().length; i++) {
                const el = this.data(i);
                if (this.activeDataIndex() == i && i < this.numMetaData()) {
                    text = el
                    break;
                }
                else if (i >= this.numMetaData()) {
                    if (el === "" && this.activeDataIndex() < i) break;
                    text += text == "" ? el : this.delimiter + el;
                }
            }
            return text;
        }
    }

    completeName() {
        let text = "";
        for (let i = 0; i < this.data().length; i++) {
            const el = this.data(i);
            text += text == "" ? el : this.delimiter + el;
        }
        return text;
    }

    debugOutput() {
        return this.data().join(":");
    }

    isComplete() {
        this.numberOfMatches() > 0;
    }

    testExpression(expression, str, startsWith = false, strict = false) {
        if (strict) {
            if (startsWith) {
                return str.startsWith(expression);
            } else {
                return str === expression;
            }
        }
        let re = new RegExp("^" + expression.replaceAll("*", ".*").replaceAll("?", ".") + (startsWith ? "" : "$"));
        return re.test(str);
    }

    isTag() {
        return this.activeDataIndex() > 0 || (this.numMetaData() == 0 && this.data().length > 1);
    }

    isEmpty() {
        return !this.isTag() && this.activeData() == "";
    }

    checkIfValid(data, index) {
        if (index >= this.countData()) {
            if (Object.keys(data).length === 0) {
                return true;
            }
            else {
                return false;
            }
        }

        const el = this.data()[index];
        var result = false;
        if (index >= this.countData() && Object.keys(data).length === 0) {
            result |= true;
        }
        else if (el.includes("?") || el.includes("*")) {
            const keys = Object.keys(data);
            const filteredkeys = keys.filter((e) => this.testExpression(el, e));
            for (let k of filteredkeys) {
                result |= this.checkIfValid(data[k].data, index + 1);
            }
        }
        else if (el in data) {
            result |= this.checkIfValid(data[el].data, index + 1);
        }
        return result;
    }

    tidy() {
        let newData = [];
        for (let i = 0; i < this.countData(); i++) {
            if (i > this.activeDataIndex() && this.data(i) == "") {
                break;
            }
            newData[i] = this.data(i);
        }
        this.setDataArray(newData);
    }

    isValid() {
        var data = this.props.data;
        return this.checkIfValid(data, 0);
    }

    numberOfMatches() {
        var numMatches = 0;
        let searchForMatches = (data, index) => {
            const keys = Object.keys(data);
            const el = this.data()[index];
            const filteredkeys = keys.filter((e) => this.testExpression(el, e));
            if (index == this.activeDataIndex()) {
                numMatches += filteredkeys.length;
            }
            else {
                for (const k of filteredkeys) {
                    searchForMatches(data[k].data, index + 1);
                }
            }
        }

        searchForMatches(this.props.data, 0);
        return numMatches;
    }

    matchedTags() {
        var matchedTags = [];

        let searchForMatchedTags = (data, index, name) => {
            const keys = Object.keys(data);
            const el = this.data()[index];
            const filteredkeys = keys.filter((e) => this.testExpression(el, e, false));
            if (index == this.activeDataIndex()) {
                matchedTags.push(...filteredkeys.map((key, i) => name + key));
            }
            else {
                for (const k of filteredkeys) {
                    searchForMatchedTags(data[k].data, index + 1, name + k + this.delimiter);
                }
            }
        }

        searchForMatchedTags(this.props.data, 0, "");
        this.numMatchedTags = matchedTags.length;
        return matchedTags;
    }

    availableData(filtered = true, openEnd = true, countAll = false) {
        var availableData = [];

        let searchForAvailableData = (data, index) => {
            const keys = Object.keys(data);
            const el = this.data()[index];
            const filteredkeys = keys.filter((e) => (!filtered && index == this.activeDataIndex()) ? true : this.testExpression(el, e, openEnd));
            if (index == this.activeDataIndex()) {
                availableData.push(...filteredkeys.map((key, i) => {
                    if (!countAll && availableData.some((k) => k["name"] === key))
                        return {};

                    let ret = {
                        name: key,
                        description: data[key]["description"]
                    };
                    if (data[key]["color"] !== undefined) {
                        Object.assign(ret, { color: data[key]["color"] });
                    }
                    if (data[key]["icon"] !== undefined) {
                        Object.assign(ret, { icon: data[key]["icon"] });
                    }
                    return ret;

                }).filter((el) => el.name !== undefined));
            }
            else {
                for (const k of filteredkeys) {
                    searchForAvailableData(data[k].data, index + 1);
                }
            }
        }

        searchForAvailableData(this.props.data, 0);
        return availableData;
    }

    availableDataAtIndex(requestedIndex, filtered = true, openEnd = true) {
        var availableData = [];

        let searchForAvailableData = (data, index) => {
            const keys = Object.keys(data);
            const el = this.data()[index];
            const filteredkeys = keys.filter((e) => (!filtered && index == requestedIndex) ? true : this.testExpression(el, e, openEnd));
            if (index == requestedIndex) {
                availableData.push(...filteredkeys.map((key, i) => {
                    let ret = {
                        name: key,
                        description: data[key]["description"]
                    };
                    if (data[key]["color"] !== undefined) {
                        Object.assign(ret, { color: data[key]["color"] });
                    }
                    if (data[key]["icon"] !== undefined) {
                        Object.assign(ret, { icon: data[key]["icon"] });
                    }
                    return ret;
                }));
            }
            else {
                for (const k of filteredkeys) {
                    searchForAvailableData(data[k].data, index + 1);
                }
            }
        }

        searchForAvailableData(this.props.data, 0);
        return availableData;
    }

    countMatchedTags(tag) {
        return this.matchedTags().length;
    }

    hasAvailableData(index) {
        var data = this.props.data;
        for (let el of this.data()) {
            data = data[el].data;
        }
        return (typeof data == 'object' && data.length > 0);
    }

    containsWildcard() {
        for (let el of this.data()) {
            if (el.includes("?") || el.includes("*")) {
                return true;
            }
        }
        return false;
    }

    currentValueContainsWildcard() {
        return (this.activeData().includes("?") || this.activeData().includes("*"));
    }

    clone() {
        return new TagDataObject({
            activeDataIndex: this.activeDataIndex(),
            data: this.data(),
            ref: undefined,
            selected: false,
            props: this.props
        });
    }
}