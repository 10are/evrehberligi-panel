'use client';

import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/app/firebaseConfig'; // Firestore client config
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function CreateFamily() {
  // Form alanları: Ad, Soyad, Doğum Tarihi, İşe Başlama, E-posta, Telefon, Şifre
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    startDate: '',
    email: '',
    phone: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form input değişimleri
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 1) Firebase Auth'ta kullanıcı oluşturmak için API'ye istek
      const response = await fetch('/api/create-family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Bir hata oluştu.');
      }

      // 2) Firestore'a ekle (families/{uid})
      await setDoc(doc(db, 'families', data.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        birthDate: formData.birthDate,
        startDate: formData.startDate,
        email: formData.email,
        phone: formData.phone,
        password: formData.password, // Normalde plaintext saklanmaz!
        role: 'family',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setSuccess('Aile hesabı başarıyla oluşturuldu!');
      setFormData({
        firstName: '',
        lastName: '',
        birthDate: '',
        startDate: '',
        email: '',
        phone: '',
        password: '',
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Aile hesabı oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Yeni Aile Oluştur</CardTitle>
        </CardHeader>
        <CardContent>
          {success && (
            <Alert className="bg-green-50">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">

            {/* Ad */}
            <div>
              <label className="text-sm font-medium">Ad</label>
              <Input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>

            {/* Soyad */}
            <div>
              <label className="text-sm font-medium">Soyad</label>
              <Input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>

            {/* Doğum Tarihi */}
            <div>
              <label className="text-sm font-medium">Doğum Tarihi</label>
              <Input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                required
              />
            </div>

            {/* İşe Başlama Tarihi (Eğer gerekmiyorsa kaldırabilirsiniz) */}
            <div>
              <label className="text-sm font-medium">İşe Başlama Tarihi</label>
              <Input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>

            {/* E-posta */}
            <div>
              <label className="text-sm font-medium">E-posta</label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Telefon */}
            <div>
              <label className="text-sm font-medium">Telefon</label>
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+905XXXXXXXXX formatında"
                required
              />
            </div>

            {/* Şifre */}
            <div>
              <label className="text-sm font-medium">Şifre</label>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                'Aile Oluştur'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
