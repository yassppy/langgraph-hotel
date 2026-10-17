from typing import Optional, Dict, Any
from fastapi import Request, HTTPException, Depends
from psycopg import Connection

from app.core.database import get_db
from app.core.security import decode_access_token
from app.features.auth.service import AuthService


def get_current_user_optional(
    request: Request,
    conn: Connection = Depends(get_db),
) -> Optional[Dict[str, Any]]:
    """
    Intenta extraer el usuario autenticado desde la cookie HttpOnly 'access_token'
    o desde la cabecera Authorization: Bearer <token>. No lanza excepción si no hay usuario.
    """
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()

    if not token:
        return None

    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        return None

    auth_service = AuthService(conn)
    user = auth_service.get_user_by_id(payload["sub"])
    if not user or not user.get("is_active"):
        return None

    return user


def get_current_user(
    user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
) -> Dict[str, Any]:
    """Exige usuario autenticado, devuelve 401 si no lo está."""
    if not user:
        raise HTTPException(
            status_code=401,
            detail="No autenticado. Por favor, inicia sesión.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_role(*roles: str):
    """Dependencia para verificar roles de usuario (e.g. staff, admin)."""
    def role_checker(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_role = user.get("role", "customer")
        if user_role not in roles:
            raise HTTPException(
                status_code=403,
                detail="No tienes permisos suficientes para realizar esta acción.",
            )
        return user
    return role_checker
