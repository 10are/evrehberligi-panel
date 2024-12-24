import { NextResponse } from 'next/server';
import { db } from '@/app/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

/**
 * GET /api/expert-children?expertId=xyz
 * expertId parametresiyle, children koleksiyonunda expertIds içinde "xyz" olanları döndürür.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const expertId = searchParams.get('expertId');

    if (!expertId) {
      return NextResponse.json(
        { error: 'expertId parametresi gerekli' },
        { status: 400 }
      );
    }

    // Firestore sorgusu: children koleksiyonunda, expertIds alanı "array-contains" expertId
    const childrenRef = collection(db, 'children');
    const q = query(childrenRef, where('expertIds', 'array-contains', expertId));
    const snapshot = await getDocs(q);

    const childrenData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(childrenData);
  } catch (error) {
    console.error('Error fetching expert children:', error);
    return NextResponse.json(
      { error: 'Uzman çocukları alınırken hata oluştu.' },
      { status: 500 }
    );
  }
}
