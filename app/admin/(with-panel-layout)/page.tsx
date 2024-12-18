'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SetRole() {
    const [uid, setUid] = useState('');
    const [role, setRole] = useState<'admin' | 'expert' | 'family' | ''>('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentRole, setCurrentRole] = useState<string | null>(null);

    const checkRole = async () => {
        if (!uid) {
            setError('UID gerekli');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('/api/check-role', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ uid }),
            });

            if (!response.ok) {
                throw new Error('Kullanıcı bulunamadı');
            }

            const data = await response.json();
            setCurrentRole(data.user.role || 'Rol atanmamış');
            setError('');

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Bir hata oluştu');
            setCurrentRole(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const response = await fetch('/api/set-user-role', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ uid, role }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Bir hata oluştu');
            }

            const data = await response.json();
            setMessage(`Kullanıcı rolü başarıyla ${role} olarak güncellendi`);
            checkRole(); // Rol güncellemesinden sonra mevcut rolü kontrol et
            setRole('');

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Kullanıcı Rolü Ata</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {message && (
                            <Alert className="bg-green-50">
                                <AlertDescription>{message}</AlertDescription>
                            </Alert>
                        )}
                        
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <label>Kullanıcı UID</label>
                            <div className="flex space-x-2">
                                <Input
                                    value={uid}
                                    onChange={(e) => setUid(e.target.value)}
                                    placeholder="Kullanıcı UID'si"
                                    required
                                />
                                <Button 
                                    type="button" 
                                    variant="outline"
                                    onClick={checkRole}
                                    disabled={loading || !uid}
                                >
                                    Kontrol Et
                                </Button>
                            </div>
                            {currentRole && (
                                <p className="text-sm text-gray-500 mt-1">
                                    Mevcut Rol: <span className="font-medium">{currentRole}</span>
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label>Rol</label>
                            <Select value={role} onValueChange={(value: 'admin' | 'expert' | 'family') => setRole(value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Rol seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="expert">Uzman</SelectItem>
                                    <SelectItem value="family">Aile</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? 'İşleniyor...' : 'Rol Ata'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}