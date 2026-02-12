"use client";
import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';
import Link from 'next/link';
import { HiOutlineEnvelope, HiOutlineLockClosed, HiOutlineArrowLeft } from "react-icons/hi2";

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            router.push('/dashboard');
        } catch (err) {
            let message = "Bir hata oluştu.";
            if (err.code === 'auth/user-not-found') message = "Kullanıcı bulunamadı.";
            else if (err.code === 'auth/wrong-password') message = "Hatalı şifre.";
            else if (err.code === 'auth/email-already-in-use') message = "Bu e-posta zaten kullanımda.";
            else message = err.message;
            setError(message);
            setIsLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        const provider = new GoogleAuthProvider();
        setIsLoading(true);
        try {
            await signInWithPopup(auth, provider);
            router.push('/dashboard');
        } catch (err) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    return (
        <main className={styles.authContainer}>
            <Link href="/" className={styles.backLink} style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-dark)',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '500',
                zIndex: 10
            }}>
                <HiOutlineArrowLeft /> Ana Sayfa
            </Link>

            <div className={styles.authCard}>
                <span className={styles.authLogo}>Sonsuz Aşk</span>
                <h2 className={styles.authTitle}>
                    {isLogin ? 'Tekrar Hoş Geldin' : 'Yeni Bir Hikaye'}
                </h2>
                <p className={styles.authSubtitle}>
                    {isLogin ? 'Aşk hikayeni yönetmeye devam et' : 'Kendi dijital anını yaratmaya başla'}
                </p>

                {error && <div className={styles.errorMsg}>{error}</div>}

                <form onSubmit={handleAuth} className={styles.authForm}>
                    <div className={styles.inputWrapper}>
                        <HiOutlineEnvelope className={styles.inputIcon} />
                        <input
                            type="email"
                            placeholder="E-posta Adresi"
                            className={styles.authInput}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.inputWrapper}>
                        <HiOutlineLockClosed className={styles.inputIcon} />
                        <input
                            type="password"
                            placeholder="Şifre"
                            className={styles.authInput}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                        {isLoading ? 'İşleniyor...' : (isLogin ? 'Giriş Yap' : 'Hesap Oluştur')}
                    </button>
                </form>

                <div className={styles.divider}>
                    <span className={styles.dividerText}>veya</span>
                </div>

                <button onClick={handleGoogleAuth} className={styles.googleBtn} disabled={isLoading}>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" />
                    Google ile Devam Et
                </button>

                <p className={styles.switchAuth}>
                    {isLogin ? 'Henüz bir hesabın yok mu?' : 'Zaten bir hesabın var mı?'}
                    <button onClick={() => setIsLogin(!isLogin)} className={styles.switchBtn}>
                        {isLogin ? 'Şimdi Kayıt Ol' : 'Giriş Yap'}
                    </button>
                </p>
            </div>
        </main>
    );
}
