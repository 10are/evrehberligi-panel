import { NextResponse } from 'next/server';
import { db } from '@/app/firebaseConfig'; // Client config. Gerçek projede Admin SDK tercih edilebilir
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Uzmanın kendi profilini güncellemesi için kullandığımız endpoint.
 *
 * POST Body:
 * {
 *   userId: string;
 *   isCAP: boolean;
 *   capUniversity: string;
 *   capDepartment: string;
 *   capLevel: string;
 *
 *   isYANDAL: boolean;
 *   yandalUniversity: string;
 *   yandalDepartment: string;
 *   yandalLevel: string;
 *
 *   isAcikogretim: boolean;
 *   acikogretimUniversity: string;
 *   acikogretimDepartment: string;
 *   acikogretimLevel: string;
 *
 *   activeInstitution: string;
 *   city: string;
 *   district: string;
 *   foreignLanguage: string;
 *   educations: Array<{ name: string; institution: string; date: string }>;
 *   photoURL: string; // Firebase Storage URL
 * }
 */

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      userId,
      // ÇAP
      isCAP,
      capUniversity,
      capDepartment,
      capLevel,

      // Yandal
      isYANDAL,
      yandalUniversity,
      yandalDepartment,
      yandalLevel,

      // Açıköğretim
      isAcikogretim,
      acikogretimUniversity,
      acikogretimDepartment,
      acikogretimLevel,

      // Diğer alanlar
      activeInstitution,
      city,
      district,
      foreignLanguage,
      educations,
      photoURL
    } = data;

    if (!userId) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 400 });
    }

    await setDoc(
      doc(db, 'experts', userId),
      {
        // ÇAP
        isCAP: !!isCAP,
        capUniversity: capUniversity || '',
        capDepartment: capDepartment || '',
        capLevel: capLevel || '',

        // Yandal
        isYANDAL: !!isYANDAL,
        yandalUniversity: yandalUniversity || '',
        yandalDepartment: yandalDepartment || '',
        yandalLevel: yandalLevel || '',

        // Açıköğretim
        isAcikogretim: !!isAcikogretim,
        acikogretimUniversity: acikogretimUniversity || '',
        acikogretimDepartment: acikogretimDepartment || '',
        acikogretimLevel: acikogretimLevel || '',

        // Diğer
        activeInstitution: activeInstitution || '',
        city: city || '',
        district: district || '',
        foreignLanguage: foreignLanguage || '',
        educations: educations || [],
        photoURL: photoURL || '',

        // Son güncelleme
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Profil bilgileri güncellendi.'
    });
  } catch (error) {
    console.error('Error updating expert profile:', error);
    return NextResponse.json(
      { error: 'Profil güncelleme sırasında bir hata oluştu.' },
      { status: 500 }
    );
  }
}
