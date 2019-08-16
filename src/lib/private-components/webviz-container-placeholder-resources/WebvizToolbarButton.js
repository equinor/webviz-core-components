import React, {Component} from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export default class WebvizToolbarButton extends Component {
    render() {
        return (
            <div className='webviz-config-tooltip-wrapper'>
                <FontAwesomeIcon
                    icon={this.props.icon}
                    className={'webviz-config-container-button' + (this.props.selected ? ' webviz-config-container-button-selected' : '')}
                    onClick={this.props.onClick}
                />
                <div className='webviz-config-tooltip'>
                    {this.props.tooltip}
                </div>
            </div>
        );
    }
}
