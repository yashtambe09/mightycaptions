import os
import ffmpeg

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

    # Escape the srt path for the subtitles filter
    escaped_srt = srt_path.replace("\\", "/").replace(":", "\\:")

    stream = ffmpeg.input(input_path)
    stream = ffmpeg.output(
        stream,
        output_path,
        vf=f"subtitles={escaped_srt}:force_style='{style_string}'",
        acodec="copy",
        vcodec="libx264",
        preset="fast",
        crf=23,
    )
    ffmpeg.run(stream, overwrite_output=True)

    return output_path
