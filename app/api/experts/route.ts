import { NextResponse } from 'next/server';
import { db } from '@/app/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

/**
 * GET /api/experts
 * Tüm uzmanları döndürür.
 */
export async function GET() {
  try {
    const snapshot = await getDocs(collection(db, 'experts'));
    const experts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return NextResponse.json(experts);
  } catch (error) {
    console.error('Error fetching experts:', error);
    return NextResponse.json({ error: 'Failed to fetch experts' }, { status: 500 });
  }
}
