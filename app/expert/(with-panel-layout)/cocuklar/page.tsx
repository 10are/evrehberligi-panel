'use client';

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ChildData {
  id: string;
  name?: string;
  birthDate?: string;
  schoolName?: string;
  schoolType?: string;       // "özel" | "devlet"
  specialEducation?: boolean;
  sessionFee?: string;       // Örneğin "150"
  familyNote?: string;
  adminNote?: string;
  expertNote?: string;
  familyId?: string;
  expertIds?: string[];
  createdAt?: any;           // Firestore Timestamp
  updatedAt?: any;           // Firestore Timestamp
}

export default function ExpertChildrenPage() {
  const [childrenList, setChildrenList] = useState<ChildData[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        setLoading(true);
        setError('');

        // 1) Cookie'den uzman ID'si al
        const expertId = Cookies.get('user_id');
        if (!expertId) {
          throw new Error('Uzman ID bulunamadı. Lütfen tekrar giriş yapın.');
        }

        // 2) /api/expert-children?expertId=... ile verileri çek
        const res = await fetch(`/api/expert-children?expertId=${expertId}`);
        if (!res.ok) {
          throw new Error('Çocuklar alınırken hata oluştu.');
        }
        const data = await res.json();
        setChildrenList(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Bilinmeyen bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, []);

  // Firestore timestamp'i okunabilir tarih formatına dönüştürmek (opsiyonel)
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    // Eğer Firestore Timestamp ise _seconds var:
    if (timestamp._seconds) {
      const date = new Date(timestamp._seconds * 1000);
      return date.toLocaleString(); // istediğiniz formata göre ayarlayabilirsiniz
    }
    return '';
  };

  return (
    <div className="container mx-auto p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Uzman Çocukları</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <p>Yükleniyor...</p>
          ) : childrenList.length === 0 ? (
            <p>Hiç çocuk bulunamadı.</p>
          ) : (
            <ul className="space-y-4">
              {childrenList.map((child) => (
                <li key={child.id} className="p-3 border rounded bg-white">
                  <p>
                    <strong>Ad Soyad:</strong> {child.name}
                  </p>
                  <p>
                    <strong>Doğum Tarihi:</strong> {child.birthDate}
                  </p>
                  <p>
                    <strong>Okul:</strong> {child.schoolName} ({child.schoolType})
                  </p>
                  <p>
                    <strong>Özel Eğitim:</strong>{' '}
                    {child.specialEducation ? 'Evet' : 'Hayır'}
                  </p>
                  <p>
                    <strong>Seans Ücreti:</strong> {child.sessionFee}
                  </p>
                  <p>
                    <strong>Aile Notu:</strong> {child.familyNote}
                  </p>
                  <p>
                    <strong>Admin Notu:</strong> {child.adminNote}
                  </p>
                  <p>
                    <strong>Uzman Notu:</strong> {child.expertNote}
                  </p>
                  <p>
                    <strong>Family ID:</strong> {child.familyId}
                  </p>
                  <p>
                    <strong>Expert IDs:</strong>{' '}
                    {(child.expertIds ?? []).join(', ')}
                  </p>
                  <p>
                    <strong>Oluşturulma Tarihi:</strong>{' '}
                    {formatTimestamp(child.createdAt)}
                  </p>
                  <p>
                    <strong>Güncellenme Tarihi:</strong>{' '}
                    {formatTimestamp(child.updatedAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
