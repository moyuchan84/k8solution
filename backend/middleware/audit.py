import logging
import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("audit")


class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        start = time.monotonic()
        response = await call_next(request)
        duration_ms = int((time.monotonic() - start) * 1000)

        user = getattr(request.state, "user", None)
        logger.info(
            "%s %s %s %dms user=%s",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
            getattr(user, "sub", "anonymous"),
        )
        return response
