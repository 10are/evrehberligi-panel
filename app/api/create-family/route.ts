// app/api/create-family/route.ts
import { adminAuth } from '@/app/firebaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { email, password, ...userData } = data;

    // 1. Firebase Auth'da kullanıcı oluştur
    const userRecord = await adminAuth.createUser({
      email,
      password,
      emailVerified: false,
    });

    // 2. Custom claims ekle
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'family' });

    return NextResponse.json({
      success: true,
      uid: userRecord.uid,
      message: 'Aile başarıyla oluşturuldu'
    });

  } catch (error) {
    console.error('Error creating family:', error);
    return NextResponse.json(
      { error: 'Aile oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
}