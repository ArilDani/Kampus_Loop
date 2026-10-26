from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from app.models import UserAdmin, UserPengguna



def loginView(request):
    if request.user.is_authenticated:
        return redirect('app:index')

    if request.method == 'POST':
        email = request.POST['email'].strip()
        password = request.POST['password']

        user = User.objects.filter(email=email).first()
        user = authenticate(request, username=user.username, password=password) if user else None

        if user:
            login(request, user)
            messages.success(request, f'Selamat datang kembali, {user.first_name}!')
            return redirect('app:dashboard')

        messages.warning(request, 'Email atau password salah. Silakan coba lagi.')
        return redirect('login')

    return render(request, 'login.html', {
        'title': 'Masuk - ModuLab E-Commerce',
        'heading': 'Masuk ke Akun ModuLab',
    })

def registerView(request):
    if request.user.is_authenticated:
        return redirect('app:index')

    if request.method == 'POST':
        name = request.POST.get('first_name', '').strip()
        email = request.POST.get('email', '').strip().lower()
        password = request.POST.get('password', '')
        confirm = request.POST.get('confirm_password', '')

        if not name or not email or not password:
            messages.warning(request, 'Mohon lengkapi semua kolom pendaftaran.')
        elif confirm != password:
            messages.warning(request, 'Password dan konfirmasi password tidak cocok.')
        elif User.objects.filter(email=email).exists() or User.objects.filter(username=email).exists():
            messages.warning(request, 'Email ini sudah terdaftar! Gunakan email lain.')
        else:
            new_user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=name,
                last_name='Pengguna',
            )
            # Otomatis buat profil UserPengguna terhubung
            UserPengguna.objects.create(
                user=new_user,
                telp='',
                alamat='',
                link_sinta=''
            )
            messages.success(request, 'Akun ModuLab berhasil dibuat! Silakan masuk.')
            return redirect('login')

    return render(request, 'register.html', {
        'title': 'Daftar Akun - ModuLab E-Commerce',
        'heading': 'Buat Akun ModuLab',
    })

@login_required
def LogoutView(request):
    logout(request)
    messages.success(request, 'Anda telah berhasil logout!')
    return redirect('login')  