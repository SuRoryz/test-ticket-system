import React from 'react';
import '../mainCss/Login.css';
import UIButton from '../ui/UIButton';
import UITitle from '../ui/UITitle';
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import { useState } from "react"
import { useNavigate } from "react-router-dom";

function LoginWindow ({setClosed, setTitle}) {
    const [activePage, setActivePage] = useState("Login")
    const [body, setBody] = useState(<LoginForm setError={(e) => setError(e)} onSubmit={() => onSuccessLogin()}/>)
    const [error, setError] = useState("")

    console.log(setClosed)
    const navigate = useNavigate()

    function onSuccessLogin () {
        navigate("tickets")
    }

    function onSuccessRegister () {
        changeTab("Login");
    }

    function changeTab (page) {
        setActivePage(page)
        setBody(page == "Login" ? <LoginForm setError={(e) => setError(e)} onSubmit={() => onSuccessLogin()}/> : <RegisterForm setError={(e) => setError(e)} onSubmit={() => onSuccessRegister()}/>)
        setTitle(page == "Login" ? "Центр поддержки - Вход" : "Центр поддержки - Регистрация")
    }

    return (
        <div className='login-window'>
            <div className='login-window-tabs'>
                <div className='login-window-tab' onClick={() => changeTab("Login")}>Войти</div>
                <div className='login-window-tab' onClick={() => changeTab("Signup")}>Регистрация</div>
            </div>
            <div className='login-error'>
                { error ? <div className='login-error-message'>{error}</div> : null}
            </div>
            <div className='login-window-form'>
                { body }
            </div>
        </div>
    )
}

export default LoginWindow;