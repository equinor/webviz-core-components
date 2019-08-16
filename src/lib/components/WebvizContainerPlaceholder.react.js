import React, {Component} from 'react';
import PropTypes from 'prop-types';
import htmlToImage from 'html-to-image';

import { faFileCsv,
         faAddressCard,
         faQuestionCircle,
         faCameraRetro,
         faExpand } from '@fortawesome/free-solid-svg-icons'

import WebvizToolbarButton from '../private-components/webviz-container-placeholder-resources/WebvizToolbarButton'
import WebvizContentOverlay from '../private-components/webviz-container-placeholder-resources/WebvizContentOverlay'
import download_file from '../private-components/webviz-container-placeholder-resources/download_file'

import './webviz_container_component.css'

/**
 * WebvizContainerPlaceholder is a fundamental webviz dash component.
 * It takes a property, `label`, and displays it.
 * It renders an input with the property `value` which is editable by the user.
 */
export default class WebvizContainerPlaceholder extends Component {

    constructor(props) {
        super(props);
        this.state = {
            expanded: false,
            showOverlay: false
        }
    }

    componentDidUpdate(prevProps) {
        if (this.props.csv_string !== '') {
            const blob = new Blob([this.props.csv_string], { type: 'text/csv;charset=utf-8;' })
            download_file(blob, 'webviz-data.csv')
            this.props.setProps({csv_string: ''})
        }
    }

    render() {
        return (
            <div className={'webviz-config-container-wrapper' + (this.state.expanded ? ' webviz-config-container-expand' : '')}>
                <div id={this.props.id} className='webviz-container-content'>
                    {this.props.children}

                    <WebvizContentOverlay id={'overlay'.concat(this.props.id)} contactPerson={this.props.contact_person} showOverlay={this.state.showOverlay} />
                </div>
                <div className='webviz-config-container-buttonbar'>
                    { this.props.buttons.includes('csv_file') &&
                        <WebvizToolbarButton icon={faFileCsv} tooltip='Download data' onClick={() => this.props.setProps({csv_requested: this.props.csv_requested + 1})} />
                    }
                    { this.props.buttons.includes('contact_person') && Object.keys(this.props.contact_person).length > 0 &&
                        <WebvizToolbarButton icon={faAddressCard} tooltip='Contact person' selected={this.state.showOverlay} onClick={() => this.setState({showOverlay: !this.state.showOverlay})} />
                    }
                    { this.props.buttons.includes('guided_tour') &&
                        <WebvizToolbarButton icon={faQuestionCircle} tooltip='Guided tour' />
                    }
                    { this.props.buttons.includes('screenshot') &&
                        <WebvizToolbarButton icon={faCameraRetro} tooltip="Take screenshot" onClick={() => htmlToImage.toBlob(document.getElementById(this.props.id)).then(function (blob) {download_file(blob, 'webviz-screenshot-hei.png')}) }/>
                    }
                    { this.props.buttons.includes('expand') &&
                        <WebvizToolbarButton icon={faExpand} tooltip="Expand container" selected={this.state.expanded} onClick={() => this.setState({expanded: !this.state.expanded})} />
                    }
                </div>
            </div>
        );
    }
}
            
WebvizContainerPlaceholder.defaultProps = {
    id: 'some-id',
    buttons: ['csv_file', 'contact_person', 'guided_tour', 'screenshot', 'expand'],
    contact_person: {},
    csv_requested: 0,
    csv_string: ''
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
     * ['csv_file', 'contact_person', 'guided_tour', 'screenshot', 'expand']
     */
    buttons: PropTypes.array,

    /**
     * A dictionary of information regarding contact person for the data content.
     * Valid keys are 'name', 'email' and 'phone'.
     */
    contact_person: PropTypes.objectOf(PropTypes.string),

    /**
     * The csv data to download (when user clicks on the download csv file icon.
     */
    csv_string: PropTypes.string,

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
