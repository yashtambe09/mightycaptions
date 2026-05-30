import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any

from src.services.video_burner import burn_captions
from src.utils.cleanup import cleanup_job

router = APIRouter()


class Caption(BaseModel):
    start: float
    end: float
    text: str


class ProcessRequest(BaseModel):
    jobId: str
    language: str
    captions: List[Caption]
    style: str


@router.post("/process")
async def process(req: ProcessRequest):
    input_path = f"/tmp/{req.jobId}/input.mp4"
    if not os.path.exists(input_path):
        raise HTTPException(status_code=404, detail="Job not found")

    captions_list = [c.dict() for c in req.captions]

    try:
        output_path = burn_captions(
            job_id=req.jobId,
            captions=captions_list,
            style=req.style,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Video processing failed: {e}")

    if not os.path.exists(output_path):
        raise HTTPException(status_code=500, detail="Output file was not created")

    return FileResponse(
        path=output_path,
        media_type="video/mp4",
        filename="mightycaptions_output.mp4",
        headers={"Content-Disposition": "attachment; filename=mightycaptions_output.mp4"},
        background=cleanup_job(req.jobId),
    )
