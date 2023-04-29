from sqlalchemy import Boolean, Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from pydantic import BaseModel, Field

from database import Base

class User(Base):
    __tablename__ = "users"

    id: int = Column(Integer, primary_key=True, index=True)

    username: str = Column(String)
    password: str = Column(String)

    is_stuff: bool = Column(Boolean, default=False)

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    tags = Column(String, nullable=True)
    priority = Column(Integer, default=1)

    stuff_id = Column(Integer, ForeignKey(User.id), nullable=True)
    owner_id = Column(Integer, ForeignKey(User.id), nullable=True)

    owner = relationship("User", backref="owner", uselist=False, foreign_keys=[owner_id])
    stuff = relationship("User", backref="stuff", uselist=False, foreign_keys=[stuff_id])

    rate = Column(Integer)
    closed = Column(Boolean, default=False)

class Message(Base):
    __tablename__ = "messages"

    id: int = Column(Integer, primary_key=True, index=True)

    text: str = Column(String) 
    owner_id = Column(Integer, ForeignKey(User.id), nullable=True)
    ticket_id = Column(Integer, ForeignKey(Ticket.id), nullable=True)

    is_system = Column(Boolean, default=False)

# SCHEMAS

class TokenSchema(BaseModel):
    access_token: str
    refresh_token: str
    
    
class TokenPayload(BaseModel):
    sub: str = None
    exp: int = None

class UserAuth(BaseModel):
    username: str = Field(..., description="username")
    password: str = Field(..., min_length=5, max_length=24, description="user password")

class UserOut(BaseModel):
    id: int
    username: str
    is_stuff: bool | None = False

class APIStatus(BaseModel):
    status: bool
    message: str | None = None
    ticket_id: str | None = None

class TicketObject(BaseModel):
    id: str
    title: str
    description: str
    priority: int
    rated: bool
    tags: str
    rating: int | None = None

    closed: bool

class MessageObject(BaseModel):
    id: int
    text: str
    owner: int

    ask_id: int
