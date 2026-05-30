# MightyCaptions — Claude Code Build Prompt

Build the MightyCaptions app — a full-stack web application where Indian Instagram creators upload a reel video, AI generates time-synced subtitles in three Indian language variants (English Indian, Hinglish, MarathiEnglish), the user edits and customises the captions, and downloads the final video with captions burned in.

---

## Tech Stack

- Frontend: React 18 + Vite + TailwindCSS → deploys to Cloudflare Pages
- Backend: Python 3.11 + FastAPI + FFmpeg → deploys to Render (Docker)
- AI: Anthropic Claude API (`claude-sonnet-4-20250514`) — vision API with video frames
- Domain: `mightycaptions.in`

**Environment variables (set these up):**
```
ANTHROPIC_API_KEY=sk-ant-api03-[actual key]
FRONTEND_URL=https://mightycaptions.in
BACKEND_URL=https://api.mightycaptions.in
```

---

## Repo Structure

```
mightycaptions/
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   └── Result.jsx
│   │   ├── components/
│   │   │   ├── VideoUpload.jsx
│   │   │   ├── LanguageToggle.jsx
│   │   │   ├── TonePicker.jsx
│   │   │   ├── CaptionEditor.jsx
│   │   │   ├── StylePicker.jsx
│   │   │   └── VideoPreview.jsx
│   │   └── hooks/
│   │       └── useGenerate.js
│   ├── public/
│   ├── _redirects
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── backend/
    ├── src/
    │   ├── main.py
    │   ├── routes/
    │   │   ├── upload.py
    │   │   ├── generate.py
    │   │   └── process.py
    │   ├── services/
    │   │   ├── frame_extractor.py
    │   │   ├── caption_ai.py
    │   │   └── video_burner.py
    │   └── utils/
    │       └── cleanup.py
    ├── fonts/
    │   ├── Montserrat-Bold.ttf
    │   ├── Montserrat-ExtraBold.ttf
    │   ├── Inter-Regular.ttf
    │   ├── Inter-SemiBold.ttf
    │   └── PlayfairDisplay-Bold.ttf
    ├── requirements.txt
    ├── Dockerfile
    └── render.yaml
```

---

## Backend — Python 3.11 + FastAPI + FFmpeg

### `requirements.txt`
```
fastapi
uvicorn[standard]
python-multipart
ffmpeg-python
httpx
anthropic
python-dotenv
aiofiles
uuid
```

### `Dockerfile`
```dockerfile
FROM python:3.11-slim
RUN apt-get update && apt-get install -y \
    ffmpeg \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY fonts/ /usr/share/fonts/mightycaptions/
RUN fc-cache -f -v
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY src/ ./src/
ENV PYTHONUNBUFFERED=1
EXPOSE 3000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "3000"]
```

### `render.yaml`
```yaml
services:
  - type: web
    name: mightycaptions-api
    runtime: docker
    dockerfilePath: ./Dockerfile
    envVars:
      - key: ANTHROPIC_API_KEY
        sync: false
      - key: NODE_ENV
        value: production
      - key: FRONTEND_URL
        value: https://mightycaptions.in
```

### `src/main.py`
FastAPI app entry point. Mount all routers. Configure CORS to allow only `https://mightycaptions.in` and `http://localhost:5173`. Add `/api/health` endpoint returning `{ "status": "ok", "ffmpeg": "available" }`.

### `src/routes/upload.py` — POST /api/upload
- Accept video file (MP4/MOV) via `python-multipart`, max 500MB
- Generate a `uuid` as `jobId`
- Save to `/tmp/{jobId}/input.mp4`
- Use `ffmpeg-python` to extract first frame as JPEG thumbnail, encode as base64
- Use `ffprobe` via `ffmpeg.probe()` to get video duration
- Return `{ "jobId": jobId, "duration": duration, "thumbnail": base64_string }`

### `src/routes/generate.py` — POST /api/generate
- Accept `{ jobId, description, tone, languages }` as JSON body
- Call `frame_extractor.py` to extract 5 evenly spaced frames from `/tmp/{jobId}/input.mp4` as base64 JPEGs using ffmpeg-python
- Call `caption_ai.py` which sends frames + settings to Anthropic Claude API using the `anthropic` Python SDK

**System prompt:**
```
You are a subtitle generator for Indian Instagram reels.
Generate accurate time-synced subtitles in the requested language.
Language rules:
- en-IN: Natural Indian English, warm, expressive, uses Indian idioms. NOT American or British English.
- hi-EN: Hindi words in Roman/English script naturally mixed with English. Sounds like texting in Hindi on an English keyboard. NOT Google Translate.
- mr-EN: Marathi words and expressions in Roman script. Use real Maharashtrian phrases like "ekdum mast", "khup chhan", "aamhi", "baa". NOT Marathi translated to English.
Rules: Max 8 words per subtitle line. Max 2 lines on screen. Subtitles must cover the full video duration with no gaps longer than 2 seconds.
Always return valid JSON only — no markdown, no explanation, no preamble.
```

**User prompt:**
```
Video description: {description}
Tone: {tone}
Languages requested: {languages}
Video duration: {duration} seconds

Analyse the frames and return ONLY this JSON:
{"en-IN": [{"start": 0.0, "end": 3.5, "text": "..."}], "hi-EN": [...], "mr-EN": [...]}
```

- Return `{ "jobId": jobId, "captions": { "en-IN": [...], "hi-EN": [...], "mr-EN": [...] } }`

### `src/routes/process.py` — POST /api/process
- Accept `{ jobId, language, captions, style }` as JSON body
- Call `video_burner.py` which:
  1. Converts captions list to `.srt` format, saves to `/tmp/{jobId}/captions.srt`
  2. Runs FFmpeg with subtitles filter to burn captions with the selected style
  3. Outputs to `/tmp/{jobId}/output.mp4`
- Stream back the output MP4 as a `FileResponse` with `media_type="video/mp4"` and `Content-Disposition: attachment; filename="mightycaptions_output.mp4"`
- After streaming, delete all files in `/tmp/{jobId}/` using `cleanup.py`

### `src/services/video_burner.py` — FFmpeg subtitle styles
```python
STYLES = {
    "clean_white": "FontName=Montserrat-Bold,FontSize=48,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Alignment=2,MarginV=60",
    "instagram_bold": "FontName=Montserrat-ExtraBold,FontSize=54,PrimaryColour=&H0033E0FF,OutlineColour=&H00000000,Outline=3,Alignment=2,MarginV=60,Uppercase=1",
    "podcast": "FontName=Inter-SemiBold,FontSize=44,PrimaryColour=&H00FFFFFF,BackColour=&H80000000,BorderStyle=4,Alignment=2,MarginV=60",
    "minimal": "FontName=Inter-Regular,FontSize=38,PrimaryColour=&H00FFFFFF,BackColour=&H33000000,BorderStyle=4,Alignment=2,MarginV=40",
    "aesthetic": "FontName=PlayfairDisplay-Bold,FontSize=46,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=1,Alignment=5"
}
```

FFmpeg command pattern:
```python
stream = ffmpeg.input(input_path)
stream = ffmpeg.output(
    stream,
    output_path,
    vf=f"subtitles={srt_path}:force_style='{style_string}'",
    acodec='copy',
    vcodec='libx264',
    preset='fast',
    crf=23
)
ffmpeg.run(stream, overwrite_output=True)
```

---

## Frontend — React 18 + Vite + TailwindCSS

### Design System
- Background: `#0F0F0F`
- Card surfaces: `#1A1A1A`
- Accent: `#FF5757` (coral red)
- Text primary: `#FFFFFF`
- Text secondary: `#888888`
- Border: `#2A2A2A`
- Dark theme throughout, mobile-first, Instagram-inspired

### `src/pages/Home.jsx` — Upload & Settings screen
- Full-width drag-and-drop zone with dashed border, upload icon, "Drop your reel here" text
- Accepts MP4/MOV only, shows upload progress bar
- After upload: shows 9:16 thumbnail card + video duration
- Description textarea: placeholder "What's this reel about? (e.g. morning chai routine, beach day, cooking dal...)"
- Tone selector — horizontal scrollable pill row, single select:
  - 😄 Relatable · ✨ Inspirational · 📚 Informative · 😂 Funny · 🌸 Aesthetic
- Language toggles — three pill toggles, all ON by default:
  - 🇮🇳 English (Indian) — "How are you?"
  - 🙏 Hinglish — "Kaise ho?"
  - 🧡 MarathiEnglish — "Kashe ahat?"
- Style picker — 5 cards in a horizontal scroll row, each showing style name + small visual preview of how text looks
- **Generate Captions** button — full width, `#FF5757` background, white text
- Loading state: skeleton cards with pulsing animation and "Analysing your reel..." text

### `src/pages/Result.jsx` — Review & Download screen
- Left column: video preview player (9:16), language switcher below it to toggle which language shows as overlay
- Right column: caption editor with tabs for each selected language
- Each caption line shown as an editable card: `[00:00 → 00:03]` timestamp + editable text input
- Timestamps are also editable (click to edit start/end time)
- **Download Video** button — calls `POST /api/process`, shows progress "Burning captions… ~30 seconds", then auto-downloads the MP4
- Back button to return to Home

### `_redirects` (in `frontend/` root)
```
/* /index.html 200
```

### `vite.config.js`
Proxy `/api` to `http://localhost:3000` in dev mode so frontend and backend work together locally.

---

## Fonts

Download these from Google Fonts and save as TTF files in `backend/fonts/`:
- `Montserrat-Bold.ttf`
- `Montserrat-ExtraBold.ttf`
- `Inter-Regular.ttf`
- `Inter-SemiBold.ttf`
- `PlayfairDisplay-Bold.ttf`

---

## After Building All Files

1. Run `pip install -r requirements.txt` in `backend/`
2. Run `uvicorn src.main:app --reload --port 3000` to verify backend starts and `GET /api/health` returns ok
3. Run `npm install && npm run dev` in `frontend/` to verify it launches on `localhost:5173`
4. Fix any errors before stopping
5. Create a GitHub repo called `mightycaptions`, commit all code, push to main branch
6. Share the GitHub repo URL

---

## Branding

- App name: **MightyCaptions**
- Tagline: **"Your reels, now they speak"**
- Primary accent colour: `#FF5757` throughout the UI
