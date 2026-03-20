from django.core.cache import cache
from rest_framework_simplejwt.authentication import JWTAuthentication as SimpleJWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class JWTAuthentication(SimpleJWTAuthentication):
    """Custom JWT authentication that checks token blacklist in Redis."""

    def get_validated_token(self, raw_token):
        validated = super().get_validated_token(raw_token)
        jti = validated.get("jti")
        if jti and cache.get(f"blacklist:token:{jti}"):
            raise AuthenticationFailed("Token is blacklisted.")
        return validated


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Inject role and user_id into JWT claims so the frontend can read them."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email
        token["role"] = user.role.role_name if user.role else None
        token["is_superuser"] = user.is_superuser
        return token