// app/admin/reports/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Edit2, Save } from "lucide-react";
import Cookies from 'js-cookie';

interface ReportData {
  id: string;
  approved: boolean;
  createdAt: any;
  expertEmail: string;
  expertId: string;
  familyApproved: boolean;
  familyComment?: string;
  familyEmail: string;
  familyId: string;
  familyName: string;
  familyRating?: number;
  images?: string[];
  meetingDate: string;
  notes?: string;
  payment: number;
  reportContent: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedReport, setEditedReport] = useState<Partial<ReportData>>({});

  useEffect(() => {
    const userRole = Cookies.get('user_role');
    if (userRole !== 'admin') {
      window.location.href = '/login';
      return;
    }

    fetchAllReports();
  }, []);

  const fetchAllReports = async () => {
    try {
      const response = await fetch('/api/all-reports');
      
      if (!response.ok) {
        throw new Error('Raporlar yüklenemedi');
      }

      const data = await response.json();
      setReports(data);
    } catch (err) {
      console.error("Raporları çekerken hata oluştu:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const openEditDialog = (report: ReportData) => {
    setSelectedReport(report);
    setEditedReport({
      reportContent: report.reportContent,
      payment: report.payment,
      notes: report.notes,
      familyComment: report.familyComment,
      familyRating: report.familyRating
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveReport = async () => {
    if (!selectedReport) return;

    try {
      const response = await fetch(`/api/reports/${selectedReport.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editedReport)
      });

      if (!response.ok) {
        throw new Error('Rapor güncellenemedi');
      }

      setReports(prev => 
        prev.map(report => 
          report.id === selectedReport.id 
            ? { ...report, ...editedReport } 
            : report
        )
      );

      setIsEditDialogOpen(false);
    } catch (err) {
      console.error("Rapor güncellenirken hata oluştu:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  const pendingReports = reports.filter(report => !report.approved);
  const approvedReports = reports.filter(report => report.approved);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Raporlar</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as 'pending' | 'approved')}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending">
                Onay Bekleyen Raporlar ({pendingReports.length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Onaylanmış Raporlar ({approvedReports.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aile Adı</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Ücret</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>{report.familyName}</TableCell>
                      <TableCell>{formatDate(report.meetingDate)}</TableCell>
                      <TableCell>
                        {report.payment.toLocaleString('tr-TR')} TL
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditDialog(report)}
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Düzenle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="approved">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aile Adı</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Ücret</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>{report.familyName}</TableCell>
                      <TableCell>{formatDate(report.meetingDate)}</TableCell>
                      <TableCell>
                        {report.payment.toLocaleString('tr-TR')} TL
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditDialog(report)}
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Görüntüle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {selectedReport && (
        <Dialog 
          open={isEditDialogOpen} 
          onOpenChange={setIsEditDialogOpen}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedReport.familyName} Raporu Düzenle</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2">Rapor İçeriği</label>
                  <Textarea 
                    value={editedReport.reportContent || ''}
                    onChange={(e) => setEditedReport(prev => ({
                      ...prev, 
                      reportContent: e.target.value
                    }))}
                    className="min-h-[150px]"
                  />
                </div>

                <div>
                  <div className="mb-4">
                    <label className="block mb-2">Ücret (TL)</label>
                    <Input 
                      type="number"
                      value={editedReport.payment || ''}
                      onChange={(e) => setEditedReport(prev => ({
                        ...prev, 
                        payment: parseFloat(e.target.value)
                      }))}
                    />
                  </div>

                  <div>
                    <label className="block mb-2">Notlar</label>
                    <Textarea 
                      value={editedReport.notes || ''}
                      onChange={(e) => setEditedReport(prev => ({
                        ...prev, 
                        notes: e.target.value
                      }))}
                    />
                  </div>
                </div>
              </div>

              {selectedReport.familyApproved && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2">Aile Yorumu</label>
                    <Textarea 
                      value={editedReport.familyComment || ''}
                      onChange={(e) => setEditedReport(prev => ({
                        ...prev, 
                        familyComment: e.target.value
                      }))}
                    />
                  </div>

                  <div>
                    <label className="block mb-2">Aile Puanı</label>
                    <Input 
                      type="number"
                      value={editedReport.familyRating || ''}
                      onChange={(e) => setEditedReport(prev => ({
                        ...prev, 
                        familyRating: parseInt(e.target.value)
                      }))}
                      min="1"
                      max="5"
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button 
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                İptal
              </Button>
              <Button 
                onClick={handleSaveReport}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Kaydet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}