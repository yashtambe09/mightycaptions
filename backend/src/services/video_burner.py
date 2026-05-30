import os
import subprocess

STYLES = {
    "clean_white": "FontName=Montserrat-Bold,FontSize=48,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Alignment=2,MarginV=60",
    "instagram_bold": "FontName=Montserrat-ExtraBold,FontSize=54,PrimaryColour=&H0033E0FF,OutlineColour=&H00000000,Outline=3,Alignment=2,MarginV=60,Uppercase=1",
    "podcast": "FontName=Inter-SemiBold,FontSize=44,PrimaryColour=&H00FFFFFF,BackColour=&H80000000,BorderStyle=4,Alignment=2,MarginV=60",
    "minimal": "FontName=Inter-Regular,FontSize=38,PrimaryColour=&H00FFFFFF,BackColour=&H33000000,BorderStyle=4,Alignment=2,MarginV=40",
    "aesthetic": "FontName=PlayfairDisplay-Bold,FontSize=46,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=1,Alignment=5",
}


def _to_srt_timestamp(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds - int(seconds)) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def captions_to_srt(captions: list[dict]) -> str:
    lines = []
    for i, cap in enumerate(captions, start=1):
        start = _to_srt_timestamp(cap["start"])
        end = _to_srt_timestamp(cap["end"])
        lines.append(f"{i}\n{start} --> {end}\n{cap['text']}\n")
    return "\n".join(lines)


def burn_captions(job_id: str, captions: list[dict], style: str) -> str:
    job_dir = f"/tmp/{job_id}"
    input_path = f"{job_dir}/input.mp4"
    srt_path = f"{job_dir}/captions.srt"
    output_path = f"{job_dir}/output.mp4"

    srt_content = captions_to_srt(captions)
    with open(srt_path, "w", encoding="utf-8") as f:
        f.write(srt_content)

    style_string = STYLES.get(style, STYLES["clean_white"])

    # Escape the srt path for the subtitles filter (colon must be escaped on Linux)
    escaped_srt = srt_path.replace("\\", "/").replace(":", "\\:")

    # Use subprocess directly so we can:
    # - map only the first video + first audio stream (skips APAC / unknown codecs)
    # - re-encode audio to AAC (acodec copy hangs on APAC from iPhone 17+)
    # - set a hard timeout so the route never blocks forever
    result = subprocess.run(
        [
            "ffmpeg", "-y",
            "-i", input_path,
            "-map", "0:v:0",          # first video stream only
            "-map", "0:a:0",          # first audio stream only (skips APAC)
            "-vf", f"subtitles={escaped_srt}:force_style='{style_string}'",
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "23",
            "-c:a", "aac",            # always re-encode audio — never copy APAC
            "-b:a", "128k",
            output_path,
        ],
        capture_output=True,
        timeout=480,                  # 8-minute hard ceiling
    )

    if result.returncode != 0:
        raise RuntimeError(result.stderr.decode("utf-8", errors="replace"))

    return output_path
