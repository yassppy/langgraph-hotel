from contextlib import contextmanager
from typing import Generator
import psycopg
from psycopg.rows import dict_row

from app.core.config import get_settings


@contextmanager
def get_db_connection() -> Generator[psycopg.Connection, None, None]:
    settings = get_settings()
    conn = psycopg.connect(settings.DATABASE_URL, row_factory=dict_row)
    try:
        yield conn
    finally:
        conn.close()


def get_db():
    """FastAPI dependency that yields a database connection."""
    with get_db_connection() as conn:
        yield conn
