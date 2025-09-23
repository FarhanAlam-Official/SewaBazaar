from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView, UserViewSet, PasswordResetRequestView,
    PasswordResetConfirmView, LogoutView,
    TwoFAStatusView, TwoFAEnableView, TwoFAVerifyView, TwoFADisableView,
    SessionsView, SessionDetailView,
    OTPRequestView, OTPVerifyView, OTPResetPasswordView,
    ProviderDocumentViewSet, DocumentRequirementViewSet, DocumentVerificationHistoryViewSet,
    AdminDocumentViewSet, AdminDocumentRequirementViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'provider-documents', ProviderDocumentViewSet, basename='provider-documents')
router.register(r'document-requirements', DocumentRequirementViewSet, basename='document-requirements')
router.register(r'document-history', DocumentVerificationHistoryViewSet, basename='document-history')

# Admin-only endpoints
router.register(r'admin/documents', AdminDocumentViewSet, basename='admin-documents')
router.register(r'admin/document-requirements', AdminDocumentRequirementViewSet, basename='admin-document-requirements')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('reset-password/', PasswordResetRequestView.as_view(), name='password_reset'),
    path('reset-password/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    # OTP endpoints
    path('otp/request/', OTPRequestView.as_view(), name='otp_request'),
    path('otp/verify/', OTPVerifyView.as_view(), name='otp_verify'),
    path('otp/reset-password/', OTPResetPasswordView.as_view(), name='otp_reset_password'),
    # Security endpoints
    path('2fa/status/', TwoFAStatusView.as_view(), name='2fa_status'),
    path('2fa/enable/', TwoFAEnableView.as_view(), name='2fa_enable'),
    path('2fa/verify/', TwoFAVerifyView.as_view(), name='2fa_verify'),
    path('2fa/disable/', TwoFADisableView.as_view(), name='2fa_disable'),
    path('sessions/', SessionsView.as_view(), name='sessions'),
    path('sessions/<str:session_id>/', SessionDetailView.as_view(), name='session_detail'),
]
