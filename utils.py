from passlib.context import CryptContext
import os
from datetime import datetime, timedelta
from typing import Union, Any
from jose import jwt

import models
import base64

import openai
openai.api_key = ''

ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7
ALGORITHM = "HS256"

password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

prompt = '''Your are russian-speaking system that can read text and give tags that belongs to this text. You can only answer with tags separated by space. Only meanful tags are allowed, no articles or proposal. Tag must be only one word. You can't answer in any other format or anything else.'''

def getTags(title, description):
    messages = [ {"role": "system", "content": 
                prompt}]

    message = f"User : Тема: {title}. Подробное описание: f{description}"
    messages.append(
        {"role": "user", "content": message},
    )

    chat = openai.ChatCompletion.create(
        model="gpt-3.5-turbo", messages=messages
    )

    reply = chat.choices[0].message.content

    reply = list(map(lambda x: x.lower().replace(".", "").replace(",", "").replace("'", "").replace('"', ''), reply.split()))
    return reply

def getAndUpdateTags(ticket, db):
    ticket_obj = db.query(models.Ticket).filter(models.Ticket.id == ticket.id).first()
    tags = ';'.join(getTags(ticket.title, ticket.description))
    
    if ticket.tags:
        s = ';'.join(list(set( (ticket.tags + ";" + tags).split(";") )))
        ticket_obj.tags = s
    else:
        ticket_obj.tags = ticket.tags + tags

    db.commit()

def id2string(id):

    a = str(id * 17432 + 20000000)
    b = base64.b64encode( a.encode() )

    return b.decode("UTF-8")

def string2id(string):
    
    b = base64.b64decode( string.encode("UTF-8") )
    a = int((int(b.decode()) - 20000000) / 17432.0)
    
    return a

def get_hashed_password(password: str) -> str:
    return password_context.hash(password)


def verify_password(password: str, hashed_pass: str) -> bool:
    return password_context.verify(password, hashed_pass)


def create_access_token(subject: Union[str, Any], expires_delta: int = None) -> str:
    if expires_delta is not None:
        expires_delta = datetime.utcnow() + expires_delta
    else:
        expires_delta = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expires_delta, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, ALGORITHM)
    return encoded_jwt

def create_refresh_token(subject: Union[str, Any], expires_delta: int = None) -> str:
    if expires_delta is not None:
        expires_delta = datetime.utcnow() + expires_delta
    else:
        expires_delta = datetime.utcnow() + timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expires_delta, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, JWT_REFRESH_SECRET_KEY, ALGORITHM)
    return encoded_jwt