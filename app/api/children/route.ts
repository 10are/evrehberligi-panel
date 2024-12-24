import { NextResponse } from 'next/server';
import { db } from '@/app/firebaseConfig';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  arrayUnion,
  serverTimestamp
} from 'firebase/firestore';

/**
 * GET /api/children
 * Tüm çocukları döndürür.
 */
export async function GET() {
  try {
    const snapshot = await getDocs(collection(db, 'children'));
    const children = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data()
    }));
    return NextResponse.json(children);
  } catch (error) {
    console.error('Error fetching children:', error);
    return NextResponse.json({ error: 'Failed to fetch children' }, { status: 500 });
  }
}

/**
 * POST /api/children
 * Body:
 * {
 *   name: string;
 *   birthDate: string;
 *   schoolName: string;
 *   schoolType: "özel" | "devlet";
 *   specialEducation: boolean;
 *   familyNote: string;
 *   adminNote: string;
 *   expertNote: string;
 *   familyId: string;    (zorunlu)
 *   expertId?: string;   (opsiyonel)
 * }
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();

    const {
      name,
      birthDate,
      schoolName,
      schoolType,
      specialEducation,
      familyNote,
      adminNote,
      expertNote,
      familyId,
      expertId
    } = data;

    if (!familyId) {
      return NextResponse.json({ error: 'familyId is required' }, { status: 400 });
    }

    // 1) children koleksiyonuna ekle
    const childRef = await addDoc(collection(db, 'children'), {
      name: name || '',
      birthDate: birthDate || '',
      schoolName: schoolName || '',
      schoolType: schoolType || 'devlet',
      specialEducation: !!specialEducation,
      familyNote: familyNote || '',
      adminNote: adminNote || '',
      expertNote: expertNote || '',
      familyId: familyId,
      expertIds: expertId ? [expertId] : [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // 2) families/{familyId} -> children arrayUnion
    const familyDocRef = doc(db, 'families', familyId);
    await updateDoc(familyDocRef, {
      children: arrayUnion(childRef.id)
    });

    // 3) eğer uzman seçilmişse, experts/{expertId} -> children arrayUnion
    if (expertId) {
      const expertDocRef = doc(db, 'experts', expertId);
      await updateDoc(expertDocRef, {
        children: arrayUnion(childRef.id)
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Child created successfully!',
      childId: childRef.id
    });
  } catch (error) {
    console.error('Error creating child:', error);
    return NextResponse.json({ error: 'Failed to create child' }, { status: 500 });
  }
}
