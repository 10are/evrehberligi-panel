
'use client';

import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/app/firebaseConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCircle, Loader2, Plus, Trash2 } from "lucide-react";

interface Child {
  id: string;
  fullName: string;
  birthDate: string;
  age: string;
  gender: 'male' | 'female' | 'other';
  specialConditions: string;
  educationStatus: string;
  healthStatus: string;
}

interface FamilyFormData {
  familyName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  district: string;
  city: string;
  children: Child[];
  notes: string;
  motherName: string;
  motherPhone: string;
  fatherName: string;
  fatherPhone: string;
  photoURL: string;
}

const initialChildData = (): Child => ({
  id: crypto.randomUUID(),
  fullName: '',
  birthDate: '',
  age: '',
  gender: 'male',
  specialConditions: '',
  educationStatus: '',
  healthStatus: ''
});

const initialFormData: FamilyFormData = {
  familyName: '',
  email: '',
  password: '',
  phone: '',
  address: '',
  district: '',
  city: '',
  children: [initialChildData()],
  notes: '',
  motherName: '',
  motherPhone: '',
  fatherName: '',
  fatherPhone: '',
  photoURL: ''
};

export default function CreateFamily() {
  const [formData, setFormData] = useState<FamilyFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Fotoğraf boyutu 5MB\'dan küçük olmalıdır');
        return;
      }
      setPhotoFile(file);
      const previewURL = URL.createObjectURL(file);
      setPhotoPreview(previewURL);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleChildChange = (childId: string, field: keyof Child, value: string) => {
    setFormData(prev => ({
      ...prev,
      children: prev.children.map(child => 
        child.id === childId ? { ...child, [field]: value } : child
      )
    }));
  };

  const addChild = () => {
    setFormData(prev => ({
      ...prev,
      children: [...prev.children, initialChildData()]
    }));
  };

  const removeChild = (childId: string) => {
    setFormData(prev => ({
      ...prev,
      children: prev.children.filter(child => child.id !== childId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let photoURL = '';
      
      if (photoFile) {
        const storageRef = ref(storage, `family-photos/${Date.now()}-${photoFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, photoFile);

        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            throw error;
          }
        );

        await uploadTask;
        photoURL = await getDownloadURL(storageRef);
      }

      const response = await fetch('/api/create-family', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, photoURL }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Bir hata oluştu');
      }

      await setDoc(doc(db, 'families', data.uid), {
        familyName: formData.familyName,
        email: formData.email,
        phone: formData.phone,
        photoURL: photoURL,
        address: {
          fullAddress: formData.address,
          district: formData.district,
          city: formData.city
        },
        parents: {
          mother: {
            name: formData.motherName,
            phone: formData.motherPhone
          },
          father: {
            name: formData.fatherName,
            phone: formData.fatherPhone
          }
        },
        children: formData.children,
        notes: formData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
        active: true,
        status: 'active'
      });

      setSuccess('Aile başarıyla oluşturuldu!');
      setFormData(initialFormData);
      setPhotoFile(null);
      setPhotoPreview('');
      setUploadProgress(0);

    } catch (err) {
      console.error("Error:", err);
      setError('Aile oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Yeni Aile Oluştur</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {success && (
              <Alert className="bg-green-50">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Aile Temel Bilgileri */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Aile Bilgileri</h3>

              {/* Aile Fotoğrafı */}
              <div className="flex items-center gap-4">
                <div className="relative w-32 h-32">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Aile fotoğrafı önizleme"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center">
                      <UserCircle className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                      <span className="text-white">{Math.round(uploadProgress)}%</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mb-2"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                  >
                    Fotoğraf Seç
                  </Button>
                  <Input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                  <p className="text-sm text-gray-500">
                    JPG, PNG veya GIF - Max 5MB
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Aile Adı</label>
                  <Input
                    name="familyName"
                    value={formData.familyName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Telefon</label>
                  <Input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">E-posta</label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Şifre</label>
                <Input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Ebeveyn Bilgileri */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Ebeveyn Bilgileri</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Anne Adı</label>
                  <Input
                    name="motherName"
                    value={formData.motherName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Anne Telefon</label>
                  <Input
                    name="motherPhone"
                    value={formData.motherPhone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Baba Adı</label>
                  <Input
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Baba Telefon</label>
                  <Input
                    name="fatherPhone"
                    value={formData.fatherPhone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Adres Bilgileri */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Adres Bilgileri</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium">Adres</label>
                <Textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">İlçe</label>
                  <Input
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Şehir</label>
                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Çocuk Bilgileri */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Çocuk Bilgileri</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addChild}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Çocuk Ekle
                </Button>
              </div>

              {formData.children.map((child, index) => (
                <Card key={child.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Çocuk {index + 1}</h4>
                        {formData.children.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeChild(child.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Ad Soyad</label>
                          <Input
                            value={child.fullName}
                            onChange={(e) => handleChildChange(child.id, 'fullName', e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Doğum Tarihi</label>
                          <Input
                            type="date"
                            value={child.birthDate}
                            onChange={(e) => handleChildChange(child.id, 'birthDate', e.target.value)}
                            required
                          />
                        </div>
 
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Yaş</label>
                          <Input
                            value={child.age}
                            onChange={(e) => handleChildChange(child.id, 'age', e.target.value)}
                            required
                          />
                        </div>
 
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Cinsiyet</label>
                          <Select
                            value={child.gender}
                            onValueChange={(value) => handleChildChange(child.id, 'gender', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Cinsiyet seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Erkek</SelectItem>
                              <SelectItem value="female">Kız</SelectItem>
                              <SelectItem value="other">Diğer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
 
                        <div className="space-y-2 col-span-2">
                          <label className="text-sm font-medium">Eğitim Durumu</label>
                          <Input
                            value={child.educationStatus}
                            onChange={(e) => handleChildChange(child.id, 'educationStatus', e.target.value)}
                            placeholder="Örn: İlkokul 3. Sınıf"
                            required
                          />
                        </div>
 
                        <div className="space-y-2 col-span-2">
                          <label className="text-sm font-medium">Sağlık Durumu</label>
                          <Textarea
                            value={child.healthStatus}
                            onChange={(e) => handleChildChange(child.id, 'healthStatus', e.target.value)}
                            placeholder="Varsa sağlık problemlerini belirtin"
                          />
                        </div>
 
                        <div className="space-y-2 col-span-2">
                          <label className="text-sm font-medium">Özel Durumlar</label>
                          <Textarea
                            value={child.specialConditions}
                            onChange={(e) => handleChildChange(child.id, 'specialConditions', e.target.value)}
                            placeholder="Varsa özel durumları belirtin (Özel eğitim ihtiyacı, alerjiler vb.)"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
 
            {/* Notlar */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Genel Notlar</label>
              <Textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Aile ile ilgili eklemek istediğiniz notlar"
              />
            </div>
 
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                'Aile Oluştur'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
 }