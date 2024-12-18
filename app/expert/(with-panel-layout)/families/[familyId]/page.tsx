'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  addDoc, 
  collection, 
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/app/firebaseConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Camera, X, Calendar, DollarSign } from "lucide-react";
import Cookies from 'js-cookie';

interface Meeting {
  reportId?: string;
  date: string;
}

interface ReportData {
  expertId: string;
  expertEmail: string;
  familyId: string;
  familyEmail: string;
  familyName: string;
  meetingDate: string;
  reportContent: string;
  payment: number;
  notes?: string;
  images?: string[];
  approved: boolean;
  familyComment?: string;
  familyRating: number;
  familyApproved: boolean;
  createdAt: any;
}

interface FamilyData {
  id: string;
  familyName: string;
  email: string;
  phone: string;
  address: {
    fullAddress: string;
    district: string;
    city: string;
  };
  meetings?: Meeting[];
}

export default function FamilyDetail() {
  const params = useParams();
  const familyId = params.familyId as string;
  const expertId = Cookies.get('user_id');
  const expertEmail = Cookies.get('user_email');

  const [family, setFamily] = useState<FamilyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [newMeeting, setNewMeeting] = useState({
    date: '',
    report: '',
    payment: '',
    notes: ''
  });

  // Tarih sınırları
  const maxDate = new Date().toISOString().split('T')[0];
  const minDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  useEffect(() => {
    fetchFamilyDetails();
  }, [familyId]);

  const fetchFamilyDetails = async () => {
    try {
      const familyRef = doc(db, 'experts', expertId!, 'families', familyId);
      const familyDoc = await getDoc(familyRef);

      if (familyDoc.exists()) {
        setFamily({ id: familyDoc.id, ...familyDoc.data() } as FamilyData);
      }
    } catch (err) {
      console.error("Error:", err);
      setError('Aile bilgileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedImages.length > 5) {
      setError('En fazla 5 resim yükleyebilirsiniz');
      return;
    }

    // Dosya boyutu kontrolü
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Her resim en fazla 5MB olabilir');
        return;
      }
    }

    setSelectedImages(prev => [...prev, ...files]);

    // Preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => {
      URL.revokeObjectURL(prev[index]); // Cleanup
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadImages = async (): Promise<string[]> => {
    if (selectedImages.length === 0) return [];

    const uploadPromises = selectedImages.map(async (file) => {
      const storageRef = ref(storage, `meeting-images/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise<string>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          reject,
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });
    });

    return Promise.all(uploadPromises);
  };

  const handleAddMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const imageUrls = await uploadImages();

      if (!family) throw new Error('Aile bilgileri bulunamadı');

      const reportData: ReportData = {
        expertId: expertId!,
        expertEmail: expertEmail!,
        familyId: family.id,
        familyEmail: family.email,
        familyName: family.familyName,
        meetingDate: newMeeting.date,
        reportContent: newMeeting.report,
        payment: parseFloat(newMeeting.payment),
        notes: newMeeting.notes,
        images: imageUrls,
        approved: false,
        familyComment: '',
        familyRating:5,
        familyApproved: false,
        createdAt: serverTimestamp()
      };

      // Raporları yeni 'reports' collection'ına ekle
      const reportsCollectionRef = collection(db, 'reports');
      const newReportRef = await addDoc(reportsCollectionRef, reportData);

      // Aile dokümanındaki meetings array'ine de referans ekle
      const familyRef = doc(db, 'experts', expertId!, 'families', familyId);
      await updateDoc(familyRef, {
        meetings: arrayUnion({
          reportId: newReportRef.id,
          date: newMeeting.date,
        })
      });

      setSuccess('Görüşme raporu başarıyla oluşturuldu');
      setNewMeeting({ date: '', report: '', payment: '', notes: '' });
      setSelectedImages([]);
      setImagePreviewUrls([]);
      setUploadProgress(0);
      fetchFamilyDetails();

    } catch (err) {
      console.error("Error:", err);
      setError('Görüşme raporu oluşturulurken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!family) return null;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Aile Detayları */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
        <CardHeader>
          <CardTitle className="text-2xl">{family.familyName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p><span className="font-medium text-gray-700">E-posta:</span> {family.email}</p>
              <p><span className="font-medium text-gray-700">Telefon:</span> {family.phone}</p>
            </div>
            <div className="space-y-2">
              <p><span className="font-medium text-gray-700">Adres:</span> {family.address.fullAddress}</p>
              <p><span className="font-medium text-gray-700">İlçe/Şehir:</span> {family.address.district}, {family.address.city}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Yeni Görüşme Ekleme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Yeni Görüşme Ekle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddMeeting} className="space-y-6">
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

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Görüşme Tarihi</label>
                <Input
                  type="date"
                  value={newMeeting.date}
                  max={maxDate}
                  min={minDate}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, date: e.target.value }))}
                  required
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ücret (TL)</label>
                <Input
                  type="number"
                  value={newMeeting.payment}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, payment: e.target.value }))}
                  required
                  min="0"
                  step="0.01"
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Görüşme Raporu</label>
              <Textarea
                value={newMeeting.report}
                onChange={(e) => setNewMeeting(prev => ({ ...prev, report: e.target.value }))}
                placeholder="Görüşmede yapılan çalışmaları detaylı bir şekilde yazın"
                required
                className="min-h-[120px] border-gray-300 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Görüşme Fotoğrafları</label>
              <div className="flex flex-wrap gap-4">
                {imagePreviewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={url} 
                      alt={`Preview ${index + 1}`} 
                      className="w-24 h-24 object-cover rounded-lg shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg 
                               transform transition-transform hover:scale-110"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {imagePreviewUrls.length < 5 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className="w-24 h-24 flex flex-col items-center justify-center gap-2 border-2 border-dashed
                             hover:border-blue-500 hover:text-blue-500 transition-colors"
                  >
                    <Camera className="w-6 h-6" />
                    <span className="text-xs">Fotoğraf Ekle</span>
                  </Button>
                )}
              </div>
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageSelect}
              />
              <p className="text-xs text-gray-500 mt-2">
                En fazla 5 fotoğraf, her biri max 5MB
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notlar</label>
              <Textarea
                value={newMeeting.notes}
                onChange={(e) => setNewMeeting(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Eklemek istediğiniz notlar"
                className="border-gray-300 focus:border-blue-500"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ekleniyor...
                </>
              ) : (
                'Görüşme Ekle'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Görüşme Listesi */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Görüşme Geçmişi
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {!family.meetings || family.meetings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Henüz görüşme kaydı bulunmuyor.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {family.meetings
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((meeting) => (
                  <Card key={meeting.date} className="bg-white hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b">
                          <div>
                            <h4 className="font-semibold text-lg text-gray-800">
                              {new Date(meeting.date).toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </h4>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}