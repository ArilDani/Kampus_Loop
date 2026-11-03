from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db.models import Sum, Q, Count
from django.utils import timezone
from .models import UserPengguna, UserAdmin, Produk, Wishlist, Pesanan, PesanKontak, PengaturanToko
from .serializers import (
    ProdukSerializer, ProdukCreateSerializer, ProdukUpdateSerializer,
    WishlistSerializer, PesananSerializer, PesanKontakSerializer,
    RegisterSerializer, UserPenggunaSerializer, PengaturanTokoSerializer,
    UserSerializer
)


# ─── HELPERS ─────────────────────────────────────────────────────────────────

def is_admin(user):
    if not user.is_authenticated:
        return False
    if user.is_superuser or user.is_staff:
        return True
    if hasattr(user, 'anggota') and user.anggota.role == 'admin':
        return True
    return False

def is_seller(user):
    if not user.is_authenticated:
        return False
    if is_admin(user):
        return True
    if hasattr(user, 'anggota'):
        return user.anggota.is_seller
    return False

def get_user_role(user):
    if not user.is_authenticated:
        return 'guest'
    if is_admin(user):
        return 'admin'
    if hasattr(user, 'anggota') and user.anggota.is_seller:
        return 'penjual'
    return 'user'

def get_user_profile_dict(user):
    role = get_user_role(user)
    pengguna = getattr(user, 'anggota', None)
    if not pengguna:
        pengguna, _ = UserPengguna.objects.get_or_create(user=user)

    return {
        'id': user.id,
        'username': user.username,
        'name': user.first_name or user.username,
        'nama': user.first_name or user.username,
        'email': user.email,
        'role': role,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'is_seller': pengguna.is_seller or user.is_superuser,
        'seller_status': pengguna.seller_status,
        'kampus': pengguna.kampus or '',
        'nim': pengguna.nim or '',
        'fakultas_prodi': pengguna.fakultas_prodi or '',
        'telp': pengguna.telp or '',
        'alamat': pengguna.alamat or '',
        'bio': pengguna.bio or '',
        'is_verified': pengguna.is_verified,
        'ktm_url': pengguna.ktm_url or '',
        'ktm_display': pengguna.ktm_display,
        'alasan_jual': pengguna.alasan_jual or '',
        'seller_applied_at': pengguna.seller_applied_at,
        'seller_reject_reason': pengguna.seller_reject_reason or '',
    }


# ─── AUTH VIEWS ───────────────────────────────────────────────────────────────

class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')

        if not email or not password:
            return Response({'error': 'Email dan password wajib diisi.'}, status=400)

        user_obj = User.objects.filter(Q(email__iexact=email) | Q(username__iexact=email)).first()
        if not user_obj:
            return Response({'error': 'Email atau password salah.'}, status=401)

        user = authenticate(request, username=user_obj.username, password=password)
        if not user:
            return Response({'error': 'Email atau password salah.'}, status=401)

        login(request, user)
        profile_data = get_user_profile_dict(user)

        return Response({
            'message': f'Selamat datang, {user.first_name or user.username}!',
            'user': profile_data
        })


class RegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            login(request, user)
            profile_data = get_user_profile_dict(user)
            return Response({
                'message': 'Akun berhasil dibuat!',
                'user': profile_data
            }, status=201)
        return Response({'error': serializer.errors}, status=400)


class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({'message': 'Berhasil logout.'})


class MeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(get_user_profile_dict(request.user))


# ─── PRODUK VIEWS ─────────────────────────────────────────────────────────────

class ProdukListAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Produk.objects.filter(status='approved').select_related('seller', 'seller__anggota')

        # Filters
        q = request.GET.get('q', '')
        kategori = request.GET.get('kategori', '')
        kondisi = request.GET.getlist('kondisi', [])
        harga = request.GET.get('harga', 'all')
        sort = request.GET.get('sort', 'featured')

        if q:
            qs = qs.filter(Q(nama__icontains=q) | Q(deskripsi__icontains=q) | Q(kategori__icontains=q) | Q(lokasi__icontains=q))
        if kategori and kategori != 'Semua':
            qs = qs.filter(kategori=kategori)
        if kondisi:
            qs = qs.filter(kondisi__in=kondisi)
        if harga == 'under100':
            qs = qs.filter(harga__lt=100000)
        elif harga == '100to500':
            qs = qs.filter(harga__gte=100000, harga__lte=500000)
        elif harga == 'over500':
            qs = qs.filter(harga__gt=500000)

        if sort == 'low':
            qs = qs.order_by('harga')
        elif sort == 'high':
            qs = qs.order_by('-harga')
        elif sort == 'new':
            qs = qs.order_by('-tanggal_dibuat')
        else:
            qs = qs.order_by('-tanggal_dibuat')

        serializer = ProdukSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)


class ProdukFeaturedAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Produk.objects.filter(status='approved').select_related('seller', 'seller__anggota').order_by('-tanggal_dibuat')[:8]
        serializer = ProdukSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)


class ProdukDetailAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            produk = Produk.objects.select_related('seller', 'seller__anggota').get(id=pk)
            # Increment view count
            produk.dilihat += 1
            produk.save(update_fields=['dilihat'])
            serializer = ProdukSerializer(produk, context={'request': request})
            return Response(serializer.data)
        except Produk.DoesNotExist:
            return Response({'error': 'Produk tidak ditemukan.'}, status=404)


class ProdukCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ProdukCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            produk = serializer.save()
            return Response(
                ProdukSerializer(produk, context={'request': request}).data,
                status=201
            )
        return Response({'error': serializer.errors}, status=400)


class ProdukUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        return self.put(request, pk)

    def put(self, request, pk):
        try:
            if is_admin(request.user):
                produk = Produk.objects.get(id=pk)
            else:
                produk = Produk.objects.get(id=pk, seller=request.user)
        except Produk.DoesNotExist:
            return Response({'error': 'Produk tidak ditemukan atau kamu tidak memiliki hak akses.'}, status=404)

        serializer = ProdukUpdateSerializer(produk, data=request.data, partial=True)
        if serializer.is_valid():
            updated_produk = serializer.save()
            return Response(ProdukSerializer(updated_produk, context={'request': request}).data)
        return Response({'error': serializer.errors}, status=400)

    def post(self, request, pk):
        # Allow POST with form-data as well
        return self.put(request, pk)


class ProdukDeleteAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            if is_admin(request.user):
                produk = Produk.objects.get(id=pk)
            else:
                produk = Produk.objects.get(id=pk, seller=request.user)
            nama = produk.nama
            produk.delete()
            return Response({'message': f'Produk "{nama}" berhasil dihapus.'})
        except Produk.DoesNotExist:
            return Response({'error': 'Produk tidak ditemukan.'}, status=404)


# ─── WISHLIST VIEWS ───────────────────────────────────────────────────────────

class WishlistAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wishlists = Wishlist.objects.filter(user=request.user).select_related('produk')
        serializer = WishlistSerializer(wishlists, many=True, context={'request': request})
        return Response(serializer.data)


class WishlistToggleAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, produk_id):
        try:
            produk = Produk.objects.get(id=produk_id)
        except Produk.DoesNotExist:
            return Response({'error': 'Produk tidak ditemukan.'}, status=404)

        wishlist_item, created = Wishlist.objects.get_or_create(user=request.user, produk=produk)
        if not created:
            wishlist_item.delete()
            return Response({'wishlisted': False, 'message': 'Produk dihapus dari wishlist.'})
        return Response({'wishlisted': True, 'message': 'Produk ditambahkan ke wishlist.'})


# ─── PESANAN / TRANSAKSI VIEWS ───────────────────────────────────────────────

class PesananListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Buyer orders
        pesanan = Pesanan.objects.filter(pembeli=request.user).select_related('produk', 'produk__seller', 'pembeli')
        serializer = PesananSerializer(pesanan, many=True, context={'request': request})
        return Response(serializer.data)


class PesananCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        produk_id = request.data.get('produk_id')
        catatan = request.data.get('catatan', '')

        try:
            produk = Produk.objects.get(id=produk_id, status='approved')
        except Produk.DoesNotExist:
            return Response({'error': 'Produk tidak ditemukan atau sudah tidak tersedia.'}, status=404)

        if produk.seller == request.user:
            return Response({'error': 'Kamu tidak bisa membeli produk milikmu sendiri.'}, status=400)

        pesanan = Pesanan.objects.create(
            pembeli=request.user,
            produk=produk,
            harga_bayar=produk.harga,
            catatan=catatan,
            status='confirmed',
        )

        # Mark produk as sold
        produk.status = 'sold'
        produk.save(update_fields=['status'])

        serializer = PesananSerializer(pesanan, context={'request': request})
        return Response(serializer.data, status=201)


class UpdateOrderStatusAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        new_status = request.data.get('status')
        valid_statuses = ['pending', 'confirmed', 'cod_waiting', 'completed', 'cancelled']
        if new_status not in valid_statuses:
            return Response({'error': f'Status tidak valid. Pilihan: {", ".join(valid_statuses)}'}, status=400)

        try:
            pesanan = Pesanan.objects.select_related('produk', 'produk__seller').get(id=pk)
        except Pesanan.DoesNotExist:
            return Response({'error': 'Pesanan tidak ditemukan.'}, status=404)

        # Check permissions: Admin, the seller, or the buyer (only buyer can cancel if pending)
        user = request.user
        is_order_seller = (pesanan.produk and pesanan.produk.seller == user)
        is_order_buyer = (pesanan.pembeli == user)

        if not (is_admin(user) or is_order_seller or (is_order_buyer and new_status == 'cancelled')):
            return Response({'error': 'Akses ditolak.'}, status=403)

        pesanan.status = new_status
        if new_status == 'completed':
            pesanan.tanggal_selesai = timezone.now()
            if pesanan.produk and pesanan.produk.status != 'sold':
                pesanan.produk.status = 'sold'
                pesanan.produk.save(update_fields=['status'])
        elif new_status == 'cancelled':
            if pesanan.produk and pesanan.produk.status == 'sold':
                pesanan.produk.status = 'approved'
                pesanan.produk.save(update_fields=['status'])

        pesanan.save()
        return Response({
            'message': f'Status pesanan #{pesanan.order_number} berhasil diperbarui menjadi {new_status}.',
            'pesanan': PesananSerializer(pesanan, context={'request': request}).data
        })


# ─── USER (MAHASISWA / PEMBELI) DASHBOARD VIEWS ──────────────────────────────

class UserStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        total_orders = Pesanan.objects.filter(pembeli=request.user).count()
        total_spent = Pesanan.objects.filter(
            pembeli=request.user, status__in=['confirmed', 'cod_waiting', 'completed']
        ).aggregate(total=Sum('harga_bayar'))['total'] or 0
        wishlist_count = Wishlist.objects.filter(user=request.user).count()

        pengguna = getattr(request.user, 'anggota', None)
        seller_status = pengguna.seller_status if pengguna else 'none'
        role = pengguna.role if pengguna else 'user'

        return Response({
            'total_orders': total_orders,
            'total_spent': total_spent,
            'wishlist_count': wishlist_count,
            'seller_status': seller_status,
            'role': role,
        })


class UpdateProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        nama = request.data.get('nama', '').strip()
        kampus = request.data.get('kampus', '').strip()
        nim = request.data.get('nim', '').strip()
        fakultas_prodi = request.data.get('fakultas_prodi', '').strip()
        telp = request.data.get('telp', '').strip()
        bio = request.data.get('bio', '').strip()
        alamat = request.data.get('alamat', '').strip()

        if nama:
            user.first_name = nama
            user.save(update_fields=['first_name'])

        pengguna, _ = UserPengguna.objects.get_or_create(user=user)
        if kampus:
            pengguna.kampus = kampus
        if nim:
            pengguna.nim = nim
        if fakultas_prodi:
            pengguna.fakultas_prodi = fakultas_prodi
        if telp:
            pengguna.telp = telp
        if bio:
            pengguna.bio = bio
        if alamat:
            pengguna.alamat = alamat

        if 'photo' in request.FILES:
            pengguna.photo = request.FILES['photo']

        pengguna.save()

        return Response({
            'message': 'Profil berhasil diperbarui.',
            'user': get_user_profile_dict(user)
        })


class ApplySellerAPIView(APIView):
    """Pengajuan pendaftaran penjual (verifikasi berkas mahasiswa aktif / KTM)"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        pengguna, _ = UserPengguna.objects.get_or_create(user=user)

        kampus = request.data.get('kampus', '').strip()
        nim = request.data.get('nim', '').strip()
        fakultas_prodi = request.data.get('fakultas_prodi', '').strip()
        telp = request.data.get('telp', '').strip()
        alasan_jual = request.data.get('alasan_jual', '').strip()
        ktm_url = request.data.get('ktm_url', '').strip()

        if not kampus or not nim or not telp:
            return Response({'error': 'Universitas, NIM, dan No WhatsApp wajib diisi untuk verifikasi penjual.'}, status=400)

        pengguna.kampus = kampus
        pengguna.nim = nim
        pengguna.fakultas_prodi = fakultas_prodi
        pengguna.telp = telp
        pengguna.alasan_jual = alasan_jual
        if ktm_url:
            pengguna.ktm_url = ktm_url
        if 'ktm_foto' in request.FILES:
            pengguna.ktm_foto = request.FILES['ktm_foto']

        pengguna.seller_status = 'pending'
        pengguna.seller_applied_at = timezone.now()
        pengguna.seller_reject_reason = ''
        pengguna.save()

        return Response({
            'message': 'Pengajuan verifikasi penjual berhasil dikirim! Menunggu konfirmasi admin.',
            'user': get_user_profile_dict(user)
        })


# ─── SELLER (USER ADMIN / PENJUAL) DASHBOARD VIEWS ───────────────────────────

class SellerStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not is_seller(user):
            return Response({'error': 'Akses khusus penjual terverifikasi.'}, status=403)

        total_listings = Produk.objects.filter(seller=user).count()
        active_listings = Produk.objects.filter(seller=user, status='approved').count()
        sold_listings = Produk.objects.filter(seller=user, status='sold').count()
        pending_listings = Produk.objects.filter(seller=user, status='pending').count()

        seller_orders = Pesanan.objects.filter(produk__seller=user)
        total_orders = seller_orders.count()
        completed_orders = seller_orders.filter(status='completed').count()
        pending_orders = seller_orders.filter(status__in=['pending', 'confirmed', 'cod_waiting']).count()

        total_revenue = seller_orders.filter(status='completed').aggregate(total=Sum('harga_bayar'))['total'] or 0

        return Response({
            'total_listings': total_listings,
            'active_listings': active_listings,
            'sold_listings': sold_listings,
            'pending_listings': pending_listings,
            'total_orders': total_orders,
            'completed_orders': completed_orders,
            'pending_orders': pending_orders,
            'total_revenue': total_revenue,
        })


class SellerProductsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_seller(request.user):
            return Response({'error': 'Akses khusus penjual.'}, status=403)

        status_filter = request.GET.get('status', '')
        qs = Produk.objects.filter(seller=request.user)
        if status_filter:
            qs = qs.filter(status=status_filter)

        serializer = ProdukSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)


class SellerOrdersAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_seller(request.user):
            return Response({'error': 'Akses khusus penjual.'}, status=403)

        orders = Pesanan.objects.filter(produk__seller=request.user).select_related('produk', 'pembeli', 'pembeli__anggota').order_by('-tanggal_pesan')
        serializer = PesananSerializer(orders, many=True, context={'request': request})
        return Response(serializer.data)


# ─── ADMIN (SUPER ADMIN) DASHBOARD VIEWS ─────────────────────────────────────

class AdminStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user):
            return Response({'error': 'Akses ditolak.'}, status=403)

        total_produk = Produk.objects.count()
        active_produk = Produk.objects.filter(status='approved').count()
        produk_pending = Produk.objects.filter(status='pending').count()

        total_users = User.objects.count()
        total_sellers = UserPengguna.objects.filter(Q(role='penjual') | Q(seller_status='approved')).count()
        pending_sellers = UserPengguna.objects.filter(seller_status='pending').count()

        total_orders = Pesanan.objects.count()
        completed_orders = Pesanan.objects.filter(status='completed').count()
        total_transaksi = Pesanan.objects.filter(status='completed').aggregate(total=Sum('harga_bayar'))['total'] or 0

        kategori_data = (
            Produk.objects
            .values('kategori')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        return Response({
            'total_produk': total_produk,
            'active_produk': active_produk,
            'produk_pending': produk_pending,
            'total_users': total_users,
            'total_sellers': total_sellers,
            'pending_sellers': pending_sellers,
            'total_orders': total_orders,
            'completed_orders': completed_orders,
            'total_transaksi': total_transaksi,
            'kategori_breakdown': list(kategori_data),
        })


class AdminProdukAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user):
            return Response({'error': 'Akses ditolak.'}, status=403)

        status_filter = request.GET.get('status', '')
        qs = Produk.objects.all().select_related('seller', 'seller__anggota').order_by('-tanggal_dibuat')
        if status_filter:
            qs = qs.filter(status=status_filter)

        serializer = ProdukSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        if not is_admin(request.user):
            return Response({'error': 'Akses ditolak.'}, status=403)

        serializer = ProdukCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            produk = serializer.save()
            return Response(ProdukSerializer(produk, context={'request': request}).data, status=201)
        return Response({'error': serializer.errors}, status=400)


class AdminApproveProdukAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not is_admin(request.user):
            return Response({'error': 'Akses ditolak.'}, status=403)
        try:
            produk = Produk.objects.get(id=pk)
            produk.status = 'approved'
            produk.save(update_fields=['status'])
            return Response({'message': f'Produk "{produk.nama}" disetujui dan aktif.'})
        except Produk.DoesNotExist:
            return Response({'error': 'Produk tidak ditemukan.'}, status=404)


class AdminRejectProdukAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not is_admin(request.user):
            return Response({'error': 'Akses ditolak.'}, status=403)
        try:
            produk = Produk.objects.get(id=pk)
            produk.status = 'rejected'
            produk.save(update_fields=['status'])
            return Response({'message': f'Produk "{produk.nama}" ditolak.'})
        except Produk.DoesNotExist:
            return Response({'error': 'Produk tidak ditemukan.'}, status=404)


class AdminDeleteProdukAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        if not is_admin(request.user):
            return Response({'error': 'Akses ditolak.'}, status=403)
        try:
            produk = Produk.objects.get(id=pk)
            nama = produk.nama
            produk.delete()
            return Response({'message': f'Produk "{nama}" berhasil dihapus.'})
        except Produk.DoesNotExist:
            return Response({'error': 'Produk tidak ditemukan.'}, status=404)


class AdminUsersAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user):
            return Response({'error': 'Akses ditolak.'}, status=403)

        users = User.objects.all().select_related('anggota').order_by('-date_joined')
        data = []
        for u in users:
            pengguna = getattr(u, 'anggota', None)
            role = 'admin' if u.is_superuser else (pengguna.role if pengguna else 'user')
            seller_status = pengguna.seller_status if pengguna else 'none'
            kampus = pengguna.kampus if pengguna else ''
            telp = pengguna.telp if pengguna else ''
            nim = pengguna.nim if pengguna else ''

            data.append({
                'id': u.id,
                'username': u.username,
                'nama': u.first_name or u.username,
                'email': u.email,
                'role': role,
                'is_staff': u.is_staff,
                'is_superuser': u.is_superuser,
                'seller_status': seller_status,
                'kampus': kampus,
                'nim': nim,
                'telp': telp,
                'date_joined': u.date_joined,
                'produk_count': Produk.objects.filter(seller=u).count(),
                'pesanan_count': Pesanan.objects.filter(pembeli=u).count(),
            })
        return Response(data)


class AdminCreateUserAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not is_admin(request.user):
            return Response({'error': 'Akses ditolak.'}, status=403)

        nama = request.data.get('nama', '').strip()
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', 'kampus123')
        role = request.data.get('role', 'user')
        kampus = request.data.get('kampus', '').strip()
        telp = request.data.get('telp', '').strip()

        if not email or not nama:
            return Response({'error': 'Nama dan Email wajib diisi.'}, status=400)

        if User.objects.filter(email__iexact=email).exists():
            return Response({'error': 'Email sudah digunakan.'}, status=400)

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=nama,
            is_staff=(role == 'admin'),
            is_superuser=(role == 'admin'),
        )

        pengguna, _ = UserPengguna.objects.get_or_create(user=user)
        pengguna.role = role
        pengguna.kampus = kampus
        pengguna.telp = telp
        if role == 'penjual':
            pengguna.seller_status = 'approved'
            pengguna.is_verified = True
        elif role == 'admin':
            pengguna.seller_status = 'approved'
            pengguna.is_verified = True
            UserAdmin.objects.get_or_create(username=user)
        pengguna.save()

        return Response({
            'message': f'Akun {nama} ({role}) berhasil dibuat!',
            'user': get_user_profile_dict(user)
        }, status=201)


class AdminUpdateUserAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        if not is_admin(request.user):
            return Response({'error': 'Akses ditolak.'}, status=403)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'Pengguna tidak ditemukan.'}, status=404)

        nama = request.data.get('nama', '').strip()
        role = request.data.get('role', '').strip()
        seller_status = request.data.get('seller_status', '').strip()
        kampus = request.data.get('kampus', '').strip()
        telp = request.data.get('telp', '').strip()

        if nama:
            user.first_name = nama

        pengguna, _ = UserPengguna.objects.get_or_create(user=user)

        if role:
            pengguna.role = role
            if role == 'admin':
                user.is_staff = True
                user.is_superuser = True
                UserAdmin.objects.get_or_create(username=user)
            elif role == 'penjual':
                pengguna.seller_status = 'approved'
                pengguna.is_verified = True
            elif role == 'user':
                user.is_superuser = False
                user.is_staff = False

        if seller_status:
            pengguna.seller_status = seller_status
            if seller_status == 'approved':
                pengguna.role = 'penjual'
                pengguna.is_verified = True
            elif seller_status in ['none', 'rejected']:
                if pengguna.role == 'penjual':
                    pengguna.role = 'user'

        if kampus:
            pengguna.kampus = kampus
        if telp:
            pengguna.telp = telp

        user.save()
        pengguna.save()

        return Response({
            'message': f'Data pengguna {user.first_name} berhasil diperbarui.',
            'user': get_user_profile_dict(user)
        })


class AdminDeleteUserAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id):
        if not is_admin(request.user):
            return Response({'error': 'Akses ditolak.'}, status=403)
        if request.user.id == user_id:
            return Response({'error': 'Tidak dapat menghapus akun admin sendiri.'}, status=400)
        try:
            user = User.objects.get(id=user_id)
            nama = user.first_name or user.username
            user.delete()
            return Response({'message': f'Pengguna "{nama}" berhasil dihapus.'})
        except User.DoesNotExist:
            return Response({'error': 'Pengguna tidak ditemukan.'}, status=404)


class AdminSellerApplicationsAPIView(APIView):
    """Melihat daftar pengajuan verifikasi penjual (berkas KTM / mahasiswa aktif)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user):
            return Response({'error': 'Akses ditolak.'}, status=403)

        status_filter = request.GET.get('status', '')
        qs = UserPengguna.objects.select_related('user').all()
        if status_filter:
            qs = qs.filter(seller_status=status_filter)
        else:
            # By default show pending applications first, then others
            qs = qs.exclude(seller_status='none').order_by('-seller_applied_at')

        serializer = UserPenggunaSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)


class AdminApproveSellerAPIView(APIView):
    """Admin menyetujui pengajuan verifikasi berkas penjual"""
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        if not is_admin(request.user):
            return Response({'error': 'Akses ditolak.'}, status=403)

        try:
            user = User.objects.get(id=user_id)
            pengguna, _ = UserPengguna.objects.get_or_create(user=user)
        except User.DoesNotExist:
            return Response({'error': 'Pengguna tidak ditemukan.'}, status=404)

        pengguna.seller_status = 'approved'
        pengguna.role = 'penjual'
        pengguna.is_verified = True
        pengguna.seller_verified_at = timezone.now()
        pengguna.save()

        return Response({
            'message': f'Pengajuan penjual {user.first_name} disetujui! Akun kini berstatus Penjual (User Admin).',
            'user': get_user_profile_dict(user)
        })


class AdminRejectSellerAPIView(APIView):
    """Admin menolak pengajuan verifikasi berkas penjual"""
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        if not is_admin(request.user):
            return Response({'error': 'Akses ditolak.'}, status=403)

        try:
            user = User.objects.get(id=user_id)
            pengguna, _ = UserPengguna.objects.get_or_create(user=user)
        except User.DoesNotExist:
            return Response({'error': 'Pengguna tidak ditemukan.'}, status=404)

        reason = request.data.get('reason', 'Berkas identitas mahasiswa tidak sesuai atau buram.')
        pengguna.seller_status = 'rejected'
        pengguna.seller_reject_reason = reason
        pengguna.save()

        return Response({
            'message': f'Pengajuan penjual {user.first_name} ditolak.',
            'user': get_user_profile_dict(user)
        })


class AdminPesananAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user):
            return Response({'error': 'Akses ditolak.'}, status=403)

        pesanan = Pesanan.objects.all().select_related('pembeli', 'pembeli__anggota', 'produk', 'produk__seller').order_by('-tanggal_pesan')
        serializer = PesananSerializer(pesanan, many=True, context={'request': request})
        return Response(serializer.data)


class AdminKontakAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user):
            return Response({'error': 'Akses ditolak.'}, status=403)
        pesan = PesanKontak.objects.all()
        serializer = PesanKontakSerializer(pesan, many=True)
        return Response(serializer.data)


class AdminSettingsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user):
            return Response({'error': 'Akses ditolak.'}, status=403)
        settings = PengaturanToko.get_settings()
        serializer = PengaturanTokoSerializer(settings)
        return Response(serializer.data)

    def post(self, request):
        if not is_admin(request.user):
            return Response({'error': 'Akses ditolak.'}, status=403)
        settings = PengaturanToko.get_settings()
        serializer = PengaturanTokoSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Pengaturan berhasil disimpan.'})
        return Response({'error': serializer.errors}, status=400)


# ─── KONTAK VIEW ──────────────────────────────────────────────────────────────

class KontakAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PesanKontakSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Pesan berhasil dikirim! Kami akan menghubungi kamu segera.'}, status=201)
        return Response({'error': serializer.errors}, status=400)
