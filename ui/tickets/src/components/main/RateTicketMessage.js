import React from 'react';

function RateTicketMessage({onRate}) {
    return (
        <div className='system-message rate'>
            <div className='ticket-rate'>
                <form onSubmit={onRate}>
                    <div className='rate-wrapper'>
                        <label htmlFor='ticket-rate-input'>Оцените работу поддержки</label>
                        <select id='ticket-rate-input'>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                        </select>
                    </div>
                    <input type='submit'></input>
                </form>
            </div>
        </div>
    )
}

export default RateTicketMessage;