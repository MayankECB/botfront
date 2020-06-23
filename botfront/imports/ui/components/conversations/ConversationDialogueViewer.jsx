import React, { useMemo, useContext } from 'react';
import PropTypes from 'prop-types';
import ReactJson from 'react-json-view';
import { Comment, Message } from 'semantic-ui-react';
import { generateTurns } from './utils';
import { ProjectContext } from '../../layouts/context';

import UserUtteredEventViewer from '../example_editor/UserUtteredEventViewer';

function BotResponse({
    type, text, data,
}) {
    if (!text && !data) {
        return null;
    }
    // remove empty attributes
    if (data) Object.keys(data).forEach(key => (data[key] == null) && delete data[key]);

    const dataEmpty = !data || !Object.keys(data).length;
    return (
        <div className='bot-response-message'>
            {text && <p className='bot-response-text'>{text}</p>}
            {!dataEmpty && <ReactJson className='bot-response-json' src={data} collapsed name={type} />}
        </div>
    );
}

BotResponse.propTypes = {
    type: PropTypes.string.isRequired,
    text: PropTypes.string,
    data: PropTypes.object,
};

BotResponse.defaultProps = {
    text: '',
    data: null,
};

function Turn({
    userSays, userId, botResponses,
}) {
    if (!userSays && botResponses.length === 0) {
        return null;
    }

    return (
        <Comment>
            {userSays && ([
                <Comment.Avatar src='/images/avatars/matt.jpg' />,
                <UserUtteredEventViewer
                    event={userSays}
                    author={userId}
                />,
            ])}
            <Comment.Group>
                <Comment>
                    <Comment.Avatar src='/images/avatars/mrbot.png' />
                    <Comment.Content>
                        <Comment.Author as='a'>Bot</Comment.Author>
                        <Comment.Metadata>
                        </Comment.Metadata>
                        <Comment.Text>
                            {botResponses.map((response, index) => (
                                <React.Fragment key={`bot-response-${index}`}>
                                    <BotResponse {...response} />
                                </React.Fragment>
                            ))}
                        </Comment.Text>
                        <Comment.Actions>
                        </Comment.Actions>
                    </Comment.Content>
                </Comment>
            </Comment.Group>
        </Comment>
    );
}

Turn.propTypes = {
    userSays: PropTypes.object,
    userId: PropTypes.string,
    botResponses: PropTypes.arrayOf(PropTypes.object).isRequired,
};

Turn.defaultProps = {
    userSays: null,
    userId: null,
};

function ConversationDialogueViewer({ conversation: { tracker, userId }, mode }) {
    const { timezoneOffset } = useContext(ProjectContext);
    const turns = useMemo(() => generateTurns(tracker, mode === 'debug', timezoneOffset), [tracker]);

    return (
        <Comment.Group>
            {turns.length > 0 ? (
                turns.map(({ userSays, botResponses }, index) => (
                    <React.Fragment key={`dialogue-turn-${index}`}>
                        <Turn userSays={userSays} userId={userId} botResponses={botResponses} />
                    </React.Fragment>
                ))
            ) : (
                <Message
                    info
                    icon='warning'
                    header='No events to show'
                    content={(() => {
                        if (mode !== 'debug') {
                            return 'check debug mode for non-dialogue events.';
                        }

                        return 'check JSON mode to view the full tracker object.';
                    })()}
                />
            )}
        </Comment.Group>
    );
}

ConversationDialogueViewer.propTypes = {
    conversation: PropTypes.object.isRequired,
    mode: PropTypes.string,
};

ConversationDialogueViewer.defaultProps = {
    mode: 'text',
};

export default ConversationDialogueViewer;
