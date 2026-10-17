from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, Tuple
import httpx
import jwt
from psycopg import Connection

from app.core.config import get_settings
from app.core.email_validator import is_disposable_or_temp_email
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    generate_refresh_token,
    hash_token,
)


class AuthError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class AuthService:
    def __init__(self, conn: Connection):
        self.conn = conn

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, email, password_hash, google_subject, full_name, role, is_active, last_login_at
                FROM users
                WHERE lower(email) = lower(%s);
                """,
                (email.strip(),),
            )
            row = cur.fetchone()
            if row:
                row["id"] = str(row["id"])
            return row

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, email, password_hash, google_subject, full_name, role, is_active, last_login_at
                FROM users
                WHERE id = %s;
                """,
                (user_id,),
            )
            row = cur.fetchone()
            if row:
                row["id"] = str(row["id"])
            return row

    def get_user_by_google_subject(self, sub: str) -> Optional[Dict[str, Any]]:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, email, password_hash, google_subject, full_name, role, is_active, last_login_at
                FROM users
                WHERE google_subject = %s;
                """,
                (sub,),
            )
            row = cur.fetchone()
            if row:
                row["id"] = str(row["id"])
            return row

    def register_user(
        self,
        email: str,
        password: str,
        full_name: str,
        role: str = "customer",
    ) -> Dict[str, Any]:
        clean_email = email.strip().lower()

        # Validación estricta contra correos temporales / desechables como temp-mail.org
        if is_disposable_or_temp_email(clean_email):
            raise AuthError(
                "No se permiten correos electrónicos temporales o desechables. Por favor, usa una cuenta de correo válida (ej. Gmail, Outlook).",
                status_code=400,
            )

        # Verificar si el correo ya existe
        existing = self.get_user_by_email(clean_email)
        if existing:
            raise AuthError("Ya existe una cuenta registrada con este correo electrónico.", status_code=409)

        hashed = hash_password(password)

        with self.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO users (email, password_hash, full_name, role, is_active)
                VALUES (%s, %s, %s, %s, true)
                RETURNING id, email, full_name, role, is_active;
                """,
                (clean_email, hashed, full_name.strip(), role),
            )
            new_user = cur.fetchone()
            new_user["id"] = str(new_user["id"])

        self.conn.commit()
        return new_user

    def authenticate_user(self, email: str, password: str) -> Dict[str, Any]:
        user = self.get_user_by_email(email)
        if not user:
            raise AuthError("Correo o contraseña incorrectos.", status_code=401)

        if not user.get("is_active"):
            raise AuthError("Esta cuenta ha sido desactivada.", status_code=403)

        if not user.get("password_hash"):
            raise AuthError(
                "Esta cuenta fue creada con Google. Por favor, inicia sesión con Google.",
                status_code=400,
            )

        if not verify_password(password, user["password_hash"]):
            raise AuthError("Correo o contraseña incorrectos.", status_code=401)

        # Actualizar last_login_at
        with self.conn.cursor() as cur:
            cur.execute(
                "UPDATE users SET last_login_at = now() WHERE id = %s;",
                (user["id"],),
            )
        self.conn.commit()

        return user

    async def authenticate_google(
        self,
        credential: Optional[str] = None,
        access_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        google_info: Optional[Dict[str, Any]] = None

        if credential:
            # Validar credential (ID Token) con Google tokeninfo endpoint
            async with httpx.AsyncClient() as client:
                res = await client.get(
                    "https://oauth2.googleapis.com/tokeninfo",
                    params={"id_token": credential},
                    timeout=10.0,
                )
                if res.status_code == 200:
                    google_info = res.json()
        elif access_token:
            # Validar con userinfo endpoint de Google
            async with httpx.AsyncClient() as client:
                res = await client.get(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    headers={"Authorization": f"Bearer {access_token}"},
                    timeout=10.0,
                )
                if res.status_code == 200:
                    google_info = res.json()

        if not google_info or not google_info.get("email"):
            raise AuthError("Token de Google inválido o no se pudo verificar con Google.", status_code=401)

        email = google_info["email"].strip().lower()
        sub = google_info.get("sub")
        full_name = google_info.get("name") or email.split("@")[0]

        # Verificar si ya existe usuario por Google Subject o por Email
        user = None
        if sub:
            user = self.get_user_by_google_subject(sub)
        if not user:
            user = self.get_user_by_email(email)

        with self.conn.cursor() as cur:
            if user:
                if not user.get("is_active"):
                    raise AuthError("Esta cuenta ha sido desactivada.", status_code=403)

                # Si no tenía google_subject asociado, asociarlo ahora
                if not user.get("google_subject") and sub:
                    cur.execute(
                        "UPDATE users SET google_subject = %s, last_login_at = now() WHERE id = %s;",
                        (sub, user["id"]),
                    )
                else:
                    cur.execute(
                        "UPDATE users SET last_login_at = now() WHERE id = %s;",
                        (user["id"],),
                    )
            else:
                # Crear nuevo usuario para Google Auth
                cur.execute(
                    """
                    INSERT INTO users (email, google_subject, full_name, role, is_active, last_login_at)
                    VALUES (%s, %s, %s, 'customer', true, now())
                    RETURNING id, email, full_name, role, is_active;
                    """,
                    (email, sub, full_name),
                )
                user = cur.fetchone()
                user["id"] = str(user["id"])

        self.conn.commit()
        return user

    def create_session(
        self,
        user: Dict[str, Any],
        user_agent: Optional[str] = None,
    ) -> Tuple[str, str]:
        """
        Crea par de tokens:
        - access_token (JWT)
        - refresh_token (token opaco persistido en la tabla refresh_tokens con hash)
        """
        settings = get_settings()
        user_id = str(user["id"])
        access_token = create_access_token(
            user_id=user_id,
            role=user.get("role", "customer"),
            email=user["email"],
        )

        raw_refresh_token = generate_refresh_token()
        token_hash_val = hash_token(raw_refresh_token)
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        with self.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent)
                VALUES (%s, %s, %s, %s);
                """,
                (user_id, token_hash_val, expires_at, user_agent),
            )
        self.conn.commit()

        return access_token, raw_refresh_token

    def rotate_refresh_token(
        self,
        raw_refresh_token: str,
        user_agent: Optional[str] = None,
    ) -> Tuple[str, str, Dict[str, Any]]:
        """
        Renueva la sesión usando el refresh token con rotación automática de refresh token.
        """
        settings = get_settings()
        token_hash_val = hash_token(raw_refresh_token)

        with self.conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, user_id, expires_at, revoked_at
                FROM refresh_tokens
                WHERE token_hash = %s;
                """,
                (token_hash_val,),
            )
            row = cur.fetchone()

            if not row:
                raise AuthError("Refresh token inválido.", status_code=401)

            if row["revoked_at"] is not None:
                raise AuthError("El refresh token ha sido revocado.", status_code=401)

            if row["expires_at"] < datetime.now(timezone.utc):
                raise AuthError("El refresh token ha expirado. Inicia sesión nuevamente.", status_code=401)

            user_id = str(row["user_id"])
            token_id = row["id"]

            # Obtener el usuario
            user = self.get_user_by_id(user_id)
            if not user or not user.get("is_active"):
                raise AuthError("Usuario inválido o inactivo.", status_code=401)

            # Revocar token anterior y generar uno nuevo
            new_raw_refresh = generate_refresh_token()
            new_hash = hash_token(new_raw_refresh)
            new_expires = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

            cur.execute(
                """
                INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent)
                VALUES (%s, %s, %s, %s)
                RETURNING id;
                """,
                (user_id, new_hash, new_expires, user_agent),
            )
            new_token_row = cur.fetchone()

            cur.execute(
                """
                UPDATE refresh_tokens
                SET revoked_at = now(), replaced_by = %s
                WHERE id = %s;
                """,
                (new_token_row["id"], token_id),
            )

        self.conn.commit()

        access_token = create_access_token(
            user_id=user_id,
            role=user.get("role", "customer"),
            email=user["email"],
        )

        return access_token, new_raw_refresh, user

    def revoke_refresh_token(self, raw_refresh_token: str) -> None:
        token_hash_val = hash_token(raw_refresh_token)
        with self.conn.cursor() as cur:
            cur.execute(
                """
                UPDATE refresh_tokens
                SET revoked_at = now()
                WHERE token_hash = %s AND revoked_at IS NULL;
                """,
                (token_hash_val,),
            )
        self.conn.commit()
