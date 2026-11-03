from django.contrib import admin
from .models import UserPengguna, UserAdmin, Produk, Wishlist, Pesanan, PesanKontak, PengaturanToko

@admin.register(Produk)
class ProdukAdmin(admin.ModelAdmin):
    list_display = ('nama', 'seller', 'kategori', 'harga', 'kondisi', 'status', 'tanggal_dibuat')
    list_filter = ('kategori', 'kondisi', 'status')
    search_fields = ('nama', 'deskripsi', 'seller__first_name', 'seller__username')

@admin.register(Pesanan)
class PesananAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'produk', 'pembeli', 'harga_bayar', 'status', 'tanggal_pesan')
    list_filter = ('status',)
    search_fields = ('order_number', 'produk__nama', 'pembeli__first_name')

@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ('user', 'produk', 'tanggal_ditambah')

@admin.register(PesanKontak)
class PesanKontakAdmin(admin.ModelAdmin):
    list_display = ('nama', 'email', 'topik', 'tanggal', 'sudah_dibaca')
    list_filter = ('sudah_dibaca',)

@admin.register(UserPengguna)
class UserPenggunaAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'seller_status', 'kampus', 'nim', 'telp', 'is_verified')
    list_filter = ('role', 'seller_status', 'is_verified')
    search_fields = ('user__first_name', 'user__email', 'user__username', 'kampus', 'nim')
    actions = ['approve_as_seller', 'revoke_seller']

    @admin.action(description='Setujui sebagai Penjual (User Admin)')
    def approve_as_seller(self, request, queryset):
        from django.utils import timezone
        queryset.update(role='penjual', seller_status='approved', is_verified=True, seller_verified_at=timezone.now())

    @admin.action(description='Kembalikan ke User Biasa')
    def revoke_seller(self, request, queryset):
        queryset.update(role='user', seller_status='none')

@admin.register(UserAdmin)
class UserAdminAdmin(admin.ModelAdmin):
    list_display = ('username', 'telp', 'gender')

@admin.register(PengaturanToko)
class PengaturanTokoAdmin(admin.ModelAdmin):
    list_display = ('nama_toko', 'tagline', 'status_toko', 'email_support')