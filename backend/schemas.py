from pydantic import BaseModel
from typing import Literal

class UserCreate(BaseModel):
    username: str
    password: str
    preferred_name: str
    role: Literal['patient', 'worker']

class UserResponse(BaseModel):
    id: str
    username: str
    preferred_name: str
    role: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
