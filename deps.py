from typing import Union, Any
from datetime import datetime
from fastapi import Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordBearer
from utils import (
    ALGORITHM,
    JWT_SECRET_KEY,
    JWT_REFRESH_SECRET_KEY,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_MINUTES,
    create_access_token,
    create_refresh_token
)
from database import get_db
from sqlalchemy.orm import Session

import models

from jose import jwt
from pydantic import ValidationError
from models import TokenPayload

reuseable_oauth = OAuth2PasswordBearer(
    tokenUrl="/login",
    scheme_name="JWT"
)

async def get_current_user_ws(request: Request, response: Response, db: Session = Depends(get_db)) -> models.User:
    refreshed = False

    for header in request['headers']:
        if header[0] == b"cookie":
            cookies = header[1].decode().split("; ")
            for cookie in cookies:
                key, value = cookie.split("=")

                if key == "access_token":
                    token = value
                    break

    try:
        payload = jwt.decode(
            token, JWT_SECRET_KEY, algorithms=[ALGORITHM],
            options=dict(
                              verify_aud=False,
                              verify_sub=False,
                              verify_exp=False,
                          )
        )

        token_data = TokenPayload(**payload)
        
        if datetime.fromtimestamp(token_data.exp) < datetime.now():
            refresh_token = request.cookies.get('refresh_token')

            if not refresh_token:
                raise HTTPException(
                    status_code = status.HTTP_401_UNAUTHORIZED,
                    detail="Токен истёк",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            try:
                print(refresh_token, JWT_REFRESH_SECRET_KEY)
                refresh_payload = jwt.decode(
                    refresh_token, JWT_REFRESH_SECRET_KEY, algorithms=[ALGORITHM]
                )

                refreshed = True

            except(jwt.JWTError, ValidationError):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Невозможно проверить токен",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            token_data = TokenPayload(**refresh_payload)

    except(jwt.JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Невозможно проверить токен",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(models.User).filter(models.User.username == token_data.sub).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден",
        )
    
    return user, refreshed

async def get_current_user(request: Request, response: Response, token: str = Depends(reuseable_oauth), db: Session = Depends(get_db)):# -> models.User:
    refreshed = False

    if not(token) or token == "undefined":
        token = request.cookies.get('access_token')

    try:
        print(token, JWT_SECRET_KEY)
        payload = jwt.decode(
            token, JWT_SECRET_KEY, algorithms=[ALGORITHM],
            options=dict(
                              verify_aud=False,
                              verify_sub=False,
                              verify_exp=False,
                          )
        )
        token_data = TokenPayload(**payload)
        
        if datetime.fromtimestamp(token_data.exp) < datetime.now():
            refresh_token = request.cookies.get('refresh_token')

            if not refresh_token:
                raise HTTPException(
                    status_code = status.HTTP_401_UNAUTHORIZED,
                    detail="Токен истёк",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            try:
                refresh_payload = jwt.decode(
                    refresh_token, JWT_REFRESH_SECRET_KEY, algorithms=[ALGORITHM]
                )

                refreshed = True

            except(jwt.JWTError, ValidationError):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Невозможно проверить токен",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            token_data = TokenPayload(**refresh_payload)

    except(jwt.JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Невозможно проверить токен",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user = db.query(models.User).filter(models.User.username == token_data.sub).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден",
        )
    
    return user, refreshed