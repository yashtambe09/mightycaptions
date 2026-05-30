import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List

from src.services.frame_extractor import extract_frames
from src.services.caption_ai import generate_captions

router = APIRouter()


class GenerateRequest(BaseModel):
    jobId: str
    description: str
    tone: str
    languages: List[str]


@router.post("/generate")
async def generate(req: GenerateRequest):
    input_path = f"/tmp/{req.jobId}/input.mp4"
    if not os.path.exists(input_path):
        raise HTTPException(status_code=404, detail="Job not found. Please upload a video first.")

    try:
        frames = extract_frames(input_path, count=5)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Frame extraction failed: {e}")

    try:
        captions = await generate_captions(
            frames=frames,
            description=req.description,
            tone=req.tone,
            languages=req.languages,
            input_path=input_path,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Caption generation failed: {e}")

    return JSONResponse({"jobId": req.jobId, "captions": captions})
