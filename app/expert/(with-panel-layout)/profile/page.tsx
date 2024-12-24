'use client';

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { db, storage } from '@/app/firebaseConfig';  // Client Firebase config
import { doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// UI Bileşenleri (sizin projenizdeki component'ler)
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';

interface Education {
  name: string;
  institution: string;
  date: string;  // datetime-local ya da date format
}

interface ExpertData {
  // Admin tarafından girilen zorunlu alanlar (readonly)
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  startDate?: string;
  email?: string;
  password?: string;

  // Fotoğraf
  photoURL?: string;

  // ÇAP
  isCAP?: boolean;
  capUniversity?: string;
  capDepartment?: string;
  capLevel?: string;

  // Yandal
  isYANDAL?: boolean;
  yandalUniversity?: string;
  yandalDepartment?: string;
  yandalLevel?: string;

  // Açıköğretim
  isAcikogretim?: boolean;
  acikogretimUniversity?: string;
  acikogretimDepartment?: string;
  acikogretimLevel?: string;

  // Diğer
  activeInstitution?: string;
  city?: string;
  district?: string;
  foreignLanguage?: string;

  educations?: Education[];
}

export default function ExpertProfilePage() {
  // Giriş yaparken koyduğumuz userId cookie'sini okuyalım
  const userId = Cookies.get('user_id') || '';

  const [expertData, setExpertData] = useState<ExpertData>({});

  // Fotoğraf dosyası
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Yeni eğitim ekleme için geçici state
  const [tempEducation, setTempEducation] = useState<Education>({
    name: '',
    institution: '',
    date: ''
  });

  // Form gönderme sırasında loading / mesaj
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sayfa ilk açıldığında Firestore'dan mevcut veriyi çek
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!userId) return;
        const docRef = doc(db, 'experts', userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setExpertData(docSnap.data() as ExpertData);
        }
      } catch (err) {
        console.error('Error fetching expert data:', err);
      }
    };
    fetchData();
  }, [userId]);

  // Fotoğraf seçildiğinde
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 5MB kontrolü
    if (file.size > 5 * 1024 * 1024) {
      setError('Fotoğraf boyutu 5MB’dan büyük olamaz!');
      return;
    }
    setPhotoFile(file);
  };

  // Fotoğrafı Firebase Storage'a yükle
  const handleUploadPhoto = async () => {
    if (!photoFile || !userId) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setUploadProgress(0);

      const storageRef = ref(storage, `expert-photos/${userId}-${photoFile.name}`);
      const uploadTask = uploadBytesResumable(storageRef, photoFile);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (err) => {
          console.error('Photo upload error:', err);
          setError('Fotoğraf yüklenirken hata oluştu.');
          setLoading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(storageRef);
          // Firestore'a kaydetmeden önce state'e yazalım
          setExpertData((prev) => ({ ...prev, photoURL: downloadURL }));
          setSuccess('Fotoğraf başarıyla yüklendi!');
          setUploadProgress(0);
          setLoading(false);
          setPhotoFile(null);
        }
      );
    } catch (err: any) {
      console.error(err);
      setError('Fotoğraf yüklenirken hata oluştu.');
      setLoading(false);
    }
  };

  // Form alanları değiştikçe state günceller (ad, kurum, vs.)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement & HTMLTextAreaElement;

    // Checkbox'lar için
    if (type === 'checkbox') {
      setExpertData((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    setExpertData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Eğitim ekle butonu
  const handleAddEducation = () => {
    if (!tempEducation.name || !tempEducation.institution || !tempEducation.date) {
      setError('Lütfen eğitim adı, kurum ve tarih/saat giriniz.');
      return;
    }
    setExpertData((prev) => ({
      ...prev,
      educations: [...(prev.educations || []), tempEducation]
    }));

    // Geçici alanı sıfırla
    setTempEducation({ name: '', institution: '', date: '' });
  };

  // Formu kaydet (API'ye gönder)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!userId) {
        throw new Error('Kullanıcı bulunamadı. Lütfen tekrar giriş yapınız.');
      }

      // API'ye POST isteği
      const response = await fetch('/api/update-expert-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,

          // ÇAP
          isCAP: expertData.isCAP,
          capUniversity: expertData.capUniversity,
          capDepartment: expertData.capDepartment,
          capLevel: expertData.capLevel,

          // Yandal
          isYANDAL: expertData.isYANDAL,
          yandalUniversity: expertData.yandalUniversity,
          yandalDepartment: expertData.yandalDepartment,
          yandalLevel: expertData.yandalLevel,

          // Açıköğretim
          isAcikogretim: expertData.isAcikogretim,
          acikogretimUniversity: expertData.acikogretimUniversity,
          acikogretimDepartment: expertData.acikogretimDepartment,
          acikogretimLevel: expertData.acikogretimLevel,

          // Diğer alanlar
          activeInstitution: expertData.activeInstitution,
          city: expertData.city,
          district: expertData.district,
          foreignLanguage: expertData.foreignLanguage,
          educations: expertData.educations || [],
          photoURL: expertData.photoURL || '',
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Bilinmeyen bir hata oluştu.');
      }

      setSuccess('Profiliniz başarıyla güncellendi!');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Profil güncellenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Uzman Profilim</CardTitle>
        </CardHeader>
        <CardContent>
          {success && (
            <Alert className="bg-green-50 mb-4">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Admin tarafından girilen ve readonly olması istenen alanlar */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div>
              <Label>Ad</Label>
              <Input value={expertData.firstName || ''} readOnly />
            </div>
            <div>
              <Label>Soyad</Label>
              <Input value={expertData.lastName || ''} readOnly />
            </div>
            <div>
              <Label>Doğum Tarihi</Label>
              <Input type="date" value={expertData.birthDate || ''} readOnly />
            </div>
            <div>
              <Label>İşe Başlama Tarihi</Label>
              <Input type="date" value={expertData.startDate || ''} readOnly />
            </div>
            <div>
              <Label>E-posta</Label>
              <Input type="email" value={expertData.email || ''} readOnly />
            </div>
            <div>
              <Label>Şifre</Label>
              <Input type="password" value={expertData.password || ''} readOnly />
            </div>
          </div>

          {/* Fotoğraf */}
          <div className="mb-8">
            <Label>Profil Fotoğrafı</Label>
            {expertData.photoURL && (
              <div className="mt-2 mb-2">
                <img
                  src={expertData.photoURL}
                  alt="Uzman Fotoğrafı"
                  className="w-32 h-32 object-cover rounded-full"
                />
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Input type="file" accept="image/*" onChange={handlePhotoSelect} />
              <Button type="button" onClick={handleUploadPhoto} disabled={loading || !photoFile}>
                Fotoğraf Yükle
              </Button>
            </div>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <p className="text-sm mt-2">Yükleniyor: %{Math.round(uploadProgress)}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ÇAP */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Input
                  type="checkbox"
                  name="isCAP"
                  checked={expertData.isCAP || false}
                  onChange={handleChange}
                />
                <span>ÇAP</span>
              </Label>

              {/* ÇAP seçilmişse üniversite/bölüm/seviye alanları */}
              {expertData.isCAP && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Üniversite</Label>
                    <Input
                      name="capUniversity"
                      value={expertData.capUniversity || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label>Bölüm</Label>
                    <Input
                      name="capDepartment"
                      value={expertData.capDepartment || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label>Sınıf / Seviye</Label>
                    <Input
                      name="capLevel"
                      placeholder="1. sınıf, 2. sınıf vb."
                      value={expertData.capLevel || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Yandal */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Input
                  type="checkbox"
                  name="isYANDAL"
                  checked={expertData.isYANDAL || false}
                  onChange={handleChange}
                />
                <span>Yandal</span>
              </Label>

              {expertData.isYANDAL && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Üniversite</Label>
                    <Input
                      name="yandalUniversity"
                      value={expertData.yandalUniversity || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label>Bölüm</Label>
                    <Input
                      name="yandalDepartment"
                      value={expertData.yandalDepartment || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label>Sınıf / Seviye</Label>
                    <Input
                      name="yandalLevel"
                      placeholder="1. sınıf, 2. sınıf vb."
                      value={expertData.yandalLevel || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Açıköğretim */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Input
                  type="checkbox"
                  name="isAcikogretim"
                  checked={expertData.isAcikogretim || false}
                  onChange={handleChange}
                />
                <span>Açıköğretim</span>
              </Label>

              {expertData.isAcikogretim && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Üniversite</Label>
                    <Input
                      name="acikogretimUniversity"
                      value={expertData.acikogretimUniversity || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label>Bölüm</Label>
                    <Input
                      name="acikogretimDepartment"
                      value={expertData.acikogretimDepartment || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label>Sınıf / Seviye</Label>
                    <Input
                      name="acikogretimLevel"
                      placeholder="1. sınıf, 2. sınıf vb."
                      value={expertData.acikogretimLevel || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Aktif Çalıştığınız Kurum */}
            <div>
              <Label>Aktif Çalıştığınız Kurum</Label>
              <Input
                name="activeInstitution"
                value={expertData.activeInstitution || ''}
                onChange={handleChange}
              />
            </div>

            {/* İl - İlçe */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>İl</Label>
                <Input
                  name="city"
                  value={expertData.city || ''}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label>İlçe</Label>
                <Input
                  name="district"
                  value={expertData.district || ''}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Yabancı Dil */}
            <div>
              <Label>Yabancı Dil</Label>
              <Input
                name="foreignLanguage"
                placeholder="İngilizce, Almanca vb."
                value={expertData.foreignLanguage || ''}
                onChange={handleChange}
              />
            </div>

            {/* Eğitimler */}
            <div>
              <Label className="font-semibold mb-2 block">Eğitimlerim</Label>

              {/* Mevcut liste (readonly) */}
              {(expertData.educations || []).map((edu, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-2 mb-2">
                  <Input readOnly value={edu.name} placeholder="Eğitim Adı" />
                  <Input readOnly value={edu.institution} placeholder="Kurum" />
                  <Input readOnly value={edu.date} placeholder="Tarih/Saat" />
                </div>
              ))}

              {/* Yeni ekleme alanı */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                <Input
                  placeholder="Eğitim Adı"
                  value={tempEducation.name}
                  onChange={(e) => setTempEducation((prev) => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="Kurum"
                  value={tempEducation.institution}
                  onChange={(e) => setTempEducation((prev) => ({
                    ...prev,
                    institution: e.target.value
                  }))}
                />
                <Input
                  type="datetime-local"
                  placeholder="Tarih / Saat"
                  value={tempEducation.date}
                  onChange={(e) => setTempEducation((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <Button type="button" variant="secondary" onClick={handleAddEducation}>
                Eğitimi Ekle
              </Button>
            </div>

            {/* Kaydet Butonu */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
