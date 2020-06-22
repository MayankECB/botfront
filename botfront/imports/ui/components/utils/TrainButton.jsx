import React from 'react';
import PropTypes from 'prop-types';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import {
    Button, Popup, Icon, Checkbox,
} from 'semantic-ui-react';
import { wrapMeteorCallback } from './Errors';
import { isTraining } from '../../../api/nlu_model/nlu_model.utils';
import { StoryGroups } from '../../../api/storyGroups/storyGroups.collection';

class TrainButton extends React.Component {
    copyToClipboard = () => {
        const { projectId } = this.props;
        const dummy = document.createElement('textarea');
        document.body.appendChild(dummy);
        dummy.value = `${window.location.origin.toString()}/chat/${projectId}/`;
        dummy.select();
        document.execCommand('copy');
        document.body.removeChild(dummy);
    }

    train = () => {
        const { instance, projectId } = this.props;
        Meteor.call('project.markTrainingStarted', projectId);
        Meteor.call('rasa.train', projectId, instance, wrapMeteorCallback());
    };

    renderButton = (project, instance, popupContent) => (!popupContent ? (
        <Button
            color='blue'
            icon='grid layout'
            content='Train everything'
            labelPosition='left'
            disabled={isTraining(project) || !instance}
            loading={isTraining(project)}
            onClick={this.train}
            compact
            data-cy='train-button'
        />
    ) : (
        <Popup
            content={popupContent}
            trigger={(
                <Button
                    color='yellow'
                    icon='eye'
                    content='Partial training'
                    labelPosition='left'
                    disabled={isTraining(project) || !instance}
                    loading={isTraining(project)}
                    onClick={this.train}
                    data-cy='train-button'
                />
            )}
            // Popup is disabled while training
            disabled={project.training && project.training.status === 'training'}
            inverted
            size='tiny'
        />
    ));

    renderShareLink = () => {
        const {
            project: { enableSharing, _id: projectId },
        } = this.props;
        return (
            <Popup
                trigger={(
                    <Icon
                        name='mail forward'
                        color='grey'
                        size='large'
                        link
                        style={{ marginBottom: '5px' }}
                    />
                )}
                hoverable
                content={(
                    <div>
                        <Checkbox
                            toggle
                            checked={enableSharing}
                            onChange={() => Meteor.call(
                                'project.setEnableSharing',
                                projectId,
                                !enableSharing,
                            )
                            }
                            label={enableSharing ? 'Sharing enabled' : 'Sharing disabled'}
                        />
                        {enableSharing && (
                            <p>
                                <br />
                                <button type='button' className='link-like' onClick={this.copyToClipboard}>
                                    <Icon name='linkify' /> Copy link
                                </button>
                            </p>
                        )}
                    </div>
                )}
            />
        );
    };

    render() {
        const {
            project, instance, popupContent, ready,
        } = this.props;
        return (
            ready && (
                <div>
                    {this.renderButton(project, instance, popupContent)}
                    {this.renderShareLink()}
                </div>
            )
        );
    }
}

TrainButton.propTypes = {
    project: PropTypes.object.isRequired,
    projectId: PropTypes.string.isRequired,
    instance: PropTypes.object,
    popupContent: PropTypes.string,
    ready: PropTypes.bool.isRequired,
};

TrainButton.defaultProps = {
    instance: null,
    popupContent: '',
};

export default withTracker((props) => {
    // Gets the required number of selected storygroups and sets the content and popup for the train button
    const { projectId } = props;
    const storyGroupHandler = Meteor.subscribe('storiesGroup', projectId);
    const ready = storyGroupHandler.ready();
    let storyGroups;
    let selectedStoryGroups;
    let popupContent;
    if (ready) {
        storyGroups = StoryGroups.find({ projectId }, { field: { _id: 1 } }).fetch();
        selectedStoryGroups = storyGroups.filter(storyGroup => storyGroup.selected);

        if (selectedStoryGroups && selectedStoryGroups.length > 1) {
            popupContent = `Train NLU and stories from ${selectedStoryGroups.length} focused story groups.`;
        } else if (selectedStoryGroups && selectedStoryGroups.length === 1) {
            popupContent = 'Train NLU and stories from 1 focused story group.';
        }
    }

    return {
        ready,
        popupContent,
    };
})(TrainButton);
