// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/app/firebaseConfig';
import { db } from '@/app/firebaseConfig';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Cookies from 'js-cookie';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const updateUserCollection = async (
        uid: string, 
        email: string, 
        role: string,
        lastLoginAt: Date
    ) => {
        try {
            const collectionName = `${role}s`; // admins, experts, families
            const userRef = doc(db, collectionName, uid);

            await setDoc(userRef, {
                uid,
                email,
                role,
                lastLoginAt,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            }, { merge: true }); // merge: true ile varsa günceller, yoksa oluşturur

        } catch (error) {
            console.error("Collection update error:", error);
            throw error;
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const idTokenResult = await userCredential.user.getIdTokenResult();
            const token = await userCredential.user.getIdToken();
            
            // Role'ü string olarak al
            const role = (idTokenResult.claims.role as string) || '';
            
            if (!role) {
                setError('Kullanıcı rolü tanımlanmamış');
                return;
            }

            // Firestore'da kullanıcı bilgilerini güncelle
            await updateUserCollection(
                userCredential.user.uid,
                userCredential.user.email || '',
                role,
                new Date()
            );
            
            // Cookie'leri ayarla
            Cookies.set('auth_token', token);
            Cookies.set('user_role', role);
            Cookies.set('user_id', userCredential.user.uid);
            Cookies.set('user_email', userCredential.user.email || '');

            // Role göre yönlendirme
            if (role === 'admin') {
                router.push('/admin');
            } else if (role === 'expert') {
                router.push('/expert');
            } else if (role === 'family') {
                router.push('/family');
            }

        } catch (err) {
            console.error("Login error:", err);
            setError('Giriş başarısız. Bilgilerinizi kontrol edin.');
            // Cookie'leri temizle
            Cookies.remove('auth_token');
            Cookies.remove('user_role');
            Cookies.remove('user_id');
            Cookies.remove('user_email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <Card className="w-full max-w-md mx-4">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Giriş Yap</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        
                        <div className="space-y-2">
                            <label className="text-sm font-medium">E-posta</label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ornek@mail.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Şifre</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <Button 
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}