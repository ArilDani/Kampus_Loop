from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
# pyrefly: ignore[missing-import]
from  .import views
from django.views.generic import RedirectView

urlpatterns = [
    path('admin/', admin.site.urls),
]

urlpatterns += [
    path('', RedirectView.as_view(url='login/', permanent=False)),
    path('app/', include(('app.urls', 'app'), namespace='app')),
    path('login/', views.loginView, name='login'),
    path('register/', views.registerView, name='register'),
    path('logout/', views.LogoutView, name='logout'),
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)