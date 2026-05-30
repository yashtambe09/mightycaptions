import os
import base64
import ffmpeg


def extract_frames(input_path: str, count: int = 5) -> list[str]:
    """Extract evenly spaced frames from a video and return as base64 JPEG strings."""
    probe = ffmpeg.probe(input_path)
    duration = float(probe["format"]["duration"])

    job_dir = os.path.dirname(input_path)
    frames_b64 = []

    for i in range(count):
        timestamp = (duration / (count + 1)) * (i + 1)
        frame_path = f"{job_dir}/frame_{i}.jpg"

        (
            ffmpeg
            .input(input_path, ss=timestamp)
            .output(frame_path, vframes=1, format="image2", vcodec="mjpeg")
            .overwrite_output()
            .run(quiet=True)
        )

        with open(frame_path, "rb") as f:
            frames_b64.append(base64.b64encode(f.read()).decode("utf-8"))

    return frames_b64
