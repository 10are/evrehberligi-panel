// app/expert/families/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/app/firebaseConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from "lucide-react";
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

interface FamilyData {
  id: string;
  familyName: string;
  email: string;
  phone: string;
  address: {
    fullAddress: string;
    district: string;
    city: string;
  };
}

export default function ExpertFamilies() {
  const [families, setFamilies] = useState<FamilyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchFamilies = async () => {
      try {
        const expertId = Cookies.get('user_id');
        if (!expertId) {
          throw new Error('Oturum bulunamadı');
        }

        const familiesRef = collection(db, 'experts', expertId, 'families');
        const familiesSnapshot = await getDocs(familiesRef);
        const familiesData = familiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FamilyData[];

        setFamilies(familiesData);
      } catch (err) {
        console.error("Error:", err);
        setError('Aileler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchFamilies();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Atanmış Ailelerim</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {families.map((family) => (
              <Card 
                key={family.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/expert/families/${family.id}`)}
              >
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{family.familyName}</h3>
                      <p className="text-sm text-gray-500">
                        {family.address.district}, {family.address.city}
                      </p>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><span className="font-medium">Telefon:</span> {family.phone}</p>
                      <p><span className="font-medium">E-posta:</span> {family.email}</p>
                      <p><span className="font-medium">Adres:</span> {family.address.fullAddress}</p>
                    </div>
                    <Button className="w-full">Detayları Görüntüle</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}