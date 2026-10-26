from app.models import PengaturanToko

def toko_context(request):
    try:
        settings = PengaturanToko.get_settings()
    except Exception:
        settings = None
    return {
        'toko_settings': settings
    }
