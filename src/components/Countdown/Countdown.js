"use client";
import { useState, useEffect } from 'react';
import styles from '../Hero/Hero.module.css'; // Reusing Hero styles for consistency, or we can make new ones

const Countdown = ({ targetDateStr, title = "14 Şubat'a Kalan Zaman" }) => {
    const [timeLeft, setTimeLeft] = useState({ GÜN: 0, SAAT: 0, DAKİKA: 0, SANİYE: 0 });

    useEffect(() => {
        if (!targetDateStr) return;

        const targetDate = new Date(targetDateStr);
        // If invalid date, fallback or return
        if (isNaN(targetDate.getTime())) return;

        const timer = setInterval(() => {
            const now = new Date();
            const difference = targetDate - now;

            if (difference > 0) {
                setTimeLeft({
                    GÜN: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    SAAT: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    DAKİKA: Math.floor((difference / 1000 / 60) % 60),
                    SANİYE: Math.floor((difference / 1000) % 60),
                });
            } else {
                // Timer finished
                setTimeLeft({ GÜN: 0, SAAT: 0, DAKİKA: 0, SANİYE: 0 });
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDateStr]);

    return (
        <>
            <div className={styles.countdownTitle}>{title}</div>
            <div className={styles.countdown}>
                {Object.entries(timeLeft).map(([label, value]) => (
                    <div key={label} className={styles.countdownItem}>
                        <span className={styles.countNumber}>{value}</span>
                        <span className={styles.countLabel}>{label}</span>
                    </div>
                ))}
            </div>
        </>
    );
};

export default Countdown;
