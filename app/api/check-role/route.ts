import { adminAuth } from '@/app/firebaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { uid } = await request.json();

        // Kullanıcıyı getir
        const user = await adminAuth.getUser(uid);
        
        // Custom claims'den rolü al
        const customClaims = user.customClaims || {};
        const role = customClaims.role;

        return NextResponse.json({
            success: true,
            user: {
                uid: user.uid,
                email: user.email,
                role: role
            }
        });

    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 500 });
    }
}
