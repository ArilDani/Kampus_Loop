from django.urls import path
from . import views, views_admin, views_pengguna

urlpatterns = [
    # ADMIN
    path('profile/admin/', views_admin.profile_admin, name='profile_admin'),
    path('pengguna/', views_admin.daftar_pengguna, name='daftar_pengguna'),
    path('pengguna/hapus/<int:user_id>/', views_admin.hapus_pengguna, name='hapus_pengguna'),
    path('pengaturan/', views_admin.pengaturan_web, name='pengaturan_web'),

    # PENGGUNA
    path('profile/pengguna/', views_pengguna.profile_pengguna, name='profile_pengguna'),

    # UMUM
    path('dashboard/', views.index, name='dashboard'),
    path('', views.index, name='index'), 
]
