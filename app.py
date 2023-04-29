from fastapi import (
    FastAPI, Depends,
    Request, Form, status,
    Response, WebSocket, WebSocketDisconnect,
    Query, BackgroundTasks)

from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, status, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm

from starlette.staticfiles import StaticFiles
from starlette.templating import Jinja2Templates

from typing import Optional
from json import dumps

from sqlalchemy.orm import Session
from sqlalchemy import or_

import models
from database import engine, get_db

from deps import get_current_user, get_current_user_ws
from utils import (
    getAndUpdateTags,
    id2string,
    string2id,
    get_hashed_password,
    create_access_token,
    create_refresh_token,
    verify_password,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_MINUTES
)


models.Base.metadata.create_all(bind=engine)

templates = Jinja2Templates(directory="build")
tickets_websocket = {}

app = FastAPI(debug=True)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=['*'],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/tickets/auth/ws/{ticket_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    ticket_id: str,
    db: Session = Depends(get_db)
):  

    try:
        user = await get_current_user_ws(websocket, None, db)
    except:
        return
    
    refreshed = user[1]  
    user = user[0]
    ticket_id = string2id(ticket_id)

    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()

    if ticket.owner_id != user.id and not user.is_stuff:
        return
    
    if str(ticket_id) in tickets_websocket:
        tickets_websocket[str(ticket_id)].append(websocket)
    else:
        tickets_websocket[str(ticket_id)] = [websocket]
    
    await websocket.accept()

    if refreshed:
        access_token = create_access_token(user.username)
        websocket.send(dumps({'token_update': access_token}))

        refreshed = False

    while True:
        try:
            data = await websocket.receive_text()

            new_message = models.Message(text=data, owner_id=user.id, ticket_id=ticket_id)
            db.add(new_message)
            db.commit()

            for ws in tickets_websocket[str(ticket_id)]:
                await ws.send_text(dumps({"from": user.id, "is_stuff": user.is_stuff, "message": data, "id": new_message.id}))

        except WebSocketDisconnect:
            tickets_websocket[str(ticket_id)].remove(websocket)
            break

@app.get("/api/tickets/auth/myID")
def fetch(request: Request, response: Response, db: Session = Depends(get_db),
          user = Depends(get_current_user)):

    refreshed = user[1]  
    user = user[0]

    if refreshed:
        access_token = create_access_token(user.username)

        response.set_cookie('access_token', access_token, ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                            ACCESS_TOKEN_EXPIRE_MINUTES * 60, '/', None, False, True, 'lax')
    
    if user:
        return {"ID": user.id, "IS_STUFF": user.is_stuff}


@app.get("/api/tickets/auth/messages/{ticket_id}", response_model=list[models.MessageObject])
def fetch(request: Request, response: Response, ticket_id: str, db: Session = Depends(get_db),
          user: models.User = Depends(get_current_user)):
    
    refreshed = user[1]  
    user = user[0]
    ticket_id = string2id(ticket_id)

    if refreshed:
        access_token = create_access_token(user.username)

        response.set_cookie('access_token', access_token, ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                            ACCESS_TOKEN_EXPIRE_MINUTES * 60, '/', None, False, True, 'lax')
    
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if ticket.owner != user and not user.is_stuff:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещен",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    messages = db.query(models.Message).filter(models.Message.ticket_id == ticket_id).all()
    
    return [models.MessageObject(ask_id=user.id, id=message.id, text=message.text, owner=message.owner_id) for message in messages]

@app.get("/api/tickets/auth/fetch/{ticket_id}", response_model=models.TicketObject)
def fetch(request: Request, response: Response, ticket_id: str, db: Session = Depends(get_db),
          user: models.User = Depends(get_current_user)):
    
    refreshed = user[1]  
    user = user[0]
    ticket_id = string2id(ticket_id)

    if refreshed:
        access_token = create_access_token(user.username)

        response.set_cookie('access_token', access_token, ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                            ACCESS_TOKEN_EXPIRE_MINUTES * 60, '/', None, False, True, 'lax')
    
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if ticket.owner != user and not user.is_stuff:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещен",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return models.TicketObject(rated=True if ticket.rate else False, tags=ticket.tags, id=id2string(ticket.id), title=ticket.title,
                               description=ticket.description, closed=ticket.closed, priority=ticket.priority, rating=ticket.rate)

@app.get("/api/tickets/auth/fetch", response_model=list[models.TicketObject])
def fetch_all(request: Request, response: Response, db: Session = Depends(get_db),
        limit: int = Query(default=15), page: int = Query(default=1),
        order_type: str = Query(default="latest"), order: str = Query(default="desc"),
        priority: int = Query(default=0), query: str = Query(default=""),
        searchTags: bool =Query(default=True), searchTitle: bool =Query(default=True),
        searchDesc: bool =Query(default=True),
        user: models.User = Depends(get_current_user)):
    
    refreshed = user[1]  
    user = user[0]

    print(user)

    if refreshed:
        access_token = create_access_token(user.username)

        response.set_cookie('access_token', access_token, ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                            ACCESS_TOKEN_EXPIRE_MINUTES * 60, '/', None, False, True, 'lax')
        
    if user.is_stuff:
        tickets = db.query(models.Ticket)
    else:
        tickets = db.query(models.Ticket).filter(models.Ticket.owner_id == user.id)
    
    if query:
        not_null_filtes = []

        if searchTitle:
            not_null_filtes.append(models.Ticket.title.contains(query))
        if searchTags:
            not_null_filtes.append(models.Ticket.tags.contains(query))
        if searchDesc:
            not_null_filtes.append(models.Ticket.description.contains(query))

        if not_null_filtes:
            tickets = tickets.filter(or_(*not_null_filtes))

    if order_type == "priority":
        if order == "desc":
            tickets = tickets.order_by(models.Ticket.priority.desc(), models.Ticket.id.desc())
        else:
            tickets = tickets.order_by(models.Ticket.priority.asc(), models.Ticket.id.asc())
    elif order_type == "latest":
        if order == "desc":
            tickets = tickets.order_by(models.Ticket.id.desc())
        else:
            tickets = tickets.order_by(models.Ticket.id.asc())
    elif order_type == "closed":
        if order == "desc":
            tickets = tickets.order_by(models.Ticket.closed.desc(), models.Ticket.id.desc())
        else:
            tickets = tickets.order_by(models.Ticket.closed.asc(), models.Ticket.id.asc())
    else:
        if order == "desc":
            tickets = tickets.order_by(models.Ticket.rate.desc(), models.Ticket.id.desc())
        else:
            tickets = tickets.order_by(models.Ticket.rate.asc(), models.Ticket.id.asc())

    if priority:
        tickets = tickets.filter(models.Ticket.priority == priority)
    
    tickets = tickets.offset((page - 1) * limit - 1).limit(limit).all()

    return [models.TicketObject(rated=True if ticket.rate else False, tags=ticket.tags,
                                id=id2string(ticket.id), title=ticket.title, description=ticket.description,
                                closed=ticket.closed, priority=ticket.priority, rating=ticket.rate) for ticket in tickets]



@app.post("/api/tickets/auth/add", response_model=models.APIStatus)
def add(request: Request, response: Response, bg: BackgroundTasks, title: str = Form(...), description: str = Form(...),
        priority: int = Form(...), tags: Optional[str] = Form(""),
        db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    
    refreshed = user[1]  
    user = user[0]

    if refreshed:
        access_token = create_access_token(user.username)

        response.set_cookie('access_token', access_token, ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                            ACCESS_TOKEN_EXPIRE_MINUTES * 60, '/', None, False, True, 'lax')
    
    new_ticket = models.Ticket(title=title, description=description, owner=user, priority=priority, tags=tags)
    db.add(new_ticket)

    bg.add_task(getAndUpdateTags, new_ticket, db)

    start_message_text = f'''Пользователь {user.username} создал новое обращение.\n\n{description}'''

    start_message = models.Message(text=start_message_text, owner_id=user.id, ticket_id=new_ticket.id)
    db.add(start_message)
    db.commit()

    return models.APIStatus(status=1, ticket_id=id2string(new_ticket.id), message=f"Ticked with id {new_ticket.id} added") 

@app.post("/api/tickets/auth/edit_tags/{ticket_id}")
def rate(request: Request, response: Response, ticket_id: str, tags: str = Form(...),
           db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    
    refreshed = user[1]  
    user = user[0]
    ticket_id = string2id(ticket_id)

    if refreshed:
        access_token = create_access_token(user.username)

        response.set_cookie('access_token', access_token, ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                            ACCESS_TOKEN_EXPIRE_MINUTES * 60, '/', None, False, True, 'lax')
    
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()

    if ticket.owner != user and not user.is_stuff:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещен",
            headers={"WWW-Authenticate": "Bearer"},
        )

    ticket.tags = tags
    db.commit()

    return models.APIStatus(status=1, message=f"Ticked with id {ticket.id} tags set to {tags}") 

@app.post("/api/tickets/auth/set_priority/{ticket_id}")
def rate(request: Request, response: Response, ticket_id: str, priority: int = Form(...),
           db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    
    refreshed = user[1]  
    user = user[0]
    ticket_id = string2id(ticket_id)

    if refreshed:
        access_token = create_access_token(user.username)

        response.set_cookie('access_token', access_token, ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                            ACCESS_TOKEN_EXPIRE_MINUTES * 60, '/', None, False, True, 'lax')
    
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()

    if ticket.owner != user and not user.is_stuff:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещен",
            headers={"WWW-Authenticate": "Bearer"},
        )

    ticket.priority = priority
    db.commit()

    return models.APIStatus(status=1, message=f"Ticked with id {ticket.id} priority set to {priority}") 

@app.post("/api/tickets/auth/rate/{ticket_id}")
def rate(request: Request, response: Response, ticket_id: str, rate: int = Form(...),
           db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    
    refreshed = user[1]  
    user = user[0]
    ticket_id = string2id(ticket_id)

    if refreshed:
        access_token = create_access_token(user.username)

        response.set_cookie('access_token', access_token, ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                            ACCESS_TOKEN_EXPIRE_MINUTES * 60, '/', None, False, True, 'lax')
    
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if ticket.owner != user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещен",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if rate not in range(1, 6):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Рейтинг может быть числом от 1 до 5"
        )

    ticket.rate = rate

    rate_message_text = f'''Пользователь {user.username} поставил {rate} звёзд качеству обслуживания'''

    rate_message = models.Message(text=rate_message_text, owner_id=user.id, ticket_id=ticket.id)
    db.add(rate_message)
    db.commit()

    return models.APIStatus(status=1, message=f"Ticked with id {ticket.id} rated with {rate} stars") 


@app.post("/api/tickets/auth/close/{ticket_id}")
def close(request: Request, response: Response, ticket_id: str, db: Session = Depends(get_db),
           user: models.User = Depends(get_current_user)):
    
    refreshed = user[1]  
    user = user[0]
    ticket_id = string2id(ticket_id)

    if refreshed:
        access_token = create_access_token(user.username)

        response.set_cookie('access_token', access_token, ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                            ACCESS_TOKEN_EXPIRE_MINUTES * 60, '/', None, False, True, 'lax')
    
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if ticket.owner != user and not user.is_stuff:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещен",
            headers={"WWW-Authenticate": "Bearer"},
        )

    ticket.closed = True
    db.commit()

    return models.APIStatus(status=1, message=f"Ticked with id {ticket.id} closed") 

@app.post('/api/signup', summary="Create new user", response_model=models.UserOut)
async def create_user(form_data: models.UserAuth, db: Session = Depends(get_db)):
    # querying database to check if user already exist
    user = db.query(models.User).filter(models.User.username == form_data.username).first()

    if user is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким именем уже существует"
        )
    
    newuser = models.User(username=form_data.username, password=get_hashed_password(form_data.password), is_stuff=False)
    db.add(newuser)
    db.commit()

    user = models.UserOut(username=form_data.username, id=newuser.id)

    return user


@app.post('/api/login', summary="Create access and refresh tokens for user", response_model=models.TokenSchema)
async def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверное имя пользователя или пароль"
        )

    hashed_pass = user.password

    if not verify_password(form_data.password, hashed_pass):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверное имя пользователя или пароль"
        )
    
    access_token = create_access_token(user.username)
    refresh_token = create_refresh_token(user.username)

    return {'access_token': access_token, 'refresh_token': refresh_token, 'status': 1}

app.mount("/static", StaticFiles(directory="./build/static"), name="static")

@app.get("/{rest_of_path:path}")
async def react_app(req: Request, rest_of_path: str):
    return templates.TemplateResponse('index.html', { 'request': req })