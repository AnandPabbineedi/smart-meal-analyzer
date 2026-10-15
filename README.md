# Smart Meal Analyzer

Snap a photo of your meal or describe it, and get a nutrition label with calories, macros, and a health score.

**Live demo:** [meal.anandpabbineedi.site](https://meal.anandpabbineedi.site)

![Smart Meal Analyzer showing a nutrition facts label for idli with sambar](docs/screenshot.png)

> The backend runs on a free server, so the first request can take up to a minute while it wakes up.

## Features

- **Photo, text, or both.** Upload a meal photo, describe it ("2 idlis with sambar"), or combine them so the description refines portion size.
- **Nutrition Facts label.** Calories, protein, carbs, and fat, with each macro's share of calories calculated from grams (4 kcal/g for protein and carbs, 9 kcal/g for fat).
- **Health score and tips.** A score out of 100 with the reasoning behind it, suggestions to improve the meal, and tips for weight loss, muscle gain, or general health.
- **Non-food detection.** Photos that aren't food get a clear message instead of a made-up label.

## How it works

```mermaid
flowchart LR
    A[React app] -->|compressed image + text| B[FastAPI Backend]
    B -->|rate limit and validate| B
    B -->|image bytes + structured prompt| C[Google Gemini]
    C -->|JSON schema output| B
    B -->|Pydantic validated result| A
```

1. The browser compresses the photo (max 1024px, about 0.5 MB) before upload, so requests stay fast on mobile data.
2. The FastAPI backend validates rate limits, checks file types (JPG, PNG, WEBP, or HEIC up to 5 MB) and validates description constraints via Pydantic.
3. The image goes to Gemini as inline bytes in memory, never persisted to disk, with response schema enforced.
4. The server validates and normalizes the payload using Pydantic v2 models, filters non-food inputs, and returns a clean, typed response.

## Engineering decisions

| Decision | Why |
|---|---|
| FastAPI & Pydantic v2 | High-performance asynchronous execution, automatic request validation, self-documenting OpenAPI schemas, and strict data modeling. |
| In-memory image processing | Memory-only buffer handling with zero disk I/O eliminates leftover files and prevents disk exhaustion attacks. |
| Per-IP rate limit plus global daily cap | In-memory sliding window rate limiter protects quota against abuse without requiring external database dependencies. |
| Dynamic least-token model fallback | If a model hits traffic limits (HTTP 429 quota/rate limit) or is unavailable (HTTP 404/503), the server dynamically checks and attempts the least token-consuming models (`gemini-3.5-flash-lite`, `gemini-flash-lite-latest`, `gemini-2.5-flash`, etc.) before presenting an error to the user. |
| Origin allowlist (CORS) | Only this app's own domains can call the API from a browser. |
| Configurable model (`GEMINI_MODEL`) | Optional preference override. Defaults to the most token-efficient lightweight model (`gemini-3.5-flash-lite`). |

## Tech stack

- **Frontend:** React 19, Vite, browser-image-compression
- **Backend:** Python 3.12+, FastAPI, Uvicorn, Pydantic v2
- **AI:** Google Gemini via `google-genai` Python SDK
- **Testing:** Pytest, HTTPX
- **Hosting:** Netlify (frontend), Render (backend), custom domain with HTTPS

## API

`POST /analyze` (multipart form)

| Field | Type | Notes |
|---|---|---|
| `image` | file, optional | JPG, PNG, WEBP, or HEIC, up to 5 MB |
| `text` | string, optional | Meal description, up to 500 characters |

At least one is required. Returns `food_name`, `calories`, `protein`, `carbs`, `fat`, `score`, `scoreReason`, `suggestions`, and `goalTips`. Errors return `{ "error": "message" }` with status 400, 413, 422 (not food), 429 (rate limited), 502 (unreadable AI response), or 500.

`GET /` returns a health check with the active model.

## Run locally

**Backend (Python FastAPI)**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
GEMINI_API_KEY=your_key_from_google_ai_studio
GEMINI_MODEL=gemini-3.5-flash-lite
PORT=5000
```

Run the API:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload
```

Run tests:

```bash
pytest -v
```

**Frontend**

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

```bash
npm run dev
```

Open http://localhost:5173.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | (required) | Google AI Studio API key |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` | Preferred Gemini model (dynamically falls back to least-token models if busy/unavailable) |
| `HOURLY_LIMIT_PER_IP` | `15` | Analyses per visitor per hour |
| `DAILY_LIMIT` | `300` | Total analyses per day across all visitors |
| `PORT` | `5000` | Server port |

## Limitations and next steps

- Nutrition values are AI estimates from a photo, not lab measurements.
- Rate limit counters live in memory and reset when the server restarts. A shared store like Redis would make them durable across instances.
- Possible additions: a meal history with daily totals, and user-confirmed portion sizes to improve accuracy.

## Author

Built by [Anand Pabbineedi](https://anandpabbineedi.site). [LinkedIn](https://www.linkedin.com/in/anand-pabbineedi-6b3b93257/)
