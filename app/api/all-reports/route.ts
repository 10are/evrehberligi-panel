import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/firebaseConfig';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy 
} from 'firebase/firestore';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  // Kullanıcı rolü kontrolü
  const userRole = cookies().get('user_role')?.value;
  
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
  }

  try {
    const reportsRef = collection(db, 'reports');
    
    // Tüm raporları oluşturulma tarihine göre sırala
    const q = query(reportsRef, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    
    // Tüm alanları içeren raporları döndür
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
