from django.db import models
from django.contrib.auth.models import User
import uuid
from django.utils import timezone
import os
from django.conf import settings

User.add_to_class("__str__", lambda self: f"{self.username} - {self.first_name}")

# ─── PROFILE MODELS ──────────────────────────────────────────────────────────

def rename_photo_anggota(instance, filename):
    ext = filename.split('.')[-1]
    username = instance.user.username
    timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
    new_filename = f"{username}_{timestamp}.{ext}"
    return os.path.join('img_profile/anggota/', new_filename)

ROLE_CHOICES = [
    ('user', 'Mahasiswa (Pembeli)'),
    ('penjual', 'User Admin (Penjual)'),
    ('admin', 'Super Admin'),
]

SELLER_STATUS_CHOICES = [
    ('none', 'Bukan Penjual'),
    ('pending', 'Menunggu Verifikasi'),
    ('approved', 'Terverifikasi (Penjual)'),
    ('rejected', 'Ditolak'),
]

class UserPengguna(models.Model):
    """Profile mahasiswa/pengguna marketplace"""
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, related_name="anggota")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user', verbose_name='Peran Akun')
    kampus = models.CharField(max_length=150, null=True, blank=True, verbose_name='Universitas/Kampus')
    nim = models.CharField(max_length=50, null=True, blank=True, verbose_name='NIM / No. Mahasiswa')
    fakultas_prodi = models.CharField(max_length=150, null=True, blank=True, verbose_name='Fakultas / Prodi')
    telp = models.CharField(max_length=15, blank=True, default='', verbose_name='No WhatsApp/Telp')
    gender = models.CharField(max_length=15, null=True, blank=True, choices=[
        ('Laki-laki', 'Laki-laki'),
        ('Perempuan', 'Perempuan'),
    ])
    alamat = models.CharField(max_length=200, null=True, blank=True)
    photo = models.ImageField(upload_to=rename_photo_anggota, null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    # Verifikasi Berkas Penjual (Mahasiswa Aktif)
    seller_status = models.CharField(max_length=20, choices=SELLER_STATUS_CHOICES, default='none', verbose_name='Status Penjual')
    ktm_foto = models.ImageField(upload_to='berkas_ktm/', null=True, blank=True, verbose_name='Foto KTM / Mahasiswa Aktif')
    ktm_url = models.URLField(max_length=500, null=True, blank=True, verbose_name='URL Berkas KTM')
    alasan_jual = models.TextField(null=True, blank=True, verbose_name='Rencana Penjualan')
    seller_applied_at = models.DateTimeField(null=True, blank=True, verbose_name='Waktu Pengajuan Penjual')
    seller_verified_at = models.DateTimeField(null=True, blank=True, verbose_name='Waktu Verifikasi')
    seller_reject_reason = models.TextField(null=True, blank=True, verbose_name='Alasan Penolakan')

    class Meta:
        verbose_name = 'Pengguna'
        verbose_name_plural = 'Pengguna'

    def __str__(self):
        return f"{self.user.first_name} ({self.user.email}) - {self.role}"

    @property
    def is_seller(self):
        return self.role == 'penjual' or self.seller_status == 'approved' or self.user.is_staff or self.user.is_superuser

    @property
    def ktm_display(self):
        if self.ktm_foto:
            return self.ktm_foto.url
        return self.ktm_url or ''

    def save(self, *args, **kwargs):
        try:
            old_instance = UserPengguna.objects.get(pk=self.pk)
            if old_instance.photo and old_instance.photo != self.photo:
                old_photo_path = os.path.join(settings.MEDIA_ROOT, old_instance.photo.name)
                if os.path.isfile(old_photo_path):
                    os.remove(old_photo_path)
        except UserPengguna.DoesNotExist:
            pass
        super().save(*args, **kwargs)


def rename_photo_admin(instance, filename):
    ext = filename.split('.')[-1]
    username = instance.username
    timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
    new_filename = f"{username}_{timestamp}.{ext}"
    return os.path.join('img_profile/admin/', new_filename)


class UserAdmin(models.Model):
    """Profile administrator platform"""
    username = models.OneToOneField(User, on_delete=models.CASCADE, to_field="username", primary_key=True)
    telp = models.CharField(max_length=15, blank=True, default='')
    gender = models.CharField(max_length=15, blank=True, choices=[
        ('Laki-laki', 'Laki-laki'),
        ('Perempuan', 'Perempuan'),
    ])
    photo = models.ImageField(upload_to=rename_photo_admin, null=True, blank=True)

    def save(self, *args, **kwargs):
        try:
            old_instance = UserAdmin.objects.get(pk=self.pk)
            if old_instance.photo and old_instance.photo != self.photo:
                old_photo_path = os.path.join(settings.MEDIA_ROOT, old_instance.photo.name)
                if os.path.isfile(old_photo_path):
                    os.remove(old_photo_path)
        except UserAdmin.DoesNotExist:
            pass
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username}"


# ─── MARKETPLACE MODELS ───────────────────────────────────────────────────────

CATEGORY_CHOICES = [
    ('Buku & Akademik', 'Buku & Akademik'),
    ('Elektronik', 'Elektronik'),
    ('Fashion', 'Fashion'),
    ('Kos & Living', 'Kos & Living'),
    ('Hobi & Organisasi', 'Hobi & Organisasi'),
    ('Lainnya', 'Lainnya'),
]

CONDITION_CHOICES = [
    ('Like New', 'Like New'),
    ('Good', 'Good'),
    ('Fair', 'Fair'),
]

STATUS_PRODUK_CHOICES = [
    ('pending', 'Menunggu Review'),
    ('approved', 'Disetujui'),
    ('rejected', 'Ditolak'),
    ('sold', 'Terjual'),
]


class Produk(models.Model):
    """Produk preloved yang dijual mahasiswa"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='produk_dijual')
    nama = models.CharField(max_length=200, verbose_name='Nama Produk')
    kategori = models.CharField(max_length=50, choices=CATEGORY_CHOICES, verbose_name='Kategori')
    kondisi = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='Good', verbose_name='Kondisi')
    harga = models.PositiveIntegerField(verbose_name='Harga (Rp)')
    harga_asli = models.PositiveIntegerField(null=True, blank=True, verbose_name='Harga Asli (Rp)')
    deskripsi = models.TextField(verbose_name='Deskripsi')
    foto_url = models.URLField(max_length=500, null=True, blank=True, verbose_name='URL Foto')
    foto = models.ImageField(upload_to='produk/', null=True, blank=True, verbose_name='Foto Produk')
    lokasi = models.CharField(max_length=100, null=True, blank=True, verbose_name='Lokasi/Kampus')
    status = models.CharField(max_length=20, choices=STATUS_PRODUK_CHOICES, default='pending', verbose_name='Status')
    tanggal_dibuat = models.DateTimeField(auto_now_add=True)
    tanggal_diperbarui = models.DateTimeField(auto_now=True)
    dilihat = models.PositiveIntegerField(default=0, verbose_name='Jumlah Dilihat')

    class Meta:
        verbose_name = 'Produk'
        verbose_name_plural = 'Produk'
        ordering = ['-tanggal_dibuat']

    def __str__(self):
        return f"{self.nama} - Rp{self.harga:,}"

    @property
    def foto_display(self):
        """Mengembalikan URL foto (prioritas: foto upload, lalu foto_url)"""
        if self.foto:
            return self.foto.url
        return self.foto_url or ''


class Wishlist(models.Model):
    """Produk yang disimpan/wishlist oleh pengguna"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wishlist')
    produk = models.ForeignKey(Produk, on_delete=models.CASCADE, related_name='di_wishlist')
    tanggal_ditambah = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'produk')
        verbose_name = 'Wishlist'
        verbose_name_plural = 'Wishlist'

    def __str__(self):
        return f"{self.user.first_name} ♡ {self.produk.nama}"


STATUS_PESANAN_CHOICES = [
    ('pending', 'Menunggu Konfirmasi'),
    ('confirmed', 'Dikonfirmasi'),
    ('cod_waiting', 'Menunggu COD'),
    ('completed', 'Selesai'),
    ('cancelled', 'Dibatalkan'),
]


class Pesanan(models.Model):
    """Transaksi/pesanan antara pembeli dan penjual"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_number = models.CharField(max_length=20, unique=True, verbose_name='Nomor Pesanan')
    pembeli = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='pesanan_dibeli')
    produk = models.ForeignKey(Produk, on_delete=models.SET_NULL, null=True, related_name='pesanan')
    harga_bayar = models.PositiveIntegerField(verbose_name='Harga Bayar (Rp)')
    status = models.CharField(max_length=20, choices=STATUS_PESANAN_CHOICES, default='pending', verbose_name='Status')
    catatan = models.TextField(null=True, blank=True, verbose_name='Catatan Pembeli')
    tanggal_pesan = models.DateTimeField(auto_now_add=True)
    tanggal_selesai = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Pesanan'
        verbose_name_plural = 'Pesanan'
        ordering = ['-tanggal_pesan']

    def __str__(self):
        return f"#{self.order_number} - {self.produk}"

    def save(self, *args, **kwargs):
        if not self.order_number:
            import random
            import string
            self.order_number = 'KL-' + ''.join(random.choices(string.digits, k=4))
        super().save(*args, **kwargs)


class PesanKontak(models.Model):
    """Pesan dari halaman contact"""
    nama = models.CharField(max_length=100)
    email = models.EmailField()
    topik = models.CharField(max_length=100)
    pesan = models.TextField()
    tanggal = models.DateTimeField(auto_now_add=True)
    sudah_dibaca = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Pesan Kontak'
        verbose_name_plural = 'Pesan Kontak'
        ordering = ['-tanggal']

    def __str__(self):
        return f"{self.nama} - {self.topik}"


class PengaturanToko(models.Model):
    """Pengaturan platform KampusLoop"""
    nama_toko = models.CharField(max_length=150, default="KampusLoop", verbose_name="Nama Platform")
    tagline = models.CharField(max_length=255, default="Student Circular Marketplace", verbose_name="Tagline")
    email_support = models.EmailField(default="hello@kampusloop.id", verbose_name="Email Support")
    no_telp = models.CharField(max_length=30, default="@kampusloop", verbose_name="Social Media")
    alamat = models.TextField(default="Campus-based marketplace", verbose_name="Alamat/Deskripsi")
    status_toko = models.CharField(max_length=20, default="ONLINE", choices=[
        ('ONLINE', 'ONLINE'),
        ('OFFLINE', 'OFFLINE'),
    ], verbose_name="Status")
    banner_pengumuman = models.TextField(default="Selamat datang di KampusLoop!", blank=True, verbose_name="Banner Pengumuman")

    class Meta:
        verbose_name = "Pengaturan Platform"
        verbose_name_plural = "Pengaturan Platform"

    def __str__(self):
        return self.nama_toko

    @classmethod
    def get_settings(cls):
        obj, _ = cls.objects.get_or_create(id=1, defaults={
            'nama_toko': 'KampusLoop',
            'tagline': 'Student Circular Marketplace',
        })
        return obj


from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if instance.is_superuser:
        UserAdmin.objects.get_or_create(username=instance)
        pengguna, _ = UserPengguna.objects.get_or_create(user=instance)
        pengguna.role = 'admin'
        pengguna.is_verified = True
        pengguna.seller_status = 'approved'
        pengguna.save()
    elif created:
        UserPengguna.objects.get_or_create(user=instance)