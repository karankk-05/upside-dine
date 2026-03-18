from django.core.cache import cache
from rest_framework_simplejwt.authentication import JWTAuthentication as SimpleJWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed


class JWTAuthentication(SimpleJWTAuthentication):
    def get_validated_token(self, raw_token):
        validated = super().get_validated_token(raw_token)
        jti = validated.get("jti")
        if jti and cache.get(f"blacklist:token:{jti}"):
            raise AuthenticationFailed("Token is blacklisted.")
        return validated