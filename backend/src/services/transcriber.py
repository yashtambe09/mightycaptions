import os
from deepgram import DeepgramClient, PrerecordedOptions


async def transcribe_audio(audio_path: str) -> list:
    """
    Transcribe audio using Deepgram Nova-2.
    Returns list of segments: [{"start": 0.0, "end": 2.5, "text": "..."}]
    """
    deepgram = DeepgramClient(os.environ.get("DEEPGRAM_API_KEY"))

    with open(audio_path, "rb") as f:
        buffer_data = f.read()

    payload = {"buffer": buffer_data}
    options = PrerecordedOptions(
        model="nova-2",
        language="hi",       # Nova-2 handles Hindi, English, and mixed Indian speech well
        smart_format=True,
        utterances=True,
        punctuate=True,
    )

    response = deepgram.listen.rest.v("1").transcribe_file(payload, options)

    # Convert Deepgram utterances → our segment format
    segments = []
    for utterance in response.results.utterances:
        segments.append({
            "start": utterance.start,
            "end": utterance.end,
            "text": utterance.transcript,
        })

    return segments
