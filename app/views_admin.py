from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.models import User
from app.models import UserAdmin, UserPengguna, PengaturanToko
from .form_admin import formProfile
from app.decorators_admin import admin_required

@admin_required
def profile_admin(request):
    try:
        useradmin = UserAdmin.objects.get(username=request.user)
    except UserAdmin.DoesNotExist:
        useradmin = UserAdmin(username=request.user)

    if request.method == 'POST':
        # Perbarui nama dan email admin di User model (tersimpan ke database)
        nama = request.POST.get('nama', '').strip()
        email = request.POST.get('email', '').strip()
        if nama:
            request.user.first_name = nama
        if email:
            request.user.email = email
        request.user.save()

        form = formProfile(request.POST, request.FILES, instance=useradmin)
        if form.is_valid():
            form.save()
            messages.success(request, 'Profil Admin berhasil diperbarui dan tersimpan di database!')
            return redirect('app:profile_admin')
        else:
            messages.error(request, 'Gagal memperbarui profil. Periksa isian form.')
    else:
        form = formProfile(instance=useradmin)

    context = {
        'title': 'Profile Admin',
        'heading': 'Edit Profile Admin',
        'useradmin': useradmin,
        'photo': useradmin.photo if getattr(useradmin, 'photo', None) else None,
        'form': form,
    }
    return render(request, 'admin_super/profile_admin.html', context)

@admin_required
def daftar_pengguna(request):
    # Mengambil seluruh pengguna terdaftar dengan role Pengguna (CRUD Read)
    pengguna_list = User.objects.filter(last_name='Pengguna').select_related('anggota', 'anggota__provinsi_anggota').order_by('-date_joined')
    total_customers = pengguna_list.count()
    return render(request, 'admin_super/daftar_pengguna.html', {
        'title': 'Manajemen Pengguna - ModuLab',
        'heading': 'Manajemen Pengguna E-Commerce',
        'pengguna_list': pengguna_list,
        'total_customers': total_customers,
    })

@admin_required
def hapus_pengguna(request, user_id):
    # Fitur CRUD Delete pengguna
    user_target = get_object_or_404(User, id=user_id, last_name='Pengguna')
    nama = user_target.first_name or user_target.username
    user_target.delete()
    messages.success(request, f'Pelanggan {nama} ({user_target.email}) berhasil dihapus dari sistem.')
    return redirect('app:daftar_pengguna')

@admin_required
def pengaturan_web(request):
    settings = PengaturanToko.get_settings()
    if request.method == 'POST':
        settings.nama_toko = request.POST.get('nama_toko', settings.nama_toko).strip()
        settings.tagline = request.POST.get('tagline', settings.tagline).strip()
        settings.email_support = request.POST.get('email_support', settings.email_support).strip()
        settings.no_telp = request.POST.get('no_telp', settings.no_telp).strip()
        settings.alamat_gudang = request.POST.get('alamat_gudang', settings.alamat_gudang).strip()
        settings.status_toko = request.POST.get('status_toko', settings.status_toko)
        settings.jam_layanan = request.POST.get('jam_layanan', settings.jam_layanan).strip()
        settings.banner_pengumuman = request.POST.get('banner_pengumuman', settings.banner_pengumuman).strip()
        settings.save()
        messages.success(request, 'Pengaturan toko ModuLab E-Commerce berhasil diperbarui dan tersimpan di database!')
        return redirect('app:pengaturan_web')

    return render(request, 'admin_super/pengaturan_web.html', {
        'title': 'Pengaturan Web - ModuLab',
        'heading': 'Pengaturan Toko E-Commerce',
        'settings': settings,
    })
