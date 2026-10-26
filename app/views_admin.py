from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.models import User
from app.models import UserAdmin, UserPengguna
from .form_admin import formProfile
from app.decorators_admin import admin_required

@admin_required
def profile_admin(request):
    try:
        useradmin = UserAdmin.objects.get(username=request.user)
    except UserAdmin.DoesNotExist:
        useradmin = UserAdmin(username=request.user)

    if request.method == 'POST':
        form = formProfile(request.POST, request.FILES, instance=useradmin)
        if form.is_valid():
            form.save()
            messages.success(request, 'Profil Anda berhasil diperbarui!')
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
    pengguna_list = User.objects.filter(last_name='Pengguna').order_by('-date_joined')
    return render(request, 'admin_super/daftar_pengguna.html', {
        'title': 'Daftar Pengguna',
        'heading': 'Daftar Pengguna',
        'pengguna_list': pengguna_list
    })

@admin_required
def hapus_pengguna(request, user_id):
    # Fitur CRUD Delete pengguna
    user_target = get_object_or_404(User, id=user_id, last_name='Pengguna')
    user_target.delete()
    messages.success(request, 'Pengguna berhasil dihapus.')
    return redirect('app:daftar_pengguna')

@admin_required
def pengaturan_web(request):
    return render(request, 'admin_super/pengaturan_web.html', {
        'title': 'Pengaturan Web',
        'heading': 'Pengaturan Web'
    })
