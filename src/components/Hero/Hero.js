"use client";
import { useState, useEffect } from 'react';
import styles from './Hero.module.css';

const Hero = ({ title, subtitle, imageUrl, quote }) => {
    const [timeLeft, setTimeLeft] = useState({ gün: 0, saat: 0, dakika: 0, saniye: 0 });

    useEffect(() => {
        // 14 Şubat Hedef Tarihi
        const currentYear = new Date().getFullYear();
        const targetDate = new Date(`February 14, ${currentYear} 00:00:00`);

        // Eğer 14 Şubat geçtiyse sonraki yıla ayarla
        if (new Date() > targetDate) {
            targetDate.setFullYear(currentYear + 1);
        }

        const timer = setInterval(() => {
            const difference = targetDate - new Date();
            setTimeLeft({
                gün: Math.floor(difference / (1000 * 60 * 60 * 24)),
                saat: Math.floor((difference / (1000 * 60 * 60)) % 24),
                dakika: Math.floor((difference / 1000 / 60) % 60),
                saniye: Math.floor((difference / 1000) % 60),
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className={styles.hero}>
            <div className={styles.imageOverlay}></div>
            <div className={styles.heroImageWrapper}>
                <img src={imageUrl} alt="Sevgililer" className={styles.heroImage} />
            </div>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>{subtitle}</p>

            <div className={styles.countdownTitle}>14 Şubat'a Kalan Zaman</div>
            <div className={styles.countdown}>
                {Object.entries(timeLeft).map(([label, value]) => (
                    <div key={label} className={styles.countdownItem}>
                        <span className={styles.countNumber}>{value}</span>
                        <span className={styles.countLabel}>{label}</span>
                    </div>
                ))}
            </div>

            <p className={styles.quote}>{quote}</p>
            <button className={styles.ctaButton}>Seni Seviyorum</button>
        </section>
    );
};

export default Hero;
