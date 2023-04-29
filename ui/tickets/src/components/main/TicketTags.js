import React from 'react';
import { useState } from "react"
import Cookies from 'js-cookie';
import { useNavigate } from "react-router-dom";

function TicketTags({tags, ticket_id}) {
    const [editMode, setEditMode] = useState(false);
    const [tagsList, setTagsList] = useState(tags.split(";"))
    const navigate = useNavigate()

    async function changeTags(e, ticket_id, onSuccess) {
        e.preventDefault();
        let formData = new FormData();

        formData.append("tags", e.target[0].value.split(" ").join(";"));
    
        const data = await fetch(
            "http://localhost:8000/api/tickets/auth/edit_tags/" + ticket_id,
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
    
        onSuccess()
    }

    return (
        <div className='ticket-tags-wrapper' onClick={() => !editMode ? setEditMode(true) : null }>
            <div className='ticket-tags-title'>
                Теги:
            </div>
            <div className='ticket-tags-line'>
                { editMode ?
                <form onSubmit={(e) => {changeTags(e, ticket_id, () => {
                        setTagsList(e.target[0].value.split(" "));
                        setEditMode(false);
                    }
                )}}>
                    <div className='ticket-tags-edit-wrapper'>
                        <input className='ticket-tags-edit-input' defaultValue={tagsList.join(" ")}/>
                        <input type='submit' value="Сохранить"/>
                    </div>
                </form> :
                tagsList.map((e) => {
                    return <div key={e} className='ticket-tag'>{e}</div>
                })}
            </div>
        </div>
    )
}

export default TicketTags;