import { NextResponse } from 'next/server';
import { db } from '@/app/firebaseConfig';
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { childId, expertId, oldExpertId, ...updateData } = body;

    if (!childId) {
      return NextResponse.json({ error: 'childId gerekli' }, { status: 400 });
    }

    // 1) Çocuğun Firestore kaydını güncelle
    const childRef = doc(db, 'children', childId);
    await updateDoc(childRef, {
      ...updateData, // (name, birthDate, schoolName, vs.)
      // expertIds alanını da güncelliyoruz:
      expertIds: expertId ? [expertId] : [],
      updatedAt: new Date()
    });

    // 2) Yeni uzman seçildiyse => experts/{expertId}.children içine arrayUnion
    if (expertId) {
      const newExpertRef = doc(db, 'experts', expertId);
      await updateDoc(newExpertRef, {
        children: arrayUnion(childId)
      });
    }

    // 3) Eğer daha önce farklı bir uzman atanmışsa => eski uzmanı arrayRemove
    //    (Örnek: child.expertIds[0] = oldExpertId)
    if (oldExpertId && oldExpertId !== expertId) {
      const oldExpertRef = doc(db, 'experts', oldExpertId);
      await updateDoc(oldExpertRef, {
        children: arrayRemove(childId)
      });
    }

    return NextResponse.json({ success: true, message: 'Child updated' });
  } catch (error) {
    console.error('Update child error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
