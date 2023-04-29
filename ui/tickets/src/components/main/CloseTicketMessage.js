import React from 'react';

function CloseTicketMessage({onYes, setClose}) {
    return (
        <div className='system-message'>
            <div className='ticket-close'>
                Ваш вопрос решён?
                <div className='ticket-close-wrapper'>
                    <div className='ticket-close-option' onClick={onYes}>
                        Да
                    </div>
                    <div className='ticket-close-option' onClick={setClose}>
                        Нет
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CloseTicketMessage;