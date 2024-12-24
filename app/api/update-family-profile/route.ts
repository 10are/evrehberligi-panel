import { NextResponse } from 'next/server';
import { db } from '@/app/firebaseConfig'; // Client config. Gerçek projede Admin SDK kullanımı da tercih edilebilir.
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * POST /api/update-family-profile
 * Örnek body:
 * {
 *   "userId": "uid",   // Cookie veya token'dan gelen userId
 *   "emergencyContact": {
 *       "firstName": "...",
 *       "lastName": "...",
 *       "phone": "..."
 *   }
 * }
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { userId, emergencyContact } = data;

    if (!userId) {
      return NextResponse.json(
        { error: 'Kullanıcı ID bulunamadı.' },
        { status: 400 }
      );
    }

    // Firestore: families/{userId} dokümanını güncelle
    await setDoc(
      doc(db, 'families', userId),
      {
        // Yedek iletişim bilgileri
        emergencyContact: {
          firstName: emergencyContact?.firstName || '',
          lastName: emergencyContact?.lastName || '',
          phone: emergencyContact?.phone || '',
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Profil bilgileri güncellendi.',
    });
  } catch (error) {
    console.error('Error updating family profile:', error);
    return NextResponse.json(
      { error: 'Profil güncellemesi sırasında bir hata oluştu.' },
      { status: 500 }
    );
  }
}
