"use client";
import { useState } from 'react';
import styles from '../../app/page.module.css';

export default function ProtectionGate({ question, answer, children }) {
    const [userAnswer, setUserAnswer] = useState('');
    const [unlocked, setUnlocked] = useState(false);
    const [error, setError] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (userAnswer.trim().toLowerCase() === answer.trim().toLowerCase()) {
            setUnlocked(true);
            setError(false);
        } else {
            setError(true);
        }
    };

    if (unlocked) return children;

    return (
        <div className={styles.gateOverlay}>
            <div className={styles.gateCard}>
                <div className={styles.gateIcon}>🔐</div>
                <h2>Bize Özel</h2>
                <p>Burası bizim dünyamız. İçeri girmek için kalbinin bildiği o cevabı yaz...</p>

                <div className={styles.gateQuestion}>
                    <strong>Soru:</strong> {question}
                </div>

                <form onSubmit={handleSubmit} className={styles.gateForm}>
                    <input
                        type="text"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Cevabınız..."
                        className={error ? styles.gateInputError : styles.gateInput}
                    />
                    {error && <p className={styles.errorHint}>Üzgünüz, cevap yanlış. Tekrar deneyin.</p>}
                    <button type="submit" className={styles.gateBtn}>Sayfayı Aç</button>
                </form>
            </div>
        </div>
    );
}
