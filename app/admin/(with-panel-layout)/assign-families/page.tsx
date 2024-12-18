// app/admin/assign-families/page.tsx
'use client';

import { useState } from 'react';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '@/app/firebaseConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from "lucide-react";

interface AssignmentFormData {
  expertEmail: string;
  familyEmails: string;
}

export default function AssignFamilies() {
  const [formData, setFormData] = useState<AssignmentFormData>({
    expertEmail: '',
    familyEmails: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Uzmanı bul
      const expertQuery = query(
        collection(db, 'experts'),
        where('email', '==', formData.expertEmail.trim())
      );
      const expertSnapshot = await getDocs(expertQuery);

      if (expertSnapshot.empty) {
        throw new Error('Uzman bulunamadı');
      }

      const expertDoc = expertSnapshot.docs[0];
      const expertId = expertDoc.id;
      const expertData = expertDoc.data();

      // Aileleri array'e ayır
      const familyEmailList = formData.familyEmails
        .split(',')
        .map(email => email.trim())
        .filter(email => email !== '');

      // Her aile için işlem yap
      for (const familyEmail of familyEmailList) {
        const familyQuery = query(
          collection(db, 'families'),
          where('email', '==', familyEmail)
        );
        const familySnapshot = await getDocs(familyQuery);

        if (!familySnapshot.empty) {
          const familyDoc = familySnapshot.docs[0];
          const familyId = familyDoc.id;
          const familyData = familyDoc.data();

          // Uzmanın families koleksiyonuna aileyi ekle
          await setDoc(
            doc(db, 'experts', expertId, 'families', familyId),
            {
              ...familyData,
              assignedAt: new Date(),
              status: 'active'
            }
          );

          // Ailenin assignedExperts koleksiyonuna uzmanı ekle
          await setDoc(
            doc(db, 'families', familyId, 'assignedExperts', expertId),
            {
              ...expertData,
              assignedAt: new Date(),
              status: 'active'
            }
          );
        }
      }

      setSuccess('Eşleştirme başarıyla tamamlandı!');
      setFormData({
        expertEmail: '',
        familyEmails: ''
      });

    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Uzmana Aile Ata</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Uzman E-posta</label>
              <Input
                type="email"
                value={formData.expertEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, expertEmail: e.target.value }))}
                placeholder="uzman@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Aile E-postaları
                <span className="text-sm text-gray-500 ml-1">
                  (Virgülle ayırarak birden fazla aile ekleyebilirsiniz)
                </span>
              </label>
              <textarea
                className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.familyEmails}
                onChange={(e) => setFormData(prev => ({ ...prev, familyEmails: e.target.value }))}
                placeholder="aile1@email.com, aile2@email.com"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atama Yapılıyor...
                </>
              ) : (
                'Aileleri Ata'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}