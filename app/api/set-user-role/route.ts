import { adminAuth } from '@/app/firebaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { uid, role } = await request.json();

        await adminAuth.setCustomUserClaims(uid, { role });
        const user = await adminAuth.getUser(uid);

        return NextResponse.json({
            success: true,
            message: 'Rol başarıyla atandı',
            user: {
                uid: user.uid,
                email: user.email,
                role: role
            }
        });

    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'İşlem başarısız' }, { status: 500 });
    }
}
