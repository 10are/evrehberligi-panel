'use client';

import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/app/firebaseConfig'; // Firestore client config
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function CreateExpert() {
  // Form alanları: Ad, Soyad, Doğum Tarihi, İşe Başlama, E-posta, Şifre
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    startDate: '',
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form input'larının değişimini yönetir
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
      // 1) API endpoint'ine istek at (Firebase Auth'da kullanıcı oluşturma + custom claim)
      const response = await fetch('/api/create-expert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Bir hata oluştu.');
      }

      // 2) Firestore'a ekle (experts koleksiyonuna, doc ID = uid)
      await setDoc(doc(db, 'experts', data.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        birthDate: formData.birthDate,
        startDate: formData.startDate,
        email: formData.email,
        password: formData.password, // Güvenlik riskine dikkat!
        createdAt: new Date(),
        updatedAt: new Date(),
        // Ek fields:
        role: 'expert',
        status: 'active',
      });

      setSuccess('Uzman başarıyla oluşturuldu!');
      setFormData({
        firstName: '',
        lastName: '',
        birthDate: '',
        startDate: '',
        email: '',
        password: '',
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Uzman oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Yeni Uzman Oluştur</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Başarılı mesajı */}
          {success && (
            <Alert className="bg-green-50">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Hata mesajı */}
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

            {/* İşe Başlama Tarihi */}
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

            {/* Gönder butonu */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                'Uzman Oluştur'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
