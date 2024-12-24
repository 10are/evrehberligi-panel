'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SetRolePage() {
    const [email, setEmail] = useState('');
    const [uid, setUid] = useState('');
    const [role, setRole] = useState<'admin' | 'expert' | 'family' | ''>('');
    const [currentRole, setCurrentRole] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const checkRole = async () => {
        if (!email) {
            setError('Email gerekli');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('/api/user-role', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'check', email }),
            });

            if (!response.ok) {
                throw new Error('Kullanıcı bulunamadı');
            }

            const data = await response.json();
            setCurrentRole(data.user.role || 'Rol atanmadı');
            setUid(data.user.uid);
            setError('');
        } catch (err: any) {
            setError(err.message || 'Bir hata oluştu');
            setCurrentRole(null);
        } finally {
            setLoading(false);
        }
    };

    const setRoleHandler = async () => {
        if (!uid || !role) {
            setError('UID ve rol gerekli');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('/api/user-role', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'set', uid, role }),
            });

            if (!response.ok) {
                throw new Error('Rol atama başarısız');
            }

            const data = await response.json();
            setMessage(data.message);
            setCurrentRole(role);
            setError('');
        } catch (err: any) {
            setError(err.message || 'Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Kullanıcı Rolü Yönetimi</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
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
                            <label>Email ile Rol Kontrolü</label>
                            <div className="flex space-x-2">
                                <Input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Kullanıcı email"
                                    required
                                />
                                <Button 
                                    type="button" 
                                    variant="outline"
                                    onClick={checkRole}
                                    disabled={loading || !email}
                                >
                                    {loading ? 'Kontrol Ediliyor...' : 'Kontrol Et'}
                                </Button>
                            </div>
                            {currentRole && (
                                <p className="text-sm text-gray-500 mt-1">
                                    Mevcut Rol: <span className="font-medium">{currentRole}</span>
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label>UID ile Rol Atama</label>
                            <Input
                                value={uid}
                                onChange={(e) => setUid(e.target.value)}
                                placeholder="Kullanıcı UID"
                                required
                                readOnly
                            />
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
                            type="button" 
                            className="w-full"
                            onClick={setRoleHandler}
                            disabled={loading}
                        >
                            {loading ? 'İşleniyor...' : 'Rol Ata'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
