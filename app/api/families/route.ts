import { NextResponse } from 'next/server';
import { db } from '@/app/firebaseConfig'; // Firestore Client SDK veya Admin SDK
import { collection, getDocs } from 'firebase/firestore';

/**
 * GET /api/families
 * Tüm aileleri döndürür.
 */
export async function GET() {
  try {
    const snapshot = await getDocs(collection(db, 'families'));
    const families = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return NextResponse.json(families);
  } catch (error) {
    console.error('Error fetching families:', error);
    return NextResponse.json({ error: 'Failed to fetch families' }, { status: 500 });
  }
}
