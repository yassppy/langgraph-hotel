from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.features.auth.router import router as auth_router

settings = get_settings()

app = FastAPI(
    title="Hotel Sol & Mar API",
    description="Backend oficial para reservas hoteleras con asistente virtual y gestión de pagos",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers with /api/v1 prefix as defined in documento_tecnico_01.md
app.include_router(auth_router, prefix="/api/v1")


@app.get("/health", tags=["Salud"])
def health_check():
    return {"status": "ok", "service": "Hotel Sol & Mar API"}
