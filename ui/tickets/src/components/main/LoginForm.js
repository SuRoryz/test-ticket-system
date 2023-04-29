import React from 'react';
import UIButton from '../ui/UIButton';
import { useState } from "react";
import Cookies from 'js-cookie';

function LoginForm({onSubmit, setError}) {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")

    const submitForm = () => {

        let formData = new FormData();

        formData.append("username", username);
        formData.append("password", password);

        const dataFetch = async () => {
            const data = await fetch(
                "/api/login",
                {
                    method: "POST",
                    headers: {
                        'accept': 'application/json'
                    },
                    body: formData
                }
            ).then((res) => {
                let d = res.json().then((r) => {
                    if (r.detail) {
                        setError(r.detail)
                    }

                    console.log(r.access_token)

                    Cookies.set('access_token', r.access_token, { path: '/'})
                    Cookies.set('refresh_token', r.refresh_token, {path: '/'})

                    if (res.status == 200) {
                        onSubmit()
                    }
    

                    return r
                })

                return d
                
            })
        }

        dataFetch();
    }

    return (
        <form className='form' onSubmit={(e) => {e.preventDefault()}}>
            <div className="form-login-label-wrapper">
                <label htmlFor='username'>
                    Имя пользователя
                </label>
                <input autoComplete="off"  id='username' name='username' type="text" value={username} onChange={(e) => {setUsername(e.target.value)}}/>
            </div>
            <div className="form-login-label-wrapper">
                <label htmlFor='password'>
                    Пароль
                </label>
                <input autoComplete="off"  id='password' name='password' type="password" value={password} onChange={(e) => {setPassword(e.target.value)}}/>
            </div>
            <UIButton text="Войти" onClick={() => {submitForm()}}/>
        </form>
    )
}

export default LoginForm;