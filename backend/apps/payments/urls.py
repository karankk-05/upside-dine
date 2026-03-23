from django.urls import path

from .views import (
    PaymentCreateOrderView,
    PaymentRefundView,
    PaymentStatusView,
    PaymentVerifyView,
    PaymentWebhookView,
)

urlpatterns = [
    path("payments/create-order/", PaymentCreateOrderView.as_view(), name="payments-create-order"),
    path("payments/verify/", PaymentVerifyView.as_view(), name="payments-verify"),
    path("payments/webhook/", PaymentWebhookView.as_view(), name="payments-webhook"),
    path("payments/<int:order_id>/refund/", PaymentRefundView.as_view(), name="payments-refund"),
    path("payments/<int:order_id>/status/", PaymentStatusView.as_view(), name="payments-status"),
]
