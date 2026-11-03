from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserPengguna, UserAdmin, Produk, Wishlist, Pesanan, PesanKontak, PengaturanToko


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    is_seller = serializers.SerializerMethodField()
    seller_status = serializers.SerializerMethodField()
    kampus = serializers.SerializerMethodField()
    telp = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email',
            'is_staff', 'is_superuser', 'role', 'is_seller', 'seller_status',
            'kampus', 'telp', 'date_joined'
        ]

    def get_role(self, obj):
        if obj.is_superuser:
            return 'admin'
        if hasattr(obj, 'anggota'):
            return obj.anggota.role
        return 'user'

    def get_is_seller(self, obj):
        if obj.is_superuser:
            return True
        if hasattr(obj, 'anggota'):
            return obj.anggota.is_seller
        return False

    def get_seller_status(self, obj):
        if hasattr(obj, 'anggota'):
            return obj.anggota.seller_status
        return 'none'

    def get_kampus(self, obj):
        if hasattr(obj, 'anggota'):
            return obj.anggota.kampus or ''
        return ''

    def get_telp(self, obj):
        if hasattr(obj, 'anggota'):
            return obj.anggota.telp or ''
        return ''


class UserPenggunaSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    nama = serializers.CharField(source='user.first_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    photo_url = serializers.SerializerMethodField()
    ktm_display = serializers.SerializerMethodField()

    class Meta:
        model = UserPengguna
        fields = [
            'uuid', 'user_id', 'nama', 'email', 'role', 'kampus', 'nim',
            'fakultas_prodi', 'telp', 'gender', 'alamat', 'photo_url',
            'bio', 'is_verified', 'seller_status', 'ktm_url', 'ktm_display',
            'alasan_jual', 'seller_applied_at', 'seller_verified_at',
            'seller_reject_reason', 'date_joined'
        ]

    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
        return None

    def get_ktm_display(self, obj):
        if obj.ktm_foto:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.ktm_foto.url)
        return obj.ktm_url or ''


class ProdukSerializer(serializers.ModelSerializer):
    seller_id = serializers.IntegerField(source='seller.id', read_only=True)
    seller_nama = serializers.CharField(source='seller.first_name', read_only=True)
    seller_email = serializers.EmailField(source='seller.email', read_only=True)
    seller_kampus = serializers.SerializerMethodField()
    seller_telp = serializers.SerializerMethodField()
    foto_display = serializers.SerializerMethodField()
    is_wishlisted = serializers.SerializerMethodField()

    class Meta:
        model = Produk
        fields = [
            'id', 'seller_id', 'seller_nama', 'seller_email', 'seller_kampus',
            'seller_telp', 'nama', 'kategori', 'kondisi', 'harga', 'harga_asli',
            'deskripsi', 'foto_url', 'foto_display', 'lokasi',
            'status', 'tanggal_dibuat', 'tanggal_diperbarui', 'dilihat', 'is_wishlisted'
        ]

    def get_seller_kampus(self, obj):
        try:
            return obj.seller.anggota.kampus or ''
        except Exception:
            return ''

    def get_seller_telp(self, obj):
        try:
            return obj.seller.anggota.telp or ''
        except Exception:
            return ''

    def get_foto_display(self, obj):
        if obj.foto:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.foto.url)
        return obj.foto_url or ''

    def get_is_wishlisted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Wishlist.objects.filter(user=request.user, produk=obj).exists()
        return False


class ProdukCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Produk
        fields = ['nama', 'kategori', 'kondisi', 'harga', 'harga_asli', 'deskripsi', 'foto_url', 'foto', 'lokasi', 'status']
        extra_kwargs = {
            'foto': {'required': False},
            'status': {'required': False},
        }

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['seller'] = user
        # If user is admin, default approved. If seller, approved. Otherwise pending.
        if 'status' not in validated_data or not validated_data['status']:
            if user.is_staff or user.is_superuser:
                validated_data['status'] = 'approved'
            elif hasattr(user, 'anggota') and user.anggota.is_seller:
                validated_data['status'] = 'approved'
            else:
                validated_data['status'] = 'pending'
        return super().create(validated_data)


class ProdukUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Produk
        fields = ['nama', 'kategori', 'kondisi', 'harga', 'harga_asli', 'deskripsi', 'foto_url', 'foto', 'lokasi', 'status']
        extra_kwargs = {
            'nama': {'required': False},
            'kategori': {'required': False},
            'harga': {'required': False},
            'deskripsi': {'required': False},
            'foto': {'required': False},
        }


class WishlistSerializer(serializers.ModelSerializer):
    produk = ProdukSerializer(read_only=True)
    produk_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Wishlist
        fields = ['id', 'produk', 'produk_id', 'tanggal_ditambah']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        produk_id = validated_data.pop('produk_id')
        produk = Produk.objects.get(id=produk_id)
        validated_data['produk'] = produk
        return super().create(validated_data)


class PesananSerializer(serializers.ModelSerializer):
    produk_detail = ProdukSerializer(source='produk', read_only=True)
    pembeli_id = serializers.IntegerField(source='pembeli.id', read_only=True)
    pembeli_nama = serializers.CharField(source='pembeli.first_name', read_only=True)
    pembeli_email = serializers.EmailField(source='pembeli.email', read_only=True)
    pembeli_telp = serializers.SerializerMethodField()
    pembeli_kampus = serializers.SerializerMethodField()
    seller_id = serializers.SerializerMethodField()
    seller_nama = serializers.SerializerMethodField()

    class Meta:
        model = Pesanan
        fields = [
            'id', 'order_number', 'pembeli_id', 'pembeli_nama', 'pembeli_email',
            'pembeli_telp', 'pembeli_kampus', 'seller_id', 'seller_nama',
            'produk_detail', 'harga_bayar', 'status', 'catatan',
            'tanggal_pesan', 'tanggal_selesai'
        ]

    def get_pembeli_telp(self, obj):
        if obj.pembeli and hasattr(obj.pembeli, 'anggota'):
            return obj.pembeli.anggota.telp or ''
        return ''

    def get_pembeli_kampus(self, obj):
        if obj.pembeli and hasattr(obj.pembeli, 'anggota'):
            return obj.pembeli.anggota.kampus or ''
        return ''

    def get_seller_id(self, obj):
        if obj.produk and obj.produk.seller:
            return obj.produk.seller.id
        return None

    def get_seller_nama(self, obj):
        if obj.produk and obj.produk.seller:
            return obj.produk.seller.first_name
        return ''


class PesanKontakSerializer(serializers.ModelSerializer):
    class Meta:
        model = PesanKontak
        fields = ['id', 'nama', 'email', 'topik', 'pesan', 'tanggal']
        read_only_fields = ['id', 'tanggal']


class RegisterSerializer(serializers.Serializer):
    nama = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    kampus = serializers.CharField(max_length=150, required=False, allow_blank=True)
    password = serializers.CharField(min_length=6, write_only=True)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email ini sudah terdaftar.")
        return value.lower()

    def create(self, validated_data):
        email = validated_data['email']
        user = User.objects.create_user(
            username=email,
            email=email,
            password=validated_data['password'],
            first_name=validated_data['nama'],
            last_name='Pengguna',
        )
        pengguna, _ = UserPengguna.objects.get_or_create(user=user)
        pengguna.kampus = validated_data.get('kampus', '')
        pengguna.role = 'user'
        pengguna.seller_status = 'none'
        pengguna.save()
        return user


class PengaturanTokoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PengaturanToko
        fields = '__all__'


class DashboardStatsSerializer(serializers.Serializer):
    total_produk = serializers.IntegerField()
    total_pengguna = serializers.IntegerField()
    total_pesanan = serializers.IntegerField()
    produk_pending = serializers.IntegerField()
    total_transaksi = serializers.IntegerField()
