'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

/** Aile tipi */
interface Family {
  id: string;
  firstName?: string;
  lastName?: string;
}

/** Uzman tipi */
interface Expert {
  id: string;
  firstName?: string;
  lastName?: string;
}

/** Çocuk tipi */
interface ChildData {
  id: string;
  name: string;
  birthDate: string;
  schoolName: string;
  schoolType: 'özel' | 'devlet';
  specialEducation: boolean;
  familyNote: string;
  adminNote: string;
  expertNote: string;
  familyId: string;
  expertIds: string[];
  sessionFee: string; // Eklenen alan: seans ücreti
}

/** Form state tipi */
interface ChildFormData {
  name: string;
  birthDate: string;
  schoolName: string;
  schoolType: 'özel' | 'devlet';
  specialEducation: boolean;
  familyNote: string;
  adminNote: string;
  expertNote: string;
  familyId: string; // zorunlu
  expertId: string; // opsiyonel
  sessionFee: string; // seans ücreti
}

export default function ChildrenAdminPage() {
  // Listeler
  const [families, setFamilies] = useState<Family[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [childrenList, setChildrenList] = useState<ChildData[]>([]);

  // Form + editMode
  const [formData, setFormData] = useState<ChildFormData>({
    name: '',
    birthDate: '',
    schoolName: '',
    schoolType: 'devlet',
    specialEducation: false,
    familyNote: '',
    adminNote: '',
    expertNote: '',
    familyId: '',
    expertId: '',
    sessionFee: '',
  });
  const [editMode, setEditMode] = useState<string>(''); // "" => create, dolu => update

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /**
   * Sayfa ilk açıldığında: families, experts, children verileri çek
   */
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // 1) Aileler
        let res = await fetch('/api/families');
        if (!res.ok) throw new Error('Aileler alınamadı');
        let data = await res.json();
        setFamilies(data);

        // 2) Uzmanlar
        res = await fetch('/api/experts');
        if (!res.ok) throw new Error('Uzmanlar alınamadı');
        data = await res.json();
        setExperts(data);

        // 3) Mevcut çocuklar
        res = await fetch('/api/children');
        if (!res.ok) throw new Error('Çocuklar alınamadı');
        data = await res.json();
        setChildrenList(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Veriler alınırken hata oluştu.');
      }
    };
    fetchAllData();
  }, []);

  // Form alanları değiştikçe
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement & HTMLTextAreaElement;
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  /** Formu sıfırlama ve edit modunu kapatma */
  const resetForm = () => {
    setFormData({
      name: '',
      birthDate: '',
      schoolName: '',
      schoolType: 'devlet',
      specialEducation: false,
      familyNote: '',
      adminNote: '',
      expertNote: '',
      familyId: '',
      expertId: '',
      sessionFee: '',
    });
    setEditMode('');
  };

  /**
   * Düzenle butonuna tıklanırsa: form doldur + editMode = child.id
   */
  const handleEdit = (child: ChildData) => {
    setEditMode(child.id);
    setFormData({
      name: child.name,
      birthDate: child.birthDate,
      schoolName: child.schoolName,
      schoolType: child.schoolType,
      specialEducation: child.specialEducation,
      familyNote: child.familyNote,
      adminNote: child.adminNote,
      expertNote: child.expertNote,
      familyId: child.familyId,
      expertId: child.expertIds.length ? child.expertIds[0] : '',
      sessionFee: child.sessionFee || '',
    });
  };

  /**
   * Düzenleme iptal: form reset, editMode kapat
   */
  const handleCancel = () => {
    resetForm();
  };

  /**
   * Form submit => create veya update
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!formData.familyId) {
        throw new Error('Aile seçmek zorunludur.');
      }

      if (!editMode) {
        // ---- Yeni Oluşturma ----
        const response = await fetch('/api/create-child', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Çocuk oluşturulurken hata oluştu.');
        }

        setSuccess('Çocuk başarıyla oluşturuldu!');

        // Local childrenList ekleme
        setChildrenList((prev) => [
          ...prev,
          {
            id: data.childId,
            name: formData.name,
            birthDate: formData.birthDate,
            schoolName: formData.schoolName,
            schoolType: formData.schoolType,
            specialEducation: formData.specialEducation,
            familyNote: formData.familyNote,
            adminNote: formData.adminNote,
            expertNote: formData.expertNote,
            familyId: formData.familyId,
            expertIds: formData.expertId ? [formData.expertId] : [],
            sessionFee: formData.sessionFee,
          },
        ]);
      } else {
        // ---- Güncelleme ----
        const response = await fetch('/api/update-child', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            childId: editMode,
            ...formData,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Çocuk güncellenirken hata oluştu.');
        }

        setSuccess('Çocuk bilgileri güncellendi!');

        // Local childrenList güncelleme
        setChildrenList((prev) =>
          prev.map((child) =>
            child.id === editMode
              ? {
                  ...child,
                  name: formData.name,
                  birthDate: formData.birthDate,
                  schoolName: formData.schoolName,
                  schoolType: formData.schoolType,
                  specialEducation: formData.specialEducation,
                  familyNote: formData.familyNote,
                  adminNote: formData.adminNote,
                  expertNote: formData.expertNote,
                  familyId: formData.familyId,
                  expertIds: formData.expertId ? [formData.expertId] : [],
                  sessionFee: formData.sessionFee,
                }
              : child
          )
        );
      }

      // Formu sıfırla, editMod kapat
      resetForm();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'İşlem sırasında hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* TÜM ÇOCUKLARI LİSTELE */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Tüm Çocuklar</CardTitle>
        </CardHeader>
        <CardContent>
          {childrenList.length === 0 ? (
            <p>Hiç çocuk kaydı yok.</p>
          ) : (
            <ul className="space-y-2">
              {childrenList.map((child) => (
                <li
                  key={child.id}
                  className="p-3 border rounded flex items-center justify-between"
                >
                  <div>
                    <strong>{child.name}</strong> -{' '}
                    <span className="italic text-sm">
                      {child.schoolName} ({child.schoolType})
                    </span>
                    <br />
                    <span className="text-gray-600 text-sm">
                      Doğum: {child.birthDate} | Seans Ücreti: {child.sessionFee} | Aile ID: {child.familyId}{' '}
                      | Uzman: {(child.expertIds ?? []).join(', ')}
                    </span>
                  </div>
                  <Button variant="outline" onClick={() => handleEdit(child)}>
                    Düzenle
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* OLUŞTUR / DÜZENLE FORMU */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {editMode ? 'Çocuk Güncelle' : 'Yeni Çocuk Oluştur'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {success && (
            <Alert className="bg-green-50 mb-4">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            {/* Ad Soyad */}
            <div>
              <Label>Çocuğun Ad Soyad</Label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Doğum Tarihi */}
            <div>
              <Label>Doğum Tarihi</Label>
              <Input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                required
              />
            </div>

            {/* Okul Adı */}
            <div>
              <Label>Okul Adı</Label>
              <Input
                name="schoolName"
                value={formData.schoolName}
                onChange={handleChange}
              />
            </div>

            {/* Okul Türü */}
            <div>
              <Label>Okul Türü</Label>
              <select
                name="schoolType"
                value={formData.schoolType}
                onChange={handleChange}
                className="border rounded px-2 py-1 w-full"
              >
                <option value="devlet">Devlet</option>
                <option value="özel">Özel</option>
              </select>
            </div>

            {/* Özel Eğitim */}
            <div className="flex items-center gap-2">
              <Input
                type="checkbox"
                name="specialEducation"
                checked={formData.specialEducation}
                onChange={handleChange}
              />
              <Label className="mt-1">Özel Eğitim Alıyor</Label>
            </div>

            {/* Seans Ücreti */}
            <div>
              <Label>Seans Ücreti</Label>
              <Input
                name="sessionFee"
                type="text"
                placeholder="Örn. 150"
                value={formData.sessionFee}
                onChange={handleChange}
              />
            </div>

            {/* Aile Seçimi */}
            <div>
              <Label>Ailesi (Zorunlu)</Label>
              <select
                name="familyId"
                value={formData.familyId}
                onChange={handleChange}
                className="border rounded px-2 py-1 w-full"
                required
              >
                <option value="">-- Aile Seçiniz --</option>
                {families.map((fam) => (
                  <option key={fam.id} value={fam.id}>
                    {fam.firstName} {fam.lastName} (ID: {fam.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Uzman Seçimi */}
            <div>
              <Label>Uzman (Opsiyonel)</Label>
              <select
                name="expertId"
                value={formData.expertId}
                onChange={handleChange}
                className="border rounded px-2 py-1 w-full"
              >
                <option value="">-- Seçilmedi --</option>
                {experts.map((exp) => (
                  <option key={exp.id} value={exp.id}>
                    {exp.firstName} {exp.lastName} (ID: {exp.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Aile Notu */}
            <div className="col-span-2">
              <Label>Aile Notu</Label>
              <Textarea
                name="familyNote"
                value={formData.familyNote}
                onChange={handleChange}
              />
            </div>

            {/* Admin Notu */}
            <div className="col-span-2">
              <Label>Admin Notu</Label>
              <Textarea
                name="adminNote"
                value={formData.adminNote}
                onChange={handleChange}
              />
            </div>

            {/* Uzman Notu */}
            <div className="col-span-2">
              <Label>Uzman Notu</Label>
              <Textarea
                name="expertNote"
                value={formData.expertNote}
                onChange={handleChange}
              />
            </div>

            {/* Butonlar */}
            <div className="col-span-2 flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading
                  ? editMode
                    ? 'Güncelleniyor...'
                    : 'Oluşturuluyor...'
                  : editMode
                  ? 'Kaydet'
                  : 'Çocuğu Oluştur'}
              </Button>
              {editMode && (
                <Button variant="outline" onClick={handleCancel}>
                  İptal
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
