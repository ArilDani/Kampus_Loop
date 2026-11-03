from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from app.models import UserPengguna, UserAdmin


class Command(BaseCommand):
    help = 'Membuat akun Super Admin untuk Admin Web KampusLoop dan Django Admin'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, default='admin@kampusloop.id', help='Email Super Admin')
        parser.add_argument('--name', type=str, default='Super Admin', help='Nama Lengkap Super Admin')
        parser.add_argument('--password', type=str, default='admin123', help='Password Super Admin')

    def handle(self, *args, **options):
        email = options['email'].strip().lower()
        name = options['name'].strip()
        password = options['password']

        user, created = User.objects.get_or_create(username=email, defaults={
            'email': email,
            'first_name': name,
            'last_name': 'Super Admin',
            'is_staff': True,
            'is_superuser': True,
        })

        user.set_password(password)
        user.first_name = name
        user.email = email
        user.is_staff = True
        user.is_superuser = True
        user.save()

        UserAdmin.objects.get_or_create(username=user, defaults={'telp': '081299990000', 'gender': 'Laki-laki'})
        pengguna, _ = UserPengguna.objects.get_or_create(user=user)
        pengguna.role = 'admin'
        pengguna.seller_status = 'approved'
        pengguna.is_verified = True
        pengguna.kampus = 'KampusLoop Central'
        pengguna.save()

        action = "dibuat" if created else "diperbarui"
        self.stdout.write(self.style.SUCCESS(
            f"\n[OK] Akun Super Admin berhasil {action}!\n"
            f"   - Email    : {email}\n"
            f"   - Password : {password}\n"
            f"   - Role     : Web Admin + Django Super Admin (/admin/)\n"
        ))
