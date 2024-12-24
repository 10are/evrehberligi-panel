import { adminAuth } from '@/app/firebaseAdmin'; // Admin SDK bağlantısını varsayıyoruz
import { NextResponse } from 'next/server';

/**
 * POST /api/create-family
 * Body örneği:
 * {
 *   "email": "...",
 *   "password": "...",
 *   "phone": "..."   // Ek olarak aile için telefon numarası
 *   // firstName, lastName gibi alanlar opsiyonel, isterseniz ekleyebilirsiniz
 * }
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { email, password, phone } = data;

    // 1) Firebase Auth'ta kullanıcı oluştur
    //    phoneNumber alanı eklemek isterseniz phoneNumber: phone
    const userRecord = await adminAuth.createUser({
      email,
      password,
      phoneNumber: phone, 
      emailVerified: false,
    });

    // 2) Kullanıcıya custom claim ekle
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'family' });

    // 3) API cevabı
    return NextResponse.json({
      success: true,
      uid: userRecord.uid,
      message: 'Aile hesabı başarıyla oluşturuldu'
    });
    
  } catch (error) {
    console.error('Error creating family:', error);
    return NextResponse.json(
      { error: 'Aile oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
}
