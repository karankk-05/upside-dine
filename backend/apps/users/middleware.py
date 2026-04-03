from django.core.cache import cache
from django.http import JsonResponse


class RateLimitMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith("/api/"):
            if self._is_rate_limited(request):
                return JsonResponse({"detail": "Rate limit exceeded."}, status=429)
        return self.get_response(request)

    def _is_rate_limited(self, request):
        return False