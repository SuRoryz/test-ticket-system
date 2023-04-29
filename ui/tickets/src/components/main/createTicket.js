import React from 'react';
import Cookies from 'js-cookie';
import { useNavigate } from "react-router-dom";

function CreateTicketWindow ({setClosed}) {
    const navigate = useNavigate()

    function onSuccess(ticket_id) {
        if (!ticket_id) {
            return
        }

        navigate("/tickets/" + ticket_id)
    }

    function onSubmit (e) {
        e.preventDefault();
        console.log(e.target[0].value)
        console.log(e.target[1].value)
        console.log(e.target[2].value)

        let formData = new FormData();

        formData.append("title", e.target[0].value);
        formData.append("description", e.target[2].value);
        formData.append("priority", parseInt(e.target[1].value));
        formData.append("tags", e.target[3].value.split(" ").join(";"));

        const dataFetch = async () => {
            const data = await fetch(
                "/api/tickets/auth/add",
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        'accept': 'application/json',
                        'Authorization': "Bearer " + Cookies.get('access_token')
                    },
                    body: formData
                }
            ).then((res) => {
                if (res.status != 200) {navigate("/"); return false}
                return res.json()
            });

            onSuccess(data.ticket_id)
        }

        dataFetch();
    }

    return (
        <div className='ticket-window-wrapper' onClick={(e) => { if(e.target.className != "ticket-window-wrapper") { return }; setClosed() }}>
            <div className='ticket-window'>
                <div className='ticket-window-header'>
                    <div className='ticket-window-title'>Создать тикет</div>
                    <div className='ticket-window-close' onClick={() => setClosed()}>X</div>
                </div>
                
                <div className='ticket-window-form'>
                    <form onSubmit={(e) => onSubmit(e)}>
                        <div className='ticket-label-wrapper-wrapper'>
                            <div className='ticket-label-wrapper'>
                                <label htmlFor='ticket-title-input'>Тема</label>
                                <input id="ticket-title-input" name="ticket-title"></input>
                            </div>
                            <div className='ticket-label-wrapper'>
                                <label htmlFor='ticket-priority-input'>Приоритет</label>
                                <select id="ticket-priority-input" name="ticket-priority">
                                    <option value="1">Нормальный</option>
                                    <option value="2">Выше среднего</option>
                                    <option value="3">Критический</option>
                                </select>
                            </div>
                        </div>
                        <div className='ticket-label-wrapper'>
                            <div className='ticket-label-wrapper'>
                                <label htmlFor='ticket-title-input'>Описание</label>
                                <textarea auto id="ticket-desc-input" name="ticket-desc"/>
                            </div>
                        </div>
                        <div className='ticket-label-wrapper tags'>
                            <label htmlFor='ticket-title-input'>Теги (через пробел)</label>
                            <input id="ticket-tags-input" name="ticket-tags"></input>
                        </div>
                        <input type='submit'></input>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default CreateTicketWindow;