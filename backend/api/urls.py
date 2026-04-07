from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.health_check, name='health-check'),
    path('add/', views.add_numbers, name='add-numbers'),
]
