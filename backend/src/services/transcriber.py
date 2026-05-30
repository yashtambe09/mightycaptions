import anthropic
import base64
import json
import os


async def transcribe_audio(audio_path: str) -> list:
    """
    Transcribe audio using Claude's native audio input.
    Returns list of segments: [{"start": 0.0, "end": 2.5, "text": "..."}]
    """
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    with open(audio_path, "rb") as f:
        audio_data = base64.standard_b64encode(f.read()).decode("utf-8")

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "document",
                    "source": {
                        "type": "base64",
                        "media_type": "audio/mp3",
                        "data": audio_data,
                    },
                },
                {
                    "type": "text",
                    "text": (
                        "Transcribe this audio exactly word for word.\n"
                        "Return ONLY a JSON array of timed segments.\n"
                        "Each segment should be 5-8 words maximum.\n"
                        "Estimate timestamps based on natural speech pacing.\n"
                        'Format: [{"start": 0.0, "end": 2.5, "text": "exactly what was said"}]\n'
                        "No markdown, no explanation, just the JSON array."
                    ),
                },
            ],
        }],
    )

    text = response.content[0].text.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)
