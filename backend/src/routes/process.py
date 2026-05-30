import os
import asyncio
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List

from src.services.video_burner import burn_captions
from src.utils.cleanup import cleanup_job

router = APIRouter()

CHUNK_SIZE = 1024 * 1024  # 1MB


class Caption(BaseModel):
    start: float
    end: float
    text: str


class ProcessRequest(BaseModel):
    jobId: str
    language: str
    captions: List[Caption]
    style: str


async def run_ffmpeg(job_id: str, captions_list: list, style: str) -> str:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None, burn_captions, job_id, captions_list, style
    )


async def stream_file(path: str):
    with open(path, "rb") as f:
        while chunk := f.read(CHUNK_SIZE):
            yield chunk


@router.post("/process")
async def process(req: ProcessRequest, background_tasks: BackgroundTasks):
    input_path = f"/tmp/{req.jobId}/input.mp4"
    if not os.path.exists(input_path):
        raise HTTPException(status_code=404, detail="Job not found")

    captions_list = [c.dict() for c in req.captions]

    try:
        output_path = await run_ffmpeg(req.jobId, captions_list, req.style)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Video processing failed: {e}")

    if not os.path.exists(output_path):
        raise HTTPException(status_code=500, detail="Output file was not created")

    cleanup = cleanup_job(req.jobId)
    background_tasks.add_task(cleanup.func)

    return StreamingResponse(
        stream_file(output_path),
        media_type="video/mp4",
        headers={"Content-Disposition": "attachment; filename=mightycaptions_output.mp4"},
    )
