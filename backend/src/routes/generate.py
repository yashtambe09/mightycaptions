import asyncio
import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List

from src.services.transcriber import transcribe_audio
from src.services.caption_ai import adapt_transcript

router = APIRouter()


class GenerateRequest(BaseModel):
    jobId: str
    description: str = ""
    tone: str = "Relatable"
    languages: List[str] = ["en-IN"]


@router.post("/generate")
async def generate_captions(request: GenerateRequest):
    audio_path = f"/tmp/{request.jobId}/audio.mp3"

    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio not found. Upload video first.")

    try:
        transcript_segments = await transcribe_audio(audio_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

    async def adapt_for_language(language: str):
        return language, await adapt_transcript(
            segments=transcript_segments,
            language=language,
            tone=request.tone,
            description=request.description,
        )

    try:
        results = await asyncio.gather(*[
            adapt_for_language(lang) for lang in request.languages
        ])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Language adaptation failed: {str(e)}")

    captions = {lang: segments for lang, segments in results}

    return JSONResponse({"jobId": request.jobId, "captions": captions})
