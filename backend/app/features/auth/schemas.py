from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# ── Requests ──

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, description="Mínimo 8 caracteres")
    full_name: str = Field(min_length=2, max_length=150, description="Nombre completo")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = Field(
        default=None,
        description="Google ID Token (credential) obtenido del frontend con Google Identity Services"
    )
    access_token: Optional[str] = Field(
        default=None,
        description="Opcional: Access token de Google UserInfo endpoint"
    )


# ── Responses ──

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool = True

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    message: str
    user: UserResponse
    access_token: Optional[str] = None
    token_type: str = "bearer"
