import React from 'react';
import { useState, useEffect, useRef, useCallback } from "react"
import Cookies from 'js-cookie';
import MessageInstance from './messageInstance'
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import CloseTicketMessage from './CloseTicketMessage'
import RateTicketMessage from './RateTicketMessage'
import TicketTags from './TicketTags'
import TicketPriority from './TicketPriority'
import '../mainCss/Chat.css';

const useAllData = (ticketId) => {
    const [messages, setMessages] = useState();
    const [ticket, setTicket] = useState();
    const [askID, setAskID] = useState();

    const navigate = useNavigate()
  
    useEffect(() => {
      const dataFetch = async () => {
        // waiting for allthethings in parallel
        const result = (
          await Promise.all([
            fetch("/api/tickets/auth/fetch/" + ticketId, {
                credentials: "same-origin",
                headers: {
                    Authorization: "Bearer " + Cookies.get('access_token')
                }
            }),
            fetch("/api/tickets/auth/messages/" + ticketId, {
                credentials: "same-origin",
                headers: {
                    Authorization: "Bearer " + Cookies.get('access_token')
                }
            }),
            fetch("/api/tickets/auth/myID", {
                credentials: "same-origin",
                headers: {
                    Authorization: "Bearer " + Cookies.get('access_token')
                }
            })
          ])
        ).map((r)  => {if (r.status != 200) {navigate("/"); return false}; return r.json() });
  
        // and waiting a bit more - fetch API is cumbersome
        const [ticketResults, messagesResults, askIDResult] = await Promise.all(
          result
        );
  
        // when the data is ready, save it to state
        setTicket(ticketResults);
        setMessages(messagesResults);
        setAskID(askIDResult)
      };
  
      dataFetch();
    }, []);
  
    return { messages, ticket, askID, setTicket };
  };

function sendMessage(ws, message) {
    if (!ws.current) return;

    ws.current.send(message)
}

async function rateTicket(e, navigate, ticket_id, onSuccess) {
    e.preventDefault();

    let formData = new FormData()
    formData.append("rate", parseInt(e.target[0].value))

    const data = await fetch(
        "/api/tickets/auth/rate/"+ticket_id,
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

    onSuccess();

}

async function closeTicket(navigate, ticket_id, onSuccess) {
    const data = await fetch(
        "/api/tickets/auth/close/"+ticket_id,
        {
            method: "POST",
            credentials: "include",
            headers: {
                'accept': 'application/json',
                'Authorization': "Bearer " + Cookies.get('access_token')
            },
        }
    ).then((res) => {
        if (res.status != 200) {navigate("/"); return false}
        return res.json()
    });

    onSuccess()
}
 
function TicketDetailed() {
    let { ticket_id } = useParams();
    const { messages, ticket, askID, setTicket } = useAllData( ticket_id )

    const [isPaused, setIsPaused] = useState(false);
    const [addedMessage, setAddedMessage] = useState([]);
    const [textMessage, setTextMessage] = useState("");
    const [isSystemMessageClosed, setSystemMessageClosed] = useState(true)

    const navigate = useNavigate()
    const ws = useRef(null);

    let formRel;

    const messagesList = !messages ? "Loading" : messages.map(message =>
        <MessageInstance  key={message.id} text={message.text} owner={message.owner} userID={askID.ID}/>
    )

    const closeMessage = <CloseTicketMessage onYes={async () => await closeTicket(navigate, ticket_id, () => setTicket((t) => ({...t, closed: true})))}
        setClose={() => setSystemMessageClosed(true)}/>
    
    const rateMessage = <RateTicketMessage onRate={async (e) => {await rateTicket(e, navigate, ticket_id, () => window.location.reload())}}/>

    useEffect(() => {
        if (!isPaused) {
            ws.current = new WebSocket("ws://mineimpact.ru/ws/tickets/auth/ws/" + ticket_id);

            gettingData(askID);
        }

        return () => ws.current.close();
    }, [ws, isPaused, askID]);

    const gettingData = useCallback(() => {
        if (!ws.current) return;

        ws.current.onmessage = e => {
            if (isPaused) return;
            const message = JSON.parse(e.data);
            setAddedMessage(current => [...current, <MessageInstance key={message.id} text={message.message} owner={message.from} userID={askID.ID}/>]);
            setSystemMessageClosed(false);
        };
    }, [isPaused, askID]);

    if (!ticket) {
        return ("Loading")
    }

    return (
        <div className='ticket-main-wrapper'>
            <div className='ticket-header'>
                <div className='ticket-header-back'>
                    <div className='back-btn' onClick={() => navigate("/tickets")}>
                        Назад
                    </div>
                </div>
                <div className='ticket-header-title'>
                        Чат обращения
                </div>
                <div className='ticket-header-logout'>
                    <div className='logout-btn' onClick={() => {Cookies.remove("access_token", { path: '/'}); Cookies.remove("refresh_token", { path: '/'}); navigate("/") } }>
                        Выйти
                    </div>
                </div>
            </div>
            <div className='ticket-body'>
                <div className='ticket-panel-body'>
                    <div className='ticket-title-wrapper'>
                        <div className='ticket-title'>Тема: {ticket ? ticket.title : "Loading"}</div>
                        <div className='ticket-id'>ID: #{ticket ? ticket.id : "Loading"}</div>
                    </div>
                    <div className='ticket-body-wrapper'>
                        { <TicketTags tags={ticket.tags} ticket_id={ticket_id}/> }
                        { <TicketPriority InitPriority={ticket.priority} ticket_id={ticket_id} /> }
                        { askID && askID.IS_STUFF && !ticket.closed ? 
                        <div class='close-forced-wrapper'>
                            <div className='ticket-close-forced' onClick={async () => await closeTicket(navigate, ticket_id, () => setTicket((t) => ({...t, closed: true})))}>
                                Принудительно закрыть обращение
                            </div>
                        </div> : null }
                    </div>
                </div>
                <div className='ticket-chat-body'>
                    <div className='ticket-chat-wrapper'>
                        <div className='ticket-chat'>
                            { messagesList }
                            { addedMessage }
                            { !isSystemMessageClosed ? !ticket.closed ? closeMessage : !ticket.rated ? rateMessage : null : !ticket.rated && ticket.closed && !askID.IS_STUFF ? rateMessage : null}
                        </div>
                        <div className='ticket-input'>
                            <div className='ticket-input-wrapper'>
                                { !ticket.closed ? <form ref={el => formRel = el} onSubmit={(e) => {
                                        e.preventDefault();
                                        sendMessage(ws, textMessage);
                                        setTextMessage("");
                                        e.target[0].value = "";
                                    } }>
                                    <textarea onKeyDown={(e) => {
                                        if(e.keyCode == 13 && e.shiftKey == false) {
                                            e.preventDefault();
                                            formRel.requestSubmit();
                                          }
                                    }} id='ticket-input-input' onChange={(e) => {setTextMessage ( e.target.value );}}/>
                                    <input type="submit"></input>
                                </form> : null}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
    )
}

export default TicketDetailed;