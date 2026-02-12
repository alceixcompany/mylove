"use client";
import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            router.push('/dashboard');
        } catch (err) {
            setError(err.message);
        }
    };

    const handleGoogleAuth = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            router.push('/dashboard');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <main className={styles.mainContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
            <div style={{ width: '100%', maxWidth: '400px', backgroundColor: 'white', padding: '40px', borderRadius: '24px', boxShadow: 'var(--shadow-soft)', textAlign: 'center' }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--primary-rose)', marginBottom: '10px' }}>
                    {isLogin ? 'Hoş Geldin' : 'Hesap Oluştur'}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '30px' }}>
                    {isLogin ? 'Aşk hikayeni yönetmeye devam et' : 'Kendi dijital anını yaratmaya başla'}
                </p>

                {error && <p style={{ color: 'red', fontSize: '0.8rem', marginBottom: '15px' }}>{error}</p>}

                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input
                        type="email"
                        placeholder="E-posta"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--border-pink)', outline: 'none' }}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Şifre"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--border-pink)', outline: 'none' }}
                        required
                    />
                    <button type="submit" style={{ backgroundColor: 'var(--primary-rose)', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
                        {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
                    </button>
                </form>

                <div style={{ margin: '20px 0', borderTop: '1px solid var(--border-pink)', position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'white', padding: '0 10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>veya</span>
                </div>

                <button onClick={handleGoogleAuth} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-pink)', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer' }}>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="18" />
                    Google ile Devam Et
                </button>

                <p style={{ marginTop: '20px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {isLogin ? 'Hesabın yok mu?' : 'Zaten hesabın var mı?'}
                    <button onClick={() => setIsLogin(!isLogin)} style={{ background: 'none', border: 'none', color: 'var(--primary-rose)', fontWeight: 'bold', marginLeft: '5px', cursor: 'pointer' }}>
                        {isLogin ? 'Kayıt Ol' : 'Giriş Yap'}
                    </button>
                </p>
            </div>
        </main>
    );
}
