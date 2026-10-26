from django import forms
from datetime import date
from .models import UserPengguna, Provinsi

class formProfile(forms.ModelForm):
    jafung = forms.ChoiceField(
        choices=[
            ('', '-- Pilih Jabatan Fungsional --'),
            ('Tanpa Jabatan Fungsional', 'Tanpa Jabatan Fungsional'),
            ('Asisten Ahli', 'Asisten Ahli'),
            ('Lektor', 'Lektor'),
            ('Lektor Kepala', 'Lektor Kepala'),
            ('Guru Besar', 'Guru Besar'),
        ],
        widget=forms.Select(attrs={'class': 'form-control', 'id': 'id_jafung'}),
        required=False
    )

    gender = forms.ChoiceField(
        choices=[
            ('', '-- Pilih Jenis Kelamin --'),
            ('Laki-laki', 'Laki-laki'),
            ('Perempuan', 'Perempuan'),
        ],
        widget=forms.Select(attrs={'class': 'form-control', 'id': 'id_gender'}),
        required=True
    )

    provinsi_anggota = forms.ModelChoiceField(
        queryset=Provinsi.objects.filter(aktif=True).order_by('nama_provinsi'),
        empty_label='-- Pilih Provinsi Pengiriman --',
        widget=forms.Select(attrs={'class': 'form-control', 'id': 'id_provinsi_anggota'}),
        required=True
    )

    class Meta:
        model = UserPengguna
        fields = [
            'telp',
            'gender',
            'nuptk',
            'jafung',
            'bidang_keahlian',
            'alamat',
            'provinsi_anggota',
            'photo',
            'link_sinta',
            'link_scopus',
            'link_google_scholar',
            'link_orcid',

        ]
        widgets = {
            'telp': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Contoh: 081234567890', 'required': True}),
            'nuptk': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Nomor Identitas / KTP (opsional)'}),
            'bidang_keahlian': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Contoh: Pembeli Retail, Grosir, Reseller'}),
            'alamat': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Jalan, Nomor Rumah, RT/RW, Kecamatan, Kota/Kab, Kode Pos', 'required': True}),
            'photo': forms.FileInput(attrs={'class': 'form-control', 'accept': 'image/*'}),
            'link_sinta': forms.URLInput(attrs={'class': 'form-control', 'placeholder': 'https://link-profil-atau-sosmed.com'}),
            'link_scopus': forms.URLInput(attrs={'class': 'form-control', 'placeholder': 'https://...'}),
            'link_google_scholar': forms.URLInput(attrs={'class': 'form-control', 'placeholder': 'https://...'}),
            'link_orcid': forms.URLInput(attrs={'class': 'form-control', 'placeholder': 'https://...'}),  
        }