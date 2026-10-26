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
            messages.success(request, 'Selamat Datang!')
            return redirect('app:dashboard')

        messages.warning(request, 'Email atau password salah.')
        return redirect('login')

    return render(request, 'login.html', {
        'title': 'Login',
        'heading': 'Login',
    })

def registerView(request):
    if request.user.is_authenticated:
        return redirect('app:index')

    if request.method == 'POST':
        name = request.POST.get('first_name', '').strip()
        email = request.POST.get('email', '').strip().lower()
        password = request.POST.get('password', '')
        confirm = request.POST.get('confirm_password', '')

        # Validasi 1 Email hanya untuk 1 akun
        if confirm != password:
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
            # Hubungkan langsung ke tabel UserPengguna
            UserPengguna.objects.create(
                user=new_user,
                telp='',
                link_sinta=''
            )
            messages.success(request, 'Registrasi berhasil! Silakan login dengan akun Anda.')
            return redirect('login')

    return render(request, 'register.html', {
        'title': 'Register - Thesis Edu',
        'heading': 'Pendaftaran Akun',
    })

@login_required
def LogoutView(request):
    logout(request)
    messages.success(request, 'Anda telah berhasil logout!')
    return redirect('login')  