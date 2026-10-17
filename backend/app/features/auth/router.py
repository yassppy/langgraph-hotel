from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from psycopg import Connection

from app.core.config import get_settings
from app.core.database import get_db
from app.features.auth.schemas import (
    RegisterRequest,
    LoginRequest,
    GoogleAuthRequest,
    UserResponse,
    AuthResponse,
)
from app.features.auth.service import AuthService, AuthError
from app.features.auth.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Autenticación"])


def _set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
) -> None:
    settings = get_settings()
    # Cookie access_token: HttpOnly
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    # Cookie refresh_token: HttpOnly restringida al endpoint /api/v1/auth
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/api/v1/auth",
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/api/v1/auth")


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar cuenta con email y contraseña",
)
def register(
    data: RegisterRequest,
    request: Request,
    response: Response,
    conn: Connection = Depends(get_db),
):
    service = AuthService(conn)
    try:
        user = service.register_user(
            email=data.email,
            password=data.password,
            full_name=data.full_name,
        )
        user_agent = request.headers.get("user-agent")
        access_token, refresh_token = service.create_session(user, user_agent=user_agent)
        _set_auth_cookies(response, access_token, refresh_token)

        return AuthResponse(
            message="Cuenta creada exitosamente.",
            user=UserResponse(**user),
            access_token=access_token,
        )
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Iniciar sesión con email y contraseña",
)
def login(
    data: LoginRequest,
    request: Request,
    response: Response,
    conn: Connection = Depends(get_db),
):
    service = AuthService(conn)
    try:
        user = service.authenticate_user(
            email=data.email,
            password=data.password,
        )
        user_agent = request.headers.get("user-agent")
        access_token, refresh_token = service.create_session(user, user_agent=user_agent)
        _set_auth_cookies(response, access_token, refresh_token)

        return AuthResponse(
            message="Inicio de sesión exitoso.",
            user=UserResponse(**user),
            access_token=access_token,
        )
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post(
    "/google",
    response_model=AuthResponse,
    summary="Iniciar sesión o registrarse con Google OAuth",
)
async def google_auth(
    data: GoogleAuthRequest,
    request: Request,
    response: Response,
    conn: Connection = Depends(get_db),
):
    if not data.credential and not data.access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Se requiere el parámetro credential (ID Token) o access_token de Google.",
        )

    service = AuthService(conn)
    try:
        user = await service.authenticate_google(
            credential=data.credential,
            access_token=data.access_token,
        )
        user_agent = request.headers.get("user-agent")
        access_token, refresh_token = service.create_session(user, user_agent=user_agent)
        _set_auth_cookies(response, access_token, refresh_token)

        return AuthResponse(
            message="Autenticación con Google exitosa.",
            user=UserResponse(**user),
            access_token=access_token,
        )
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post(
    "/refresh",
    response_model=AuthResponse,
    summary="Renovar access token mediante refresh token",
)
def refresh_session(
    request: Request,
    response: Response,
    conn: Connection = Depends(get_db),
):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No hay refresh token en la sesión.",
        )

    service = AuthService(conn)
    try:
        user_agent = request.headers.get("user-agent")
        access_token, new_refresh, user = service.rotate_refresh_token(
            refresh_token,
            user_agent=user_agent,
        )
        _set_auth_cookies(response, access_token, new_refresh)

        return AuthResponse(
            message="Sesión renovada exitosamente.",
            user=UserResponse(**user),
            access_token=access_token,
        )
    except AuthError as e:
        _clear_auth_cookies(response)
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post(
    "/logout",
    summary="Cerrar sesión y revocar tokens",
)
def logout(
    request: Request,
    response: Response,
    conn: Connection = Depends(get_db),
):
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        service = AuthService(conn)
        service.revoke_refresh_token(refresh_token)

    _clear_auth_cookies(response)
    return {"message": "Sesión cerrada correctamente."}


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Obtener información del usuario actualmente autenticado",
)
def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    return UserResponse(**current_user)
