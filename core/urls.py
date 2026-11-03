from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),

    # API endpoints for React frontend
    path('api/', include(('app.api_urls', 'api'), namespace='api')),

    # Django session auth endpoint for CSRF
    path('api/auth/', include('rest_framework.urls')),

    # Legacy Django template views (kept for backward compat)
    path('app/', include(('app.urls', 'app'), namespace='app')),
]

# Serve frontend (React) for all non-API routes in production
# In development, Vite serves the frontend separately

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)