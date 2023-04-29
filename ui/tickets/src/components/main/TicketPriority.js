import React from 'react';
import { useState } from "react"
import Cookies from 'js-cookie';
import { useNavigate } from "react-router-dom";

function TicketPriority({InitPriority, ticket_id}) {
    const [priority, setPriority] = useState(InitPriority)
    const navigate = useNavigate()

    async function changePriority(e, ticket_id) {
        e.preventDefault();
        setPriority(parseInt(e.target[0].value))
        let formData = new FormData();

        formData.append("priority", parseInt(e.target[0].value));
    
        const data = await fetch(
            "/api/tickets/auth/set_priority/" + ticket_id,
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
    }

    return (
        <form className='ticket-priority' onSubmit={(e) => {changePriority(e, ticket_id)}}>
            <label htmlFor='ticket-priority-edit-input'>Приоритет: </label>
            <div className='priority-wrapper'>
                <select id='ticket-priority-edit-input' defaultValue={priority}>
                    <option value="1">Нормальный</option>
                    <option value="2">Выше среднего</option>
                    <option value="3">Критический</option>
                </select>
                <input type='submit' value="Сохранить"/>
            </div>  
        </form>
    )
}

export default TicketPriority;