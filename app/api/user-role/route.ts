import { NextResponse } from 'next/server';
import { adminAuth } from '@/app/firebaseAdmin'; // Firebase Admin SDK başlatılmış olmalı

export async function POST(request: Request) {
    try {
        const { action, email, uid, role } = await request.json();

        if (!action) {
            return NextResponse.json({ error: 'Action belirtmek gerekli' }, { status: 400 });
        }

        if (action === 'check') {
            if (!email) {
                return NextResponse.json({ error: 'Email gerekli' }, { status: 400 });
            }

            // Kullanıcıyı e-posta ile bul
            const user = await adminAuth.getUserByEmail(email);
            const customClaims = user.customClaims || {};
            const role = customClaims.role || 'Rol atanmadı';

            return NextResponse.json({
                success: true,
                user: {
                    uid: user.uid,
                    email: user.email,
                    role: role,
                },
            });
        } else if (action === 'set') {
            if (!uid || !role) {
                return NextResponse.json({ error: 'UID ve rol gerekli' }, { status: 400 });
            }

            // Rol atama
            await adminAuth.setCustomUserClaims(uid, { role });
            const user = await adminAuth.getUser(uid);

            return NextResponse.json({
                success: true,
                message: `Rol başarıyla ${role} olarak atandı`,
                user: {
                    uid: user.uid,
                    email: user.email,
                    role: role,
                },
            });
        } else {
            return NextResponse.json({ error: 'Geçersiz action' }, { status: 400 });
        }
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
        }

        console.error('Hata:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
