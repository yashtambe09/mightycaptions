import os
import uuid
import base64
import subprocess
import ffmpeg
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

router = APIRouter()

MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB


@router.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    if file.content_type not in ("video/mp4", "video/quicktime"):
        raise HTTPException(status_code=400, detail="Only MP4 and MOV files are accepted")

    job_id = str(uuid.uuid4())
    job_dir = f"/tmp/{job_id}"
    os.makedirs(job_dir, exist_ok=True)

    input_path = f"{job_dir}/input.mp4"
    contents = await file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds 500MB limit")

    with open(input_path, "wb") as f:
        f.write(contents)

    # Get video duration via ffprobe
    try:
        probe = ffmpeg.probe(input_path)
        duration = float(probe["format"]["duration"])
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not read video metadata: {e}")

    # Extract first frame as JPEG thumbnail
    thumbnail_path = f"{job_dir}/thumb.jpg"
    try:
        (
            ffmpeg
            .input(input_path, ss=0)
            .output(thumbnail_path, vframes=1, format="image2", vcodec="mjpeg")
            .overwrite_output()
            .run(quiet=True)
        )
        with open(thumbnail_path, "rb") as img:
            thumbnail_b64 = base64.b64encode(img.read()).decode("utf-8")
    except Exception:
        thumbnail_b64 = ""

    # Extract audio in background while user fills in settings
    audio_path = f"{job_dir}/audio.mp3"
    subprocess.Popen([
        "ffmpeg", "-i", input_path,
        "-vn", "-acodec", "mp3",
        "-ar", "16000", "-ac", "1",
        audio_path, "-y",
    ])

    return JSONResponse({
        "jobId": job_id,
        "duration": round(duration, 2),
        "thumbnail": thumbnail_b64,
    })
