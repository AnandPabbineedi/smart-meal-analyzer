"""FastAPI main application entrypoint for Smart Meal Analyzer."""

from contextlib import asynccontextmanager
import logging
from typing import Optional
from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, Response, UploadFile, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from google import genai

from .config import Settings, get_settings
from .schemas.meal import ErrorResponse, HealthStatusResponse, MealAnalysisResponse
from .services.meal_analyzer import analyze_meal
from .services.model_manager import get_available_least_models
from .utils.rate_limiter import RateLimiter

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("meal_analyzer")

# Global instances
rate_limiter: Optional[RateLimiter] = None
genai_client: Optional[genai.Client] = None

MAX_TEXT_LENGTH = 500
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes singletons and resources on startup."""
    global rate_limiter, genai_client
    settings = get_settings()

    rate_limiter = RateLimiter(
        hourly_limit_per_ip=settings.hourly_limit_per_ip,
        daily_limit=settings.daily_limit,
    )

    if settings.api_key:
        genai_client = genai.Client(api_key=settings.api_key)
        logger.info("Initialized Google GenAI client successfully.")
    else:
        logger.warning("No GEMINI_API_KEY detected in environment.")

    yield
    # Cleanup on shutdown if needed


app = FastAPI(
    title="Smart Meal Analyzer API",
    version="2.0.0",
    description="Multimodal meal nutrition analyzer powered by Google Gemini and FastAPI.",
    lifespan=lifespan,
)

# CORS Configuration
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?|https://.*\.netlify\.app|https://.*\.anandpabbineedi\.site",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-AI-Model-Used"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Formats all HTTPExceptions as {'error': 'detail'} to maintain contract with frontend."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Translates validation failures into readable error messages."""
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"error": "Invalid request parameters."},
    )


def get_client_ip(request: Request) -> str:
    """Extracts client IP, respecting proxy forwarding."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


async def check_rate_limits(request: Request):
    """Enforces per-IP and daily rate limits."""
    if rate_limiter:
        ip = get_client_ip(request)
        allowed, msg = await rate_limiter.check(ip)
        if not allowed:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=msg)


@app.get(
    "/",
    response_model=HealthStatusResponse,
    summary="Health check and active model status",
)
async def health_check(settings: Settings = Depends(get_settings)):
    """Reports API health and detected available models."""
    available_models = await get_available_least_models(settings.api_key)
    return HealthStatusResponse(
        status="ok",
        preferredModel=settings.gemini_model,
        availableFallbackModels=available_models,
    )


@app.post(
    "/analyze",
    response_model=MealAnalysisResponse,
    responses={
        400: {"model": ErrorResponse},
        413: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
        429: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
        502: {"model": ErrorResponse},
    },
    dependencies=[Depends(check_rate_limits)],
    summary="Analyze meal photo and/or description",
)
async def analyze(
    response: Response,
    text: Optional[str] = Form(default=None),
    image: Optional[UploadFile] = File(default=None),
    settings: Settings = Depends(get_settings),
):
    """Analyzes a food photo and/or description to estimate nutrition facts."""
    cleaned_text = (text or "").strip()

    if not image and not cleaned_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Add a photo or describe your meal.",
        )

    if len(cleaned_text) > MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Keep the description under {MAX_TEXT_LENGTH} characters.",
        )

    image_bytes: Optional[bytes] = None
    mime_type: Optional[str] = None

    if image:
        if image.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Upload a JPG, PNG, WEBP or HEIC photo.",
            )

        image_bytes = await image.read()
        if len(image_bytes) > MAX_IMAGE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Photo is larger than 5 MB.",
            )
        mime_type = image.content_type

    # Ensure GenAI client exists
    client = genai_client
    if not client:
        if not settings.api_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Gemini API key is not configured.",
            )
        client = genai.Client(api_key=settings.api_key)

    meal_result, model_used = await analyze_meal(
        client=client,
        api_key=settings.api_key,
        text=cleaned_text if cleaned_text else None,
        image_bytes=image_bytes,
        mime_type=mime_type,
        preferred_model=settings.gemini_model,
    )

    response.headers["X-AI-Model-Used"] = model_used
    return meal_result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.port, reload=True)
