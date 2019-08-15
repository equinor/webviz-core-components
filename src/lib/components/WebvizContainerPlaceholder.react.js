import React, {Component} from 'react';
import PropTypes from 'prop-types';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileCsv, faAddressCard, faQuestionCircle, faCameraRetro } from '@fortawesome/free-solid-svg-icons'

import './webviz_container_component.css'





class WebvizToolbarButton extends Component {

    render() {
        return (
            <div className='webviz-config-tooltip-wrapper'>
                <FontAwesomeIcon icon={this.props.icon} className='webviz-config-container-button' onClick={this.props.onClick} />
                <div className='webviz-config-tooltip'>
                    {this.props.tooltip}
                </div>
            </div>
        );
    }
}



/**
 * WebvizContainerPlaceholder is a fundamental webviz dash component.
 * It takes a property, `label`, and displays it.
 * It renders an input with the property `value` which is editable by the user.
 */
export default class WebvizContainerPlaceholder extends Component {

    componentDidUpdate(prevProps) {
        if (this.props.csv_data !== '') {
            const blob = new Blob([this.props.csv_data], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");

            link.setAttribute("href", URL.createObjectURL(blob));
            link.setAttribute("download", "webviz-data-download.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.props.setProps({csv_data: ''});
        }
    }

    render() {
        const { id } = this.props;

        return (
            <div id={id} className='webviz-config-container-wrapper'>
                <div style={{paddingRight: '15px'}}>
                    {this.props.children}
                </div>
                <div className='webviz-config-container-buttonbar'>
                    { this.props.buttons.includes('csv_file') &&
                        <WebvizToolbarButton icon={faFileCsv} tooltip='Download data' onClick={() => this.props.setProps({csv_requested: this.props.csv_requested + 1})} />
                    }
                    { this.props.buttons.includes('contact_person') &&
                        <WebvizToolbarButton icon={faAddressCard} tooltip='Contact person' />
                    }
                    { this.props.buttons.includes('guided_tour') &&
                        <WebvizToolbarButton icon={faQuestionCircle} tooltip='Guided tour' />
                    }
                    { this.props.buttons.includes('screenshot') &&
                        <WebvizToolbarButton icon={faCameraRetro} tooltip="Take screenshot" />
                    }
                </div>
            </div>
        );
    }
}
            
WebvizContainerPlaceholder.defaultProps = {
    csv_requested: 0,
    buttons: [],
    csv_data: ''
};

WebvizContainerPlaceholder.propTypes = {
    /**
     * The ID used to identify this component in Dash callbacks
     */
    id: PropTypes.string,

    /**
     * The children of this component
     */
    children: PropTypes.node,

    /**
     * Array of strings, representing which buttons to render. Full set is
     * ['csv_file', 'contact_person', 'guided_tour', 'screenshot']
     */
    buttons: PropTypes.array,

    /**
     * The csv data to download (when user clicks on the download csv file icon.
     */
    csv_data: PropTypes.string,

    /**
     * An integer that represents the number of times
     * that the csv download button has been clicked.
     */
    csv_requested: PropTypes.number,

    /**
     * Dash-assigned callback that should be called whenever any of the
     * properties change
     */
    setProps: PropTypes.func
};
