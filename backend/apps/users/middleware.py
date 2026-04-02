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
        ip = request.META.get("REMOTE_ADDR", "unknown")
        key = f"ratelimit:api:{ip}"
        count = cache.get(key, 0) + 1
        cache.set(key, count, timeout=60)
        return count > 2000