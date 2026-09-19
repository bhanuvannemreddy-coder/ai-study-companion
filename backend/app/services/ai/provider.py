import time
from typing import Any

from openai import OpenAI

from app.core.config import settings


class AIProviderError(Exception):
    """Base exception for AI provider failures."""


class AIProviderRateLimitError(AIProviderError):
    """Raised when the AI provider rate limits the request."""


class OpenAICompatibleProvider:
    """
    Provider for APIs that expose an OpenAI-compatible chat completions API.

    This works with:
    - Gemini OpenAI-compatible API
    - Groq
    - OpenAI
    - Ollama-compatible OpenAI endpoints
    - Other compatible providers
    """

    def __init__(self):
        self.provider = settings.AI_PROVIDER
        self.base_url = settings.AI_BASE_URL
        self.api_key = settings.AI_API_KEY
        self.model = settings.AI_MODEL

        if self.provider == "ollama" and not self.api_key:
            self.api_key = "ollama"

        self.client = OpenAI(
            api_key=self.api_key,
            base_url=self.base_url,
        )

    def generate(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.2,
        *,
        db=None,
        user_id: int | None = None,
        project_id: int | None = None,
        feature: str | None = None,
    ) -> str:
        """
        Generate a response from the configured AI provider.

        Telemetry arguments are optional so existing callers continue
        working without modification.
        """

        started_at = time.perf_counter()

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
            )

            latency_ms = (
                time.perf_counter() - started_at
            ) * 1000

            content = self._extract_content(response)

            usage = getattr(response, "usage", None)

            prompt_tokens = self._get_usage_value(
                usage,
                "prompt_tokens",
            )

            completion_tokens = self._get_usage_value(
                usage,
                "completion_tokens",
            )

            total_tokens = self._get_usage_value(
                usage,
                "total_tokens",
            )

            # Record telemetry only when a database session,
            # user, and feature are supplied.
            if (
                db is not None
                and user_id is not None
                and feature
            ):
                self._record_usage(
                    db=db,
                    user_id=user_id,
                    project_id=project_id,
                    feature=feature,
                    latency_ms=latency_ms,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    total_tokens=total_tokens,
                    success=True,
                )

            return content

        except Exception as exc:
            latency_ms = (
                time.perf_counter() - started_at
            ) * 1000

            error_type = type(exc).__name__
            error_message = str(exc)

            if (
                db is not None
                and user_id is not None
                and feature
            ):
                self._record_usage(
                    db=db,
                    user_id=user_id,
                    project_id=project_id,
                    feature=feature,
                    latency_ms=latency_ms,
                    success=False,
                    error_type=error_type,
                    error_message=error_message,
                )

            if self._is_rate_limit_error(exc):
                raise AIProviderRateLimitError(
                    "The AI provider rate limit was reached. "
                    "Please try again shortly."
                ) from exc

            raise AIProviderError(
                f"AI provider request failed: {error_message}"
            ) from exc

    @staticmethod
    def _extract_content(response) -> str:
        """
        Extract assistant text safely from an OpenAI-compatible response.
        """

        try:
            content = response.choices[0].message.content
        except (
            AttributeError,
            IndexError,
            TypeError,
        ) as exc:
            raise AIProviderError(
                "AI provider returned an unexpected response structure."
            ) from exc

        if content is None:
            raise AIProviderError(
                "AI provider returned an empty response."
            )

        return str(content).strip()

    @staticmethod
    def _get_usage_value(
        usage: Any,
        attribute: str,
    ) -> int | None:
        if usage is None:
            return None

        value = getattr(usage, attribute, None)

        if value is None:
            return None

        try:
            return int(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _is_rate_limit_error(exc: Exception) -> bool:
        """
        Detect common rate-limit responses without depending
        on one provider-specific exception class.
        """

        class_name = type(exc).__name__.lower()
        message = str(exc).lower()

        rate_limit_indicators = (
            "rate",
            "429",
            "quota",
            "too many requests",
            "resource exhausted",
        )

        if "ratelimit" in class_name:
            return True

        return any(
            indicator in message
            for indicator in rate_limit_indicators
        )

    @staticmethod
    def _record_usage(
        *,
        db,
        user_id: int,
        project_id: int | None,
        feature: str,
        latency_ms: float,
        prompt_tokens: int | None = None,
        completion_tokens: int | None = None,
        total_tokens: int | None = None,
        success: bool,
        error_type: str | None = None,
        error_message: str | None = None,
    ):
        """
        Persist AI telemetry.

        Telemetry failure must never make an otherwise successful
        AI request fail, so this is intentionally isolated.
        """

        try:
            from app.services.analytics.ai_usage import (
                record_ai_usage,
            )

            record_ai_usage(
                db=db,
                user_id=user_id,
                project_id=project_id,
                feature=feature,
                provider=settings.AI_PROVIDER,
                model=settings.AI_MODEL,
                latency_ms=latency_ms,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens,
                estimated_cost=None,
                success=success,
                error_type=error_type,
                error_message=error_message,
            )

        except Exception:
            # Observability must not break the learning experience.
            # The request result remains the source of truth.
            try:
                db.rollback()
            except Exception:
                pass


def get_ai_provider() -> OpenAICompatibleProvider:
    """
    Return the configured AI provider.
    """

    return OpenAICompatibleProvider()