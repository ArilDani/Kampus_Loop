from django.db import models
from django.contrib.auth.models import User
import uuid
from django.utils import timezone
import os
from django.conf import settings

User.add_to_class("__str__", lambda self: f"{self.username} - {self.first_name}")

class Provinsi(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nama_provinsi = models.CharField(max_length=100, unique=True, verbose_name='Nama Provinsi')
    aktif = models.BooleanField(default=True, verbose_name='Aktif')

    class Meta:
        verbose_name = 'Provinsi'
        verbose_name_plural = 'Provinsi'
        ordering = ['nama_provinsi']

    def __str__(self):
        return f"{self.nama_provinsi}"

def rename_photo_anggota(instance, filename):
    ext = filename.split('.')[-1]
    username = instance.user.username
    timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
    new_filename = f"{username}_{timestamp}.{ext}"
    return os.path.join('img_profile/anggota/', new_filename)

class UserPengguna(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)    
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, related_name="anggota")
    telp = models.CharField(max_length=15)
    gender = models.CharField(max_length=15, null=True, blank=True, choices=[
        ('Laki-laki', 'Laki-laki'),
        ('Perempuan', 'Perempuan'),
    ]) 
    alamat = models.CharField(max_length=50, null=True, blank=True)
    photo = models.ImageField(upload_to=rename_photo_anggota, null=True, blank=True)
    provinsi_anggota = models.ForeignKey(Provinsi, on_delete=models.SET_NULL, null=True, blank=True)
    jafung = models.CharField(max_length=100, null=True, blank=True)
    nuptk = models.CharField(max_length=20, null=True, blank=True, verbose_name='NUPTK')
    bidang_keahlian = models.CharField(max_length=100, null=True, blank=True)
    link_sinta = models.URLField(max_length=200, verbose_name='Link Sinta')
    link_scopus = models.URLField(max_length=200, null=True, blank=True, verbose_name='Link Scopus')
    link_google_scholar = models.URLField(max_length=200, null=True, blank=True, verbose_name='Link Google Scholar')
    link_orcid = models.URLField(max_length=200, null=True, blank=True, verbose_name='Link ORCID')


    class Meta:
        verbose_name = 'Anggota'
        verbose_name_plural = 'Anggota'

    def save(self, *args, **kwargs):
        try:
            old_instance = UserPengguna.objects.get(pk=self.pk)
            if old_instance.photo and old_instance.photo != self.photo:
                old_photo_path = os.path.join(
                    settings.MEDIA_ROOT,
                    old_instance.photo.name
                )
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


class PengaturanToko(models.Model):
    nama_toko = models.CharField(max_length=150, default="ModuLab Official Store", verbose_name="Nama Toko")
    tagline = models.CharField(max_length=255, default="Platform Belanja E-Commerce Terpercaya & Terlengkap", verbose_name="Tagline")
    email_support = models.EmailField(default="cs@modulab.id", verbose_name="Email Support")
    no_telp = models.CharField(max_length=30, default="+62 812-3456-7890", verbose_name="WhatsApp Hotline")
    alamat_gudang = models.TextField(default="Kawasan Industri Terpadu, Jakarta, Indonesia", verbose_name="Alamat Gudang")
    status_toko = models.CharField(max_length=20, default="ONLINE", choices=[
        ('ONLINE', 'ONLINE (Buka / Menerima Pesanan)'),
        ('OFFLINE', 'OFFLINE (Tutup Sementara)'),
    ], verbose_name="Status Toko")
    jam_layanan = models.CharField(max_length=100, default="08:00 - 21:00 WIB", verbose_name="Jam Layanan")
    banner_pengumuman = models.TextField(default="Kelola data seluruh akun pelanggan, wilayah cakupan pengiriman provinsi, serta konfigurasi toko online ModuLab dengan mudah dan terstruktur.", blank=True, verbose_name="Pengumuman Dashboard")

    class Meta:
        verbose_name = "Pengaturan Toko"
        verbose_name_plural = "Pengaturan Toko"

    def __str__(self):
        return self.nama_toko

    @classmethod
    def get_settings(cls):
        obj, _ = cls.objects.get_or_create(
            id=1,
            defaults={
                'nama_toko': 'ModuLab Official Store',
                'tagline': 'Platform Belanja E-Commerce Terpercaya & Terlengkap',
                'email_support': 'cs@modulab.id',
                'no_telp': '+62 812-3456-7890',
                'alamat_gudang': 'Kawasan Industri Terpadu, Jakarta, Indonesia',
                'status_toko': 'ONLINE',
                'jam_layanan': '08:00 - 21:00 WIB',
                'banner_pengumuman': 'Kelola data seluruh akun pelanggan, wilayah cakupan pengiriman provinsi, serta konfigurasi toko online ModuLab dengan mudah dan terstruktur.',
            }
        )
        return obj