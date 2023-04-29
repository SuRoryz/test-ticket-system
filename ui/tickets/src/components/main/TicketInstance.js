import React from 'react';

function TicketInstance({ticket, onClick}) {
    const tags = [];
    
    if ( ticket.tags ) {
        ticket.tags.split(";").forEach((element, index) => {
            tags.push(<div className='ticket-tag'>{element}</div>)
        });
    }

    return (
        <div className={'ticket-instance' + (ticket.closed ? " Closed": "")} onClick={onClick}>
            <div className='ticket-instance-title'>
                <div className='ticket-instance-title'><div className='ticket-instance-title-id'>#{ticket.id}</div> {ticket.title}</div> { ticket.rating ? <div className='ticket-instance-rating'>Оценка пользователя: {ticket.rating}</div> : null}
            </div>
            <div className='ticket-instance-body'>
                <div className='ticket-instance-desc'>
                    {ticket.description.slice(0,64) + (ticket.description.length > 64 ? "..." : "")}
                </div>
                <div className={'ticket-instance-priority ' + "p-" + ticket.priority}>
                    o
                </div>
            </div>
            <div className='ticket-instance-footer'>
                <div className='ticket-instance-tags'>
                    {tags}
                </div>
            </div>
        </div>
    )
}

export default TicketInstance;