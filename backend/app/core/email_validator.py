import json
from pathlib import Path
from typing import Set

_CACHED_BLOCKLIST: Set[str] = set()

# Lista de palabras clave / dominios fuertemente asociados a temp-mail y servicios similares
KNOWN_TEMP_MAIL_KEYWORDS = (
    "temp-mail",
    "tempmail",
    "throwaway",
    "fakeinbox",
    "10minutemail",
    "disposable",
    "burnermail",
    "guerrillamail",
    "trashmail",
    "yopmail",
    "mohmal",
    "sharklasers",
    "mailinator",
    "getairmail",
    "dispostable",
    "mytemp",
    "tempinbox",
    "crazymailing",
    "tmail",
    "inboxkitten",
    "dropmail",
)

# Dominios comunes que frecuentemente usa temp-mail.org
SPECIFIC_TEMP_MAIL_DOMAINS = {
    "temp-mail.org",
    "tempmail.com",
    "tempmail.net",
    "tempmail.de",
    "temp-mail.ru",
    "temp-mail.io",
    "chacuo.net",
    "027168.com",
    "besttempmail.com",
    "generator.email",
    "crepeau.me",
    "dffan.com",
    "fawnoo.com",
    "emilfree.com",
    "dpptd.com",
    "disbox.org",
    "moakt.com",
    "emailondeck.com",
}


def _load_blocklist() -> Set[str]:
    global _CACHED_BLOCKLIST
    if _CACHED_BLOCKLIST:
        return _CACHED_BLOCKLIST

    domains_set = set(SPECIFIC_TEMP_MAIL_DOMAINS)
    json_path = Path(__file__).parent / "disposable_domains.json"
    if json_path.exists():
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    domains_set.update(d.strip().lower() for d in data if d)
        except Exception:
            pass

    _CACHED_BLOCKLIST = domains_set
    return _CACHED_BLOCKLIST


def is_disposable_or_temp_email(email: str) -> bool:
    """
    Verifica si un correo electrónico proviene de temp-mail.org o
    cualquier otro proveedor de correos temporales/desechables.
    """
    if not email or "@" not in email:
        return True

    domain = email.split("@")[-1].strip().lower()

    # 1. Chequeo de dominios específicos y base de datos de 9,800+ dominios
    blocklist = _load_blocklist()
    if domain in blocklist:
        return True

    # 2. Chequeo de subdominios
    parts = domain.split(".")
    for i in range(len(parts) - 1):
        sub = ".".join(parts[i:])
        if sub in blocklist:
            return True

    # 3. Detección heurística de palabras clave de temp-mail
    for keyword in KNOWN_TEMP_MAIL_KEYWORDS:
        if keyword in domain:
            return True

    return False
