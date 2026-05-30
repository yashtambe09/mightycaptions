import anthropic
import json
import os


async def adapt_transcript(segments: list, language: str, tone: str, description: str = "") -> list:
    """
    Adapt transcript segments into the target Indian language variant.
    Preserves all original timestamps exactly — only changes the text.
    """
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    system_prompt = """You are a subtitle adapter for Indian Instagram reels.
You receive a transcript of what was spoken in a video and adapt it into the requested Indian language variant.
Keep the EXACT same timestamps — only change the text language/style.

Language rules:
- en-IN: Natural Indian English. Warm, expressive, uses Indian idioms. NOT American or British English.
- hi-EN: Hindi words in Roman script naturally mixed with English. Sounds like texting in Hindi on an English keyboard. NOT Google Translate.
- mr-EN: Marathi words in Roman script. Real Maharashtrian phrases like "ekdum mast", "khup chhan", "aamhi", "baa". NOT translated Marathi.

Rules:
- Keep max 8 words per line
- Preserve ALL original timestamps exactly as given
- Return valid JSON only — no markdown, no explanation, no preamble"""

    user_prompt = (
        f"Original transcript segments: {json.dumps(segments)}\n"
        f"Tone: {tone}\n"
        f"Target language: {language}\n"
        f"Context: {description if description else 'Indian Instagram reel'}\n\n"
        f"Adapt the text into {language} style while keeping ALL timestamps identical.\n"
        'Return ONLY this JSON array:\n'
        '[{"start": original_start, "end": original_end, "text": "adapted text"}]'
    )

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2048,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )

    text = response.content[0].text.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)
