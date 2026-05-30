import os
import json
import ffmpeg
import anthropic

SYSTEM_PROMPT = """You are a subtitle generator for Indian Instagram reels.
Generate accurate time-synced subtitles in the requested language.
Language rules:
- en-IN: Natural Indian English, warm, expressive, uses Indian idioms. NOT American or British English.
- hi-EN: Hindi words in Roman/English script naturally mixed with English. Sounds like texting in Hindi on an English keyboard. NOT Google Translate.
- mr-EN: Marathi words and expressions in Roman script. Use real Maharashtrian phrases like "ekdum mast", "khup chhan", "aamhi", "baa". NOT Marathi translated to English.
Rules: Max 8 words per subtitle line. Max 2 lines on screen. Subtitles must cover the full video duration with no gaps longer than 2 seconds.
Always return valid JSON only — no markdown, no explanation, no preamble."""


async def generate_captions(
    frames: list[str],
    description: str,
    tone: str,
    languages: list[str],
    input_path: str,
) -> dict:
    probe = ffmpeg.probe(input_path)
    duration = float(probe["format"]["duration"])

    client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    image_content = [
        {
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": "image/jpeg",
                "data": frame_b64,
            },
        }
        for frame_b64 in frames
    ]

    user_text = (
        f"Video description: {description}\n"
        f"Tone: {tone}\n"
        f"Languages requested: {', '.join(languages)}\n"
        f"Video duration: {round(duration, 2)} seconds\n\n"
        'Analyse the frames and return ONLY this JSON:\n'
        '{"en-IN": [{"start": 0.0, "end": 3.5, "text": "..."}], "hi-EN": [...], "mr-EN": [...]}'
    )

    message = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": image_content + [{"type": "text", "text": user_text}],
            }
        ],
    )

    raw = message.content[0].text.strip()
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    captions = json.loads(raw)

    # Filter to only requested languages
    return {lang: captions.get(lang, []) for lang in languages}
