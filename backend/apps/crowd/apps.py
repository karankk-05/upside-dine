from django.apps import AppConfig


class CrowdConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.crowd"
    verbose_name = "Crowd Monitoring"

    def ready(self):
        # Import inside ready to avoid AppRegistryNotReady exceptions
        from . import models
        from .views import _sync_feeds_to_redis
        
        # When Django starts, push all active feeds to Redis so ML service can see them immediately
        try:
            _sync_feeds_to_redis()
        except Exception:
            # Fails on first run if DB isn't migrated yet
            pass
