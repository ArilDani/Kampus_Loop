import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from app.models import UserPengguna, UserAdmin, Produk, Pesanan, PengaturanToko

def seed():
    print("[*] Seeding database with KampusLoop data...")

    # 1. Platform Settings
    settings = PengaturanToko.get_settings()
    settings.nama_toko = "KampusLoop"
    settings.tagline = "Student Circular Marketplace"
    settings.email_support = "hello@kampusloop.id"
    settings.no_telp = "@kampusloop"
    settings.status_toko = "ONLINE"
    settings.banner_pengumuman = "Selamat datang di KampusLoop! Platform circular marketplace kampus."
    settings.save()

    # 2. Super Admin User
    admin_user, _ = User.objects.get_or_create(username="admin@kampusloop.id", defaults={
        'email': "admin@kampusloop.id",
        'first_name': "Super Admin",
        'last_name': "KampusLoop",
        'is_staff': True,
        'is_superuser': True,
    })
    admin_user.set_password("admin123")
    admin_user.is_staff = True
    admin_user.is_superuser = True
    admin_user.first_name = "Super Admin"
    admin_user.save()

    UserAdmin.objects.get_or_create(username=admin_user, defaults={
        'telp': '081299990000',
        'gender': 'Laki-laki',
    })
    admin_profile, _ = UserPengguna.objects.get_or_create(user=admin_user)
    admin_profile.role = 'admin'
    admin_profile.is_verified = True
    admin_profile.seller_status = 'approved'
    admin_profile.kampus = 'KampusLoop Central'
    admin_profile.save()

    # 3. User Admin / Penjual Demo (Seller Verified)
    user_seller, _ = User.objects.get_or_create(username="penjual@kampusloop.id", defaults={
        'email': "penjual@kampusloop.id",
        'first_name': "Rizky",
        'last_name': "Pratama",
    })
    user_seller.set_password("kampus123")
    user_seller.first_name = "Rizky"
    user_seller.save()
    seller_profile, _ = UserPengguna.objects.get_or_create(user=user_seller)
    seller_profile.role = 'penjual'
    seller_profile.seller_status = 'approved'
    seller_profile.kampus = "Universitas Negeri Makassar"
    seller_profile.nim = "200204502011"
    seller_profile.fakultas_prodi = "Teknik Elektronika"
    seller_profile.telp = "081234567890"
    seller_profile.alamat = "Jl. A.P. Pettarani, Makassar"
    seller_profile.is_verified = True
    seller_profile.save()

    # 4. User Reguler / Pembeli (Mahasiswa Biasa)
    user_buyer, _ = User.objects.get_or_create(username="mahasiswa@kampusloop.id", defaults={
        'email': "mahasiswa@kampusloop.id",
        'first_name': "Budi",
        'last_name': "Santoso",
    })
    user_buyer.set_password("kampus123")
    user_buyer.first_name = "Budi"
    user_buyer.save()
    buyer_profile, _ = UserPengguna.objects.get_or_create(user=user_buyer)
    buyer_profile.role = 'user'
    buyer_profile.seller_status = 'none'
    buyer_profile.kampus = "Universitas Hasanuddin"
    buyer_profile.nim = "D121201044"
    buyer_profile.fakultas_prodi = "Teknik Informatika"
    buyer_profile.telp = "081298765432"
    buyer_profile.alamat = "Tamalanrea, Makassar"
    buyer_profile.is_verified = False
    buyer_profile.save()

    # 5. User Pending Applicant Penjual (Mahasiswa yang mengajukan verifikasi berkas KTM)
    user_applicant, _ = User.objects.get_or_create(username="nadia@kampusloop.id", defaults={
        'email': "nadia@kampusloop.id",
        'first_name': "Nadia",
        'last_name': "Putri",
    })
    user_applicant.set_password("kampus123")
    user_applicant.first_name = "Nadia"
    user_applicant.save()
    applicant_profile, _ = UserPengguna.objects.get_or_create(user=user_applicant)
    applicant_profile.role = 'user'
    applicant_profile.seller_status = 'pending'
    applicant_profile.kampus = "Universitas Indonesia"
    applicant_profile.nim = "2106721994"
    applicant_profile.fakultas_prodi = "Ilmu Komputer"
    applicant_profile.telp = "081388776655"
    applicant_profile.alamat = "Kukusan, Depok"
    applicant_profile.ktm_url = "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80"
    applicant_profile.alasan_jual = "Ingin menjual laptop lama, buku diktat semester 1-4, dan perlengkapan kosan yang masih sangat layak."
    from django.utils import timezone
    applicant_profile.seller_applied_at = timezone.now()
    applicant_profile.save()

    user1 = user_seller
    user2 = user_applicant

    # 4. Products
    products_data = [
        {
            'nama': 'MacBook Air M1 2020',
            'kategori': 'Elektronik',
            'harga': 6850000,
            'harga_asli': 8500000,
            'kondisi': 'Good',
            'seller': user2,
            'lokasi': 'Depok',
            'status': 'approved',
            'foto_url': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=85',
            'deskripsi': 'Laptop untuk kebutuhan kuliah, desain ringan, dan produktivitas harian. Kondisi terawat, fungsi utama normal, charger termasuk.'
        },
        {
            'nama': 'Buku Dasar-Dasar Manajemen',
            'kategori': 'Buku & Akademik',
            'harga': 65000,
            'harga_asli': 110000,
            'kondisi': 'Like New',
            'seller': user1,
            'lokasi': 'Makassar',
            'status': 'approved',
            'foto_url': 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=85',
            'deskripsi': 'Buku referensi perkuliahan dengan halaman bersih dan sampul terawat. Cocok untuk mahasiswa bisnis dan manajemen.'
        },
        {
            'nama': 'Sony Wireless Headphones',
            'kategori': 'Elektronik',
            'harga': 725000,
            'harga_asli': 1100000,
            'kondisi': 'Good',
            'seller': user1,
            'lokasi': 'Makassar',
            'status': 'approved',
            'foto_url': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85',
            'deskripsi': 'Headphone wireless dengan suara jernih. Bantalan masih nyaman dan semua tombol berfungsi dengan baik.'
        },
        {
            'nama': 'Backpack Urban Daily',
            'kategori': 'Fashion',
            'harga': 185000,
            'harga_asli': 320000,
            'kondisi': 'Like New',
            'seller': user2,
            'lokasi': 'Bandung',
            'status': 'approved',
            'foto_url': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85',
            'deskripsi': 'Tas harian dengan kompartemen laptop dan ruang penyimpanan luas. Cocok untuk kuliah maupun aktivitas luar kampus.'
        },
        {
            'nama': 'Kalkulator Casio Scientific',
            'kategori': 'Buku & Akademik',
            'harga': 95000,
            'harga_asli': 155000,
            'kondisi': 'Good',
            'seller': user1,
            'lokasi': 'Yogyakarta',
            'status': 'approved',
            'foto_url': 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=900&q=85',
            'deskripsi': 'Kalkulator scientific untuk kebutuhan matematika, statistik, dan mata kuliah hitungan. Tombol responsif.'
        },
        {
            'nama': 'Kursi Kerja Minimalis',
            'kategori': 'Kos & Living',
            'harga': 275000,
            'harga_asli': 450000,
            'kondisi': 'Good',
            'seller': user2,
            'lokasi': 'Malang',
            'status': 'approved',
            'foto_url': 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=900&q=85',
            'deskripsi': 'Kursi kerja minimalis untuk ruang belajar atau kamar kos. Struktur kokoh dengan pemakaian wajar.'
        },
        {
            'nama': 'Jaket Varsity Campus',
            'kategori': 'Fashion',
            'harga': 125000,
            'harga_asli': 250000,
            'kondisi': 'Like New',
            'seller': user1,
            'lokasi': 'Makassar',
            'status': 'approved',
            'foto_url': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=85',
            'deskripsi': 'Jaket varsity dengan desain timeless. Kondisi sangat baik, cocok untuk aktivitas kampus sehari-hari.'
        },
        {
            'nama': 'Kamera Mirrorless Compact',
            'kategori': 'Hobi & Organisasi',
            'harga': 2950000,
            'harga_asli': 3900000,
            'kondisi': 'Good',
            'seller': user2,
            'lokasi': 'Semarang',
            'status': 'approved',
            'foto_url': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=85',
            'deskripsi': 'Kamera untuk dokumentasi kegiatan kampus dan fotografi. Kondisi fungsi normal, dapat dicek langsung saat COD.'
        },
        {
            'nama': 'Lampu Belajar Adjustable',
            'kategori': 'Kos & Living',
            'harga': 85000,
            'harga_asli': 145000,
            'kondisi': 'Like New',
            'seller': user1,
            'lokasi': 'Makassar',
            'status': 'approved',
            'foto_url': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85',
            'deskripsi': 'Lampu meja belajar dengan posisi adjustable dan pencahayaan nyaman untuk belajar malam.'
        },
        {
            'nama': 'Mechanical Keyboard 75%',
            'kategori': 'Elektronik',
            'harga': 390000,
            'harga_asli': 620000,
            'kondisi': 'Good',
            'seller': user2,
            'lokasi': 'Makassar',
            'status': 'approved',
            'foto_url': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=85',
            'deskripsi': 'Keyboard compact untuk produktivitas dan mengetik. Seluruh tombol berfungsi, dilengkapi kabel.'
        },
        {
            'nama': 'Sneakers Everyday',
            'kategori': 'Fashion',
            'harga': 210000,
            'harga_asli': 390000,
            'kondisi': 'Fair',
            'seller': user1,
            'lokasi': 'Surabaya',
            'status': 'approved',
            'foto_url': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85',
            'deskripsi': 'Sneakers untuk aktivitas harian. Ada tanda pemakaian pada bagian outsole, detail sesuai foto.'
        },
        {
            'nama': 'Drawing Tablet Entry Level',
            'kategori': 'Hobi & Organisasi',
            'harga': 440000,
            'harga_asli': 700000,
            'kondisi': 'Good',
            'seller': user2,
            'lokasi': 'Malang',
            'status': 'approved',
            'foto_url': 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=900&q=85',
            'deskripsi': 'Pen tablet untuk ilustrasi digital, desain, dan catatan visual. Stylus dan kabel termasuk.'
        },
        # Moderation pending products
        {
            'nama': 'Kalkulator Casio FX-991EX',
            'kategori': 'Buku & Akademik',
            'harga': 185000,
            'harga_asli': 250000,
            'kondisi': 'Good',
            'seller': user1,
            'lokasi': 'Makassar',
            'status': 'pending',
            'foto_url': 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=500',
            'deskripsi': 'Kalkulator scientific, fungsi normal dan lengkap.'
        },
        {
            'nama': 'Jaket Organisasi Fakultas',
            'kategori': 'Fashion',
            'harga': 90000,
            'harga_asli': 150000,
            'kondisi': 'Like New',
            'seller': user2,
            'lokasi': 'Makassar',
            'status': 'pending',
            'foto_url': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500',
            'deskripsi': 'Jaket organisasi dengan kondisi sangat baik.'
        },
    ]

    for p in products_data:
        Produk.objects.get_or_create(nama=p['nama'], defaults=p)

    # 5. Sample Orders
    first_p = Produk.objects.filter(nama='Buku Dasar-Dasar Manajemen').first()
    second_p = Produk.objects.filter(nama='Sony Wireless Headphones').first()

    if first_p:
        Pesanan.objects.get_or_create(order_number='KL-0241', defaults={
            'pembeli': user1,
            'produk': first_p,
            'harga_bayar': first_p.harga,
            'status': 'completed',
            'catatan': 'COD di perpustakaan pusat',
        })

    if second_p:
        Pesanan.objects.get_or_create(order_number='KL-0238', defaults={
            'pembeli': user1,
            'produk': second_p,
            'harga_bayar': second_p.harga,
            'status': 'cod_waiting',
            'catatan': 'COD depan fakultas teknik',
        })

    print("[OK] Database successfully seeded with KampusLoop data!")

if __name__ == '__main__':
    seed()
