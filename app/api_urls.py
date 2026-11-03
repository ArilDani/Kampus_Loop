from django.urls import path
from . import api_views

urlpatterns = [
    # ── AUTH ──────────────────────────────────────────────────────────────────
    path('auth/login/', api_views.LoginAPIView.as_view(), name='api_login'),
    path('auth/register/', api_views.RegisterAPIView.as_view(), name='api_register'),
    path('auth/logout/', api_views.LogoutAPIView.as_view(), name='api_logout'),
    path('auth/me/', api_views.MeAPIView.as_view(), name='api_me'),

    # ── PRODUK ────────────────────────────────────────────────────────────────
    path('produk/', api_views.ProdukListAPIView.as_view(), name='api_produk_list'),
    path('produk/featured/', api_views.ProdukFeaturedAPIView.as_view(), name='api_produk_featured'),
    path('produk/<uuid:pk>/', api_views.ProdukDetailAPIView.as_view(), name='api_produk_detail'),
    path('produk/create/', api_views.ProdukCreateAPIView.as_view(), name='api_produk_create'),
    path('produk/<uuid:pk>/edit/', api_views.ProdukUpdateAPIView.as_view(), name='api_produk_update'),
    path('produk/<uuid:pk>/delete/', api_views.ProdukDeleteAPIView.as_view(), name='api_produk_delete'),

    # ── WISHLIST ──────────────────────────────────────────────────────────────
    path('wishlist/', api_views.WishlistAPIView.as_view(), name='api_wishlist'),
    path('wishlist/toggle/<uuid:produk_id>/', api_views.WishlistToggleAPIView.as_view(), name='api_wishlist_toggle'),

    # ── PESANAN & TRANSAKSI ───────────────────────────────────────────────────
    path('pesanan/', api_views.PesananListAPIView.as_view(), name='api_pesanan_list'),
    path('pesanan/create/', api_views.PesananCreateAPIView.as_view(), name='api_pesanan_create'),
    path('pesanan/<uuid:pk>/status/', api_views.UpdateOrderStatusAPIView.as_view(), name='api_order_status'),

    # ── KONTAK ────────────────────────────────────────────────────────────────
    path('kontak/', api_views.KontakAPIView.as_view(), name='api_kontak'),

    # ── USER (PEMBELI / REGULER) DASHBOARD ────────────────────────────────────
    path('user/stats/', api_views.UserStatsAPIView.as_view(), name='api_user_stats'),
    path('user/profile/update/', api_views.UpdateProfileAPIView.as_view(), name='api_update_profile'),
    path('user/apply-seller/', api_views.ApplySellerAPIView.as_view(), name='api_apply_seller'),

    # ── SELLER (USER ADMIN / PENJUAL) DASHBOARD ───────────────────────────────
    path('seller/stats/', api_views.SellerStatsAPIView.as_view(), name='api_seller_stats'),
    path('seller/products/', api_views.SellerProductsAPIView.as_view(), name='api_seller_products'),
    path('seller/orders/', api_views.SellerOrdersAPIView.as_view(), name='api_seller_orders'),

    # ── ADMIN (SUPER ADMIN) DASHBOARD ─────────────────────────────────────────
    path('admin/stats/', api_views.AdminStatsAPIView.as_view(), name='api_admin_stats'),
    path('admin/produk/', api_views.AdminProdukAPIView.as_view(), name='api_admin_produk'),
    path('admin/produk/<uuid:pk>/approve/', api_views.AdminApproveProdukAPIView.as_view(), name='api_admin_approve'),
    path('admin/produk/<uuid:pk>/reject/', api_views.AdminRejectProdukAPIView.as_view(), name='api_admin_reject'),
    path('admin/produk/<uuid:pk>/delete/', api_views.AdminDeleteProdukAPIView.as_view(), name='api_admin_delete_produk'),
    path('admin/users/', api_views.AdminUsersAPIView.as_view(), name='api_admin_users'),
    path('admin/users/create/', api_views.AdminCreateUserAPIView.as_view(), name='api_admin_create_user'),
    path('admin/users/<int:user_id>/update/', api_views.AdminUpdateUserAPIView.as_view(), name='api_admin_update_user'),
    path('admin/users/<int:user_id>/delete/', api_views.AdminDeleteUserAPIView.as_view(), name='api_admin_delete_user'),
    path('admin/seller-applications/', api_views.AdminSellerApplicationsAPIView.as_view(), name='api_admin_seller_apps'),
    path('admin/seller-applications/<int:user_id>/approve/', api_views.AdminApproveSellerAPIView.as_view(), name='api_admin_approve_seller'),
    path('admin/seller-applications/<int:user_id>/reject/', api_views.AdminRejectSellerAPIView.as_view(), name='api_admin_reject_seller'),
    path('admin/pesanan/', api_views.AdminPesananAPIView.as_view(), name='api_admin_pesanan'),
    path('admin/kontak/', api_views.AdminKontakAPIView.as_view(), name='api_admin_kontak'),
    path('admin/settings/', api_views.AdminSettingsAPIView.as_view(), name='api_admin_settings'),
]
