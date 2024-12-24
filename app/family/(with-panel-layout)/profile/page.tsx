'use client';

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { db } from '@/app/firebaseConfig'; 
import { doc, getDoc } from 'firebase/firestore';

// UI bileşenleriniz (örnek)
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EmergencyContact {
  firstName: string;
  lastName: string;
  phone: string;
}

interface FamilyData {
  // Admin tarafından readonly gösterilecek alanlar
  firstName?: string;
  lastName?: string;
  birthDate?: string; 
  startDate?: string;
  email?: string;
  phone?: string; 
  password?: string;   // Eğer göstermek isterseniz, yoksa kaldırabilirsiniz

  // Yedek İletişim
  emergencyContact?: EmergencyContact;
}

export default function FamilyProfilePage() {
  const userId = Cookies.get('user_id') || ''; // Girişte set edilen cookie
  const [familyData, setFamilyData] = useState<FamilyData>({});
  
  // Form state: Yedek iletişim bilgilerini düzenlemek için
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>({
    firstName: '',
    lastName: '',
    phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sayfa yüklendiğinde, Firestore'dan mevcut verileri çek
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!userId) return;
        const docRef = doc(db, 'families', userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as FamilyData;
          setFamilyData(data);

          // Yedek iletişim alanı
          if (data.emergencyContact) {
            setEmergencyContact({
              firstName: data.emergencyContact.firstName || '',
              lastName: data.emergencyContact.lastName || '',
              phone: data.emergencyContact.phone || '',
            });
          }
        }
      } catch (err) {
        console.error('Error fetching family data:', err);
      }
    };

    fetchData();
  }, [userId]);

  // Form alanlarının değişimini yönet
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmergencyContact((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Formu kaydet (API'ye istek)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!userId) {
        throw new Error('Kullanıcı ID bulunamadı. Lütfen tekrar giriş yapın.');
      }

      const response = await fetch('/api/update-family-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          emergencyContact,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Bilinmeyen bir hata oluştu.');
      }

      setSuccess('Profil bilgileriniz güncellendi!');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Profil güncellenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Aile Profili</CardTitle>
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

          {/* Readonly Alanlar (Admin tarafında girilenler) */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div>
              <Label>Ad</Label>
              <Input value={familyData.firstName || ''} readOnly />
            </div>
            <div>
              <Label>Soyad</Label>
              <Input value={familyData.lastName || ''} readOnly />
            </div>
            <div>
              <Label>Doğum Tarihi</Label>
              <Input
                type="date"
                value={familyData.birthDate || ''}
                readOnly
              />
            </div>
            <div>
              <Label>İşe Başlama Tarihi</Label>
              <Input
                type="date"
                value={familyData.startDate || ''}
                readOnly
              />
            </div>
            <div>
              <Label>E-posta</Label>
              <Input
                type="email"
                value={familyData.email || ''}
                readOnly
              />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input
                type="tel"
                value={familyData.phone || ''}
                readOnly
              />
            </div>

            {/* (Opsiyonel) Şifre alanı da göstermek isterseniz */}
            {familyData.password && (
              <div>
                <Label>Şifre</Label>
                <Input
                  type="password"
                  value={familyData.password || ''}
                  readOnly
                />
              </div>
            )}
          </div>

          {/* Düzenlenebilir Alan: Yedek İletişim */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Yedek Ad</Label>
                <Input
                  name="firstName"
                  value={emergencyContact.firstName}
                  onChange={handleChange}
                  placeholder="Yedek iletişim adı"
                />
              </div>
              <div>
                <Label>Yedek Soyad</Label>
                <Input
                  name="lastName"
                  value={emergencyContact.lastName}
                  onChange={handleChange}
                  placeholder="Yedek iletişim soyadı"
                />
              </div>
              <div>
                <Label>Yedek Telefon</Label>
                <Input
                  type="tel"
                  name="phone"
                  value={emergencyContact.phone}
                  onChange={handleChange}
                  placeholder="+905XXXXXXXXX"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
