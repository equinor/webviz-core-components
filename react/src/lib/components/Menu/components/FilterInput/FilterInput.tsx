import React from "react";
import PropTypes from "prop-types";
import { Search } from "@equinor/eds-core-react";

type FilterInputProps = {
    filter: string;
    onFilterChange: (filterText: string) => void;
};

export const FilterInput: React.FC<FilterInputProps> = (props) => {
    return (
        <Search
            aria-label="Filter pages"
            id="menu-filter"
            placeholder="Filter pages..."
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                props.onFilterChange(e.target.value)
            }
        />
    );
};

FilterInput.propTypes = {
    filter: PropTypes.string.isRequired,
    onFilterChange: PropTypes.func.isRequired,
};
