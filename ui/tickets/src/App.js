import './components/mainCss/App.css';
import React from 'react';
import Create from './components/main/Create';
import View from './components/main/View';
import Tickets from './components/main/Tickets';
import TicketDetailed from './components/main/TicketDetailed';

import { Routes, Route, BrowserRouter } from "react-router-dom";

function App() {

  return (
    <div className='App'>
      <BrowserRouter >
        <Routes>
          <Route path="/" element={
              (<div className='app-main'>
                <Create/>
              </div>)
              }>
          </Route>
          <Route path="/tickets" element={
              <Tickets/>
              }>
          </Route>
          <Route path="/tickets/:ticket_id" element={
              <TicketDetailed/>
              }>
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
