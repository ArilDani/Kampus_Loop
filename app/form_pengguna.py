from django import forms
from datetime import date
from .models import UserPengguna

class formProfile(forms.ModelForm):
    gender = forms.ChoiceField(
        choices=[
            ('', '-- Pilih Jenis Kelamin --'),
            ('Laki-laki', 'Laki-laki'),
            ('Perempuan', 'Perempuan'),
        ],
        widget=forms.Select(attrs={'class': 'form-control', 'id': 'id_gender'}),
        required=True
    )

    class Meta:
        model = UserPengguna
        fields = [
            'kampus',
            'telp',
            'gender',
            'alamat',
            'photo',
            'bio',
        ]
        widgets = {
            'kampus': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Universitas / Kampus'}),
            'telp': forms.TextInput(attrs={'class': 'form-control', 'placeholder': '081234567890'}),
            'alamat': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Alamat / Kampus'}),
            'photo': forms.FileInput(attrs={'class': 'form-control', 'accept': 'image/*'}),
            'bio': forms.Textarea(attrs={'class': 'form-control', 'placeholder': 'Ceritakan sedikit tentang dirimu...'}),
        }