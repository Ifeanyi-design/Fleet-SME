"""Error contract.

Every failure returns ``{ "error": <CODE>, "message": <human text> }`` — the exact shape
`src/lib/apiClient.ts` maps into an `ApiError` on the frontend, so the UI can branch on
`error` (e.g. show the dispatch conflict banner for VEHICLE_UNAVAILABLE).
"""

from flask import jsonify
from werkzeug.exceptions import HTTPException


class ApiError(Exception):
    """Domain failure carrying an HTTP status and a machine-readable code."""

    def __init__(self, status: int, code: str, message: str | None = None):
        super().__init__(message or code)
        self.status = status
        self.code = code
        self.message = message or code


# ── semantic constructors (keeps call sites readable) ───────────────────────


def not_found(message: str = "Resource not found.") -> ApiError:
    return ApiError(404, "NOT_FOUND", message)


def conflict(message: str) -> ApiError:
    return ApiError(409, "CONFLICT", message)


def validation_error(message: str) -> ApiError:
    return ApiError(422, "VALIDATION_ERROR", message)


def vehicle_unavailable(message: str = "Vehicle is currently committed to an active dispatch.") -> ApiError:
    return ApiError(409, "VEHICLE_UNAVAILABLE", message)


def driver_unavailable(message: str = "Selected driver is unavailable.") -> ApiError:
    return ApiError(409, "DRIVER_UNAVAILABLE", message)


def invalid_state(message: str) -> ApiError:
    return ApiError(409, "INVALID_STATE", message)


def unauthorized(message: str = "Authentication required.") -> ApiError:
    return ApiError(401, "UNAUTHORIZED", message)


def forbidden(message: str = "You do not have access to this resource.") -> ApiError:
    return ApiError(403, "FORBIDDEN", message)


def register_error_handlers(app) -> None:
    """Attach JSON handlers so the API never returns an HTML error page."""

    @app.errorhandler(ApiError)
    def _handle_api_error(err: ApiError):
        return jsonify({"error": err.code, "message": err.message}), err.status

    @app.errorhandler(HTTPException)
    def _handle_http_error(err: HTTPException):
        code = {
            401: "UNAUTHORIZED",
            403: "FORBIDDEN",
            404: "NOT_FOUND",
            405: "NOT_FOUND",
        }.get(err.code or 500, "SERVER_ERROR")
        return jsonify({"error": code, "message": err.description}), err.code or 500

    @app.errorhandler(Exception)
    def _handle_unexpected(err: Exception):
        app.logger.exception("Unhandled error", exc_info=err)
        return jsonify({"error": "SERVER_ERROR", "message": "An unexpected error occurred."}), 500
