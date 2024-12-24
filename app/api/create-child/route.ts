import { NextResponse } from 'next/server';
import { db } from '@/app/firebaseConfig'; // Firestore client veya Admin SDK
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';

/**
 * POST /api/create-child
 * Body örneği:
 * {
 *   "name": "Çocuk Ad Soyad",
 *   "birthDate": "2024-01-01",
 *   "schoolName": "X Okulu",
 *   "schoolType": "devlet" | "özel",
 *   "specialEducation": true | false,
 *   "familyNote": "...",
 *   "adminNote": "...",
 *   "expertNote": "...",
 *   "familyId": "...",
 *   "expertId": "..." (opsiyonel),
 *   "sessionFee": "..." (ek veri, örn. seans ücreti)
 *   // Başka ek veriler de ekleyebilirsiniz
 * }
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      // Mevcut alanlar
      name,
      birthDate,
      schoolName,
      schoolType,
      specialEducation,
      familyNote,
      adminNote,
      expertNote,
      familyId,
      expertId,

      // Ek alanlar (örneğin sessionFee)
      sessionFee,
      // ... başka ek alanlar varsa buraya ekleyebilirsiniz
    } = data;

    if (!familyId) {
      return NextResponse.json(
        { error: 'familyId zorunludur.' },
        { status: 400 }
      );
    }

    // 1) children koleksiyonuna doküman ekle
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
      sessionFee: sessionFee || '',

      // Diğer ek verileriniz varsa buraya ekleyebilirsiniz
      // örn. "anotherField: anotherField || '',"

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 2) families/{familyId} dokümanında children array'e child ID ekle
    const familyDocRef = doc(db, 'families', familyId);
    await updateDoc(familyDocRef, {
      children: arrayUnion(childRef.id),
    });

    // 3) Uzman seçildiyse, experts/{expertId} dokümanında children array'e child ID ekle
    if (expertId) {
      const expertDocRef = doc(db, 'experts', expertId);
      await updateDoc(expertDocRef, {
        children: arrayUnion(childRef.id),
      });
    }

    return NextResponse.json({
      success: true,
      childId: childRef.id,
      message: 'Çocuk başarıyla oluşturuldu',
    });
  } catch (err) {
    console.error('Error creating child:', err);
    return NextResponse.json(
      { error: 'Çocuk oluşturulurken bir hata oluştu.' },
      { status: 500 }
    );
  }
}
