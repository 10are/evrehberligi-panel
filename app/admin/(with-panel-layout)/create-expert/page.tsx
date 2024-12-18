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
import { UserCircle, Loader2 } from "lucide-react";

interface ExpertFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  nationalId: string;
  photoURL: string;

  address: string;
  district: string;
  city: string;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };

  specialization: string;
  startDate: string;
  workPreferences: {
    preferredDistricts: string;
    availableDays: string;
  };

  experience: string;
  notes: string;
}

const initialFormData: ExpertFormData = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  birthDate: '',
  gender: 'male',
  nationalId: '',
  photoURL: '',

  address: '',
  district: '',
  city: '',
  emergencyContact: {
    name: '',
    phone: '',
    relation: ''
  },

  specialization: '',
  startDate: new Date().toISOString().split('T')[0],
  workPreferences: {
    preferredDistricts: '',
    availableDays: ''
  },

  experience: '',
  notes: ''
};

export default function CreateExpert() {
  const [formData, setFormData] = useState<ExpertFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Dosya boyutu kontrolü (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Fotoğraf boyutu 5MB\'dan küçük olmalıdır');
        return;
      }

      setPhotoFile(file);
      const previewURL = URL.createObjectURL(file);
      setPhotoPreview(previewURL);
    }
  };

  const handleBasicChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmergencyContactChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [name]: value
      }
    }));
  };

  const handleWorkPreferencesChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      workPreferences: {
        ...prev.workPreferences,
        [name]: value
      }
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
        const storageRef = ref(storage, `expert-photos/${Date.now()}-${photoFile.name}`);
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

      const response = await fetch('/api/create-expert', {
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

      await setDoc(doc(db, 'experts', data.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        birthDate: formData.birthDate,
        gender: formData.gender,
        nationalId: formData.nationalId,
        photoURL: photoURL,
      
        address: {
          fullAddress: formData.address,
          district: formData.district,
          city: formData.city
        },
      
        emergencyContact: formData.emergencyContact,
        specialization: formData.specialization,
        startDate: formData.startDate,
        workPreferences: formData.workPreferences,
        experience: formData.experience,
        notes: formData.notes,
      
        createdAt: new Date(),
        updatedAt: new Date(),
        active: true,
        status: 'active'
      });

      setSuccess('Uzman başarıyla oluşturuldu!');
      setFormData(initialFormData);
      setPhotoFile(null);
      setPhotoPreview('');
      setUploadProgress(0);

    } catch (err) {
      console.error("Error:", err);
      setError('Uzman oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Yeni Uzman Oluştur</CardTitle>
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

            {/* Kişisel Bilgiler */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Kişisel Bilgiler</h3>

              {/* Profil Fotoğrafı */}
              <div className="flex items-center gap-4">
                <div className="relative w-32 h-32">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Profil önizleme"
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
                  <label className="text-sm font-medium">Ad</label>
                  <Input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleBasicChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Soyad</label>
                  <Input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleBasicChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Doğum Tarihi</label>
                  <Input
                    name="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={handleBasicChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cinsiyet</label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value as 'male' | 'female' | 'other' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Cinsiyet seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Erkek</SelectItem>
                      <SelectItem value="female">Kadın</SelectItem>
                      <SelectItem value="other">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">TC Kimlik No</label>
                <Input
                  name="nationalId"
                  value={formData.nationalId}
                  onChange={handleBasicChange}
                  maxLength={11}
                  required
                />
              </div>
            </div>

            {/* İletişim Bilgileri */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">İletişim Bilgileri</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">E-posta</label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleBasicChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Telefon</label>
                  <Input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleBasicChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Adres</label>
                <Textarea
                  name="address"
                  value={formData.address}
                  onChange={handleBasicChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">İlçe</label>
                  <Input
                    name="district"
                    value={formData.district}
                    onChange={handleBasicChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Şehir</label>
                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleBasicChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Acil Durum Kontağı */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Acil Durum Kontağı</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ad Soyad</label>
                  <Input
                    name="name"
                    value={formData.emergencyContact.name}
                    onChange={handleEmergencyContactChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Telefon</label>
                  <Input
                    name="phone"
                    value={formData.emergencyContact.phone}
                    onChange={handleEmergencyContactChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Yakınlık</label>
                  <Input
                    name="relation"
                    value={formData.emergencyContact.relation}
                    onChange={handleEmergencyContactChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* İş Bilgileri */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">İş Bilgileri</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Uzmanlık Alanı</label>
                  <Input
name="specialization"
                   value={formData.specialization}
                   onChange={handleBasicChange}
                   required
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-medium">Başlangıç Tarihi</label>
                 <Input
                   name="startDate"
                   type="date"
                   value={formData.startDate}
                   onChange={handleBasicChange}
                   required
                 />
               </div>
             </div>

             <div className="space-y-2">
               <label className="text-sm font-medium">Tercih Edilen İlçeler</label>
               <Textarea
                 name="preferredDistricts"
                 value={formData.workPreferences.preferredDistricts}
                 onChange={handleWorkPreferencesChange}
                 placeholder="İlçeleri virgülle ayırarak yazın"
                 required
               />
             </div>

             <div className="space-y-2">
               <label className="text-sm font-medium">Müsait Günler</label>
               <Textarea
                 name="availableDays"
                 value={formData.workPreferences.availableDays}
                 onChange={handleWorkPreferencesChange}
                 placeholder="Müsait olduğunuz günleri belirtin"
                 required
               />
             </div>
           </div>

           {/* Ek Bilgiler */}
           <div className="space-y-4">
             <h3 className="text-lg font-semibold">Ek Bilgiler</h3>
             <div className="space-y-2">
               <label className="text-sm font-medium">Deneyim</label>
               <Textarea
                 name="experience"
                 value={formData.experience}
                 onChange={handleBasicChange}
                 placeholder="Önceki iş deneyimlerinizi belirtin"
               />
             </div>

             <div className="space-y-2">
               <label className="text-sm font-medium">Notlar</label>
               <Textarea
                 name="notes"
                 value={formData.notes}
                 onChange={handleBasicChange}
                 placeholder="Eklemek istediğiniz diğer bilgiler"
               />
             </div>
           </div>

           {/* Şifre */}
           <div className="space-y-2">
             <label className="text-sm font-medium">Şifre</label>
             <Input
               name="password"
               type="password"
               value={formData.password}
               onChange={handleBasicChange}
               required
               minLength={6}
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
               'Uzman Oluştur'
             )}
           </Button>
         </form>
       </CardContent>
     </Card>
   </div>
 );
}