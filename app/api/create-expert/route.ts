import { adminAuth } from '@/app/firebaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { email, password } = data;

    // 1. Firebase Auth'da kullanıcı oluştur
    const userRecord = await adminAuth.createUser({
      email,
      password,
      emailVerified: false, // İsterseniz true yapabilirsiniz
    });

    // 2. Custom claims ekle
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'expert' });

    return NextResponse.json({
      success: true,
      uid: userRecord.uid,
      message: 'Uzman başarıyla oluşturuldu',
    });
  } catch (error) {
    console.error('Error creating expert:', error);
    return NextResponse.json(
      { error: 'Uzman oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
}
