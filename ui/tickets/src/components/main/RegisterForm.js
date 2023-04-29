import React from 'react';
import UIButton from '../ui/UIButton';
import { useState } from "react"
import { type } from '@testing-library/user-event/dist/type';

function RegisterForm({onSubmit, setError}) {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")

    const submitForm = () => {
        const dataFetch = async () => {
            const data = await fetch(
                "/api/signup",
                {
                    method: "POST",
                    headers: {
                        'accept': 'application/json',
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({username: username, password: password})
                }
            ).then((r) => {
                if (r.status == 200) {
                    onSubmit()
                }
    
                let d = r.json().then((rw) => {
                    if (rw.detail) {
                        console.log(rw.detail)
                        if (typeof(rw.detail) != "string") {
                            setError(rw.detail[0].msg)
                        } else {
                            setError(rw.detail)
                        }
                    }
                    return rw
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

export default RegisterForm;