from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.forms import PasswordChangeForm
from django.utils import timezone
from .models import UserAdmin, UserPengguna, Produk, PengaturanToko


@login_required
def index(request):
    today = timezone.localdate()
    
    # 1. Pengecekan Admin / Superuser
    if request.user.is_superuser or request.user.last_name == 'Super Admin':
        settings = PengaturanToko.get_settings()

        # Handle quick actions directly from Dashboard (saves to database)
        if request.method == 'POST':
            action = request.POST.get('action')
            if action == 'toggle_status':
                settings.status_toko = 'OFFLINE' if settings.status_toko == 'ONLINE' else 'ONLINE'
                settings.save()
                messages.success(request, f'Status operasional toko berhasil diubah menjadi {settings.status_toko} dan tersimpan di database!')
                return redirect('app:dashboard')
            elif action == 'update_banner':
                banner_text = request.POST.get('banner_pengumuman', '').strip()
                if banner_text:
                    settings.banner_pengumuman = banner_text
                    settings.save()
                    messages.success(request, 'Pengumuman dashboard berhasil diperbarui dan tersimpan di database!')
                return redirect('app:dashboard')

        userC = UserAdmin.objects.filter(username=request.user).first()
        total_pengguna = UserPengguna.objects.count()
        total_produk = Produk.objects.count()
        recent_users = User.objects.filter(last_name='Pengguna').select_related('anggota').order_by('-date_joined')[:5]

        context = {
            'title': 'Dashboard Admin - KampusLoop',
            'heading': 'Dashboard Admin Marketplace',
            'photo': userC.photo if userC and userC.photo else None,
            'userdetail': userC if userC else None,
            'total_pengguna': total_pengguna,
            'total_provinsi': total_produk,
            'recent_users': recent_users,
            'settings': settings,
            'today': today,
        }
        return render(request, 'admin_super/index.html', context)

    # 2. Pengguna / Customer E-Commerce
    else:
        userC = UserPengguna.objects.filter(user=request.user).first()
        if not userC:
            userC = UserPengguna.objects.create(user=request.user, telp='', alamat='')

        is_complete = bool(userC.telp and userC.alamat)

        context = {
            'title': 'Profil Saya - KampusLoop',
            'heading': 'Profile User KampusLoop',
            'photo': userC.photo if userC and userC.photo else None,
            'userdetail': userC,
            'is_complete': is_complete,
            'today': today,
        }
        return render(request, 'pengguna/index.html', context)
