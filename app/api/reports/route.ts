// app/api/reports/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const user_id = cookies().get('user_id')?.value;

  if (!user_id) {
    return NextResponse.json({ error: 'Kullanıcı kimliği bulunamadı' }, { status: 401 });
  }

  try {
    const reportsRef = collection(db, 'reports');
    const q = query(reportsRef, where('expertId', '==', user_id));
    
    const querySnapshot = await getDocs(q);
    
    const reports = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Raporları çekerken hata oluştu:', error);
    return NextResponse.json({ error: 'Raporlar yüklenemedi' }, { status: 500 });
  }
}