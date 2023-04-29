import React from 'react';

function MessageInstance({text, owner, userID}) {
    return (
        <div className={'message-instance'  + (owner == userID ? " my" : "") }>
            <div className='ticket-instance-text'>
                {text}
            </div>
        </div>
    )
}

export default MessageInstance;