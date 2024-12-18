'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Calendar, DollarSign, CheckCircle2, MessageCircle, Star } from "lucide-react";

interface ReportData {
  id: string;
  expertId: string;
  familyName: string;
  meetingDate: string;
  reportContent: string;
  payment: number;
  images?: string[];
  approved: boolean;
  familyApproved: boolean;
  familyComment?: string;
  familyRating?: number;
  createdAt: any;
}

export default function PastReports() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPastReports();
  }, []);

  const fetchPastReports = async () => {
    try {
      const response = await fetch('/api/reports');
      
      if (!response.ok) {
        throw new Error('Raporlar yüklenirken bir hata oluştu');
      }

      const data = await response.json();
      
      // Tarihe göre sırala (en yeni önce)
      const sortedReports = data.sort((a: ReportData, b: ReportData) => 
        new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime()
      );

      setReports(sortedReports);
    } catch (err) {
      console.error("Raporları çekerken hata oluştu:", err);
      setError('Raporlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const renderRatingStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, index) => (
          <Star 
            key={index} 
            className={`w-4 h-4 ${index < rating ? 'text-yellow-500' : 'text-gray-300'}`} 
            fill={index < rating ? 'currentColor' : 'none'}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Geçmiş Raporlarım
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {error && (
          <div className="text-red-500 text-center py-4">
            {error}
          </div>
        )}

        {reports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Henüz bir rapor bulunmuyor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <Card 
                key={report.id} 
                className="bg-white hover:shadow-lg transition-shadow border"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col space-y-4">
                    {/* Başlık ve Tarih */}
                    <div className="flex justify-between items-start pb-4 border-b">
                      <div>
                        <h4 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                          {report.familyName}
                          {report.approved && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Onaylandı
                            </Badge>
                          )}
                        </h4>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(report.meetingDate).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Ücret ve Onay Durumu */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-emerald-600">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-medium">
                          {report.payment.toLocaleString('tr-TR')} TL
                        </span>
                      </div>
                    </div>

                    {/* Resimler */}
                    {report.images && report.images.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
                        {report.images.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Rapor Resmi ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg shadow flex-shrink-0 
                                      hover:scale-105 transition-transform cursor-pointer"
                            onClick={() => window.open(image, '_blank')}
                          />
                        ))}
                      </div>
                    )}

                    {/* Rapor Özeti */}
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Rapor Özeti</h5>
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {report.reportContent}
                      </p>
                    </div>

                    {/* Aile Onayı ve Yorumları */}
                    {report.familyApproved && (
                      <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                        {report.familyRating !== undefined && (
                          <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-500" />
                            <span className="font-medium">Aile Puanı:</span>
                            {renderRatingStars(report.familyRating)}
                          </div>
                        )}
                        
                        {report.familyComment && (
                          <div className="flex items-start gap-2">
                            <MessageCircle className="w-5 h-5 text-gray-500 mt-1" />
                            <div>
                              <span className="font-medium block mb-1">Aile Yorumu:</span>
                              <p className="text-gray-700 text-sm italic">
                                "{report.familyComment}"
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}