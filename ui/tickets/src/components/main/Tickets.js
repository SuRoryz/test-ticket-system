import React from 'react';
import '../mainCss/TicketsList.css';
import filter_ico from '../mainCss/filter-icon.svg';
import search_ico from '../mainCss/search-icon.svg';
import { useState, useEffect } from "react"
import Cookies from 'js-cookie';
import TicketInstance from './TicketInstance'
import { useNavigate } from "react-router-dom";
import CreateTicketWindow from './createTicket'

const useAllData = (searchSettings) => {
    const [tickets, setTickets] = useState();
    const navigate = useNavigate()
  
    useEffect(() => {
      const dataFetch = async () => {
        // waiting for allthethings in parallel
        const result = (
          await Promise.all([
            fetch("/api/tickets/auth/fetch?" + new URLSearchParams({
                ...searchSettings
            }), {
                credentials: "include",
                headers: {
                    Authorization: "Bearer " + Cookies.get('access_token')
                }
            }).catch((err) => {})
          ])
        ).map((r) => {if (r.status != 200) {navigate("/"); return false}; return r.json() });
  
        const [ticketsResults] = await Promise.all(
          result
        );

        setTickets(ticketsResults);
      };
  
      dataFetch();
    }, [searchSettings]);
  
    return { tickets };
  };

function Tickets() {
    const [searchSettings, setSearchSettings] = useState({order_type: "latest",
                                                        order: "desc",
                                                        priority: 0,
                                                        searchTags: true,
                                                        searchTitle: true,
                                                        searchDesc: true,
                                                        page: 1,
                                                        query: "",
                                                        limit: 10});

    const { tickets } = useAllData(searchSettings)
    const [closed, setClosed] = useState(true);
    const [timeOut, setTimeOut] = useState();
    const [filtersOpen, setFilters] = useState(true);

    function toggleClose () {
        setClosed(!closed)
    }

    const navigate = useNavigate()

    const ticketsList = !tickets ? "Loading" : tickets.map(ticket =>
        <TicketInstance  key={ticket.id} ticket={ticket} onClick={() => {navigate("/tickets/" + ticket.id)}}/>
    )

    let next_page = <div className='tickets-page-forward' onClick={() => {
                        setSearchSettings(settings => ({
                            ...settings,
                            ...{page: settings.page + 1}
                        }))
                    }}>
                        {">"}
                    </div>
    
    let prev_page = <div className='tickets-page-back' onClick={() => {
                        setSearchSettings(settings => ({
                            ...settings,
                            ...{page: Math.max(1, settings.page - 1) }
                        }))
                    }}>
                        {"<"}
                    </div>
    
    console.log(ticketsList.length)

    return (
        <div className='tickets-main'>
            <div className='tickets-header'>
                <div className='tickets-header-create' onClick={toggleClose}>
                    Создать обращение
                </div>
                <div className='tickets-header-search'>
                    <form>
                        <div className='tickets-form-label-wrapper search'>
                            <label htmlFor='tickets-search-query'><img src={search_ico}/></label>
                            <input id='tickets-search-query' placeholder='Поиск' onChange={(e) => {
                                let text = e.target.value; // this is the search text
                                if(timeOut) clearTimeout(timeOut);

                                setTimeOut(setTimeout(() => {
                                    setSearchSettings(settings => ({
                                        ...settings,
                                        ...{query: text}
                                    }));
                                }, 300));
                            }}/>
                        </div>
                    </form>
                </div>
                <div className='ticket-header-logout'>
                    <div className='logout-btn' onClick={() => {Cookies.remove("access_token", { path: '/'}); Cookies.remove("refresh_token", { path: '/'}); navigate("/") } }>
                        Выйти
                    </div>
                </div>
                { closed ? null : <CreateTicketWindow setClosed={toggleClose}/>}
            </div>
            <div className='tickets-body'>
                <div className={'tickets-filters' + (!filtersOpen ? " hidden" : "")}>
                    <div className='tickets-filters-title'>Фильтры</div>
                    <div className='tickets-form-label-wrapper'>
                        <label htmlFor='tickets-search-order_type'>Сортировка</label>
                        <select id='tickets-search-order_type' onChange={(e) => { setSearchSettings(settings => ({
                            ...settings,
                            ...{order_type: e.target.value}
                        })); }}>
                            <option value="latest">Дата создания</option>
                            <option value="priority">Приоритет</option>
                            <option value="closed">Статус</option>
                            <option value="rating">Рейтинг</option>
                        </select>
                    </div>
                    <div className='tickets-form-label-wrapper'>
                        <label htmlFor='tickets-search-order'>Порядок</label>
                        <select id='tickets-search-order' onChange={(e) => { setSearchSettings(settings => ({
                            ...settings,
                            ...{order: e.target.value}
                        })); }}>
                            <option value="desc">По убыванию</option>
                            <option value="asc">По возрастанию</option>
                        </select>
                    </div>
                    <div className='tickets-form-label-wrapper'>
                        <label htmlFor='tickets-search-priority'>Приоритет</label>
                        <select id='tickets-search-priority' onChange={(e) => { setSearchSettings(settings => ({
                            ...settings,
                            ...{priority: e.target.value}
                        })); }}>
                            <option value="0">Любой</option>
                            <option value="1">Нормальный</option>
                            <option value="2">Выше среднего</option>
                            <option value="3">Критический</option>
                        </select>
                    </div>
                    <div className='tickets-form-label-wrapper checkbox'>
                        <label htmlFor='tickets-search-tag'>Искать в тегах</label>
                        <input type='checkbox' checked={searchSettings.searchTags} id='tickets-search-tag' onChange={(e) => {setSearchSettings(settings => ({
                            ...settings,
                            ...{searchTags: e.target.checked}
                        })); }}/>
                    </div>
                    <div className='tickets-form-label-wrapper checkbox'>
                        <label htmlFor='tickets-search-title'>Искать в теме</label>
                        <input type='checkbox' checked={searchSettings.searchTitle} id='tickets-search-title' onChange={(e) => {setSearchSettings(settings => ({
                            ...settings,
                            ...{searchTitle: e.target.checked}
                        })); }}/>
                    </div>
                    <div className='tickets-form-label-wrapper checkbox'>
                        <label htmlFor='tickets-search-desc'>Искать в описании</label>
                        <input type='checkbox' checked={searchSettings.searchDesc} id='tickets-search-desc' onChange={(e) => {console.log(e);setSearchSettings(settings => ({
                            ...settings,
                            ...{searchDesc: e.target.checked}
                        })); }}/>
                    </div>
                </div>

                <div className='tickets-list'>
                    <div className='ticket-list-colums'>
                        
                    </div>
                    <div className='tickets-list-wrapper'>
                        { ticketsList }
                    </div>
                    <div className='tickets-page'>
                        { searchSettings.page > 1 ? prev_page : null}
                        { searchSettings.page }
                        { ticketsList.length >= searchSettings.limit ? next_page : null}
                    </div>
                </div>
            </div>
            
        </div>
    )
}

export default Tickets;