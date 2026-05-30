import os
import subprocess
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from src.routes import upload, generate, process

load_dotenv()

app = FastAPI(title="MightyCaptions API")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api")
app.include_router(generate.router, prefix="/api")
app.include_router(process.router, prefix="/api")


@app.get("/api/health")
async def health():
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
        ffmpeg_status = "available"
    except Exception:
        ffmpeg_status = "unavailable"
    return {"status": "ok", "ffmpeg": ffmpeg_status}
