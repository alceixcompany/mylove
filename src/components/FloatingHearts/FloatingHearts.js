"use client";
import { useEffect, useState } from 'react';
import styles from './FloatingHearts.module.css';

const FloatingHearts = () => {
    const [hearts, setHearts] = useState([]);

    useEffect(() => {
        // Daha fazla ve daha çeşitli kalp parçacıkları üretelim
        const newHearts = Array.from({ length: 25 }).map((_, i) => ({
            id: i,
            left: Math.random() * 100 + "%",
            delay: Math.random() * 20 + "s",
            size: Math.random() * 20 + 10 + "px",
            duration: Math.random() * 15 + 10 + "s",
            // Sağa sola sallanma genliği
            drift: (Math.random() - 0.5) * 100 + "px",
            opacity: Math.random() * 0.3 + 0.1
        }));
        setHearts(newHearts);
    }, []);

    return (
        <div className={styles.container}>
            {hearts.map(heart => (
                <span
                    key={heart.id}
                    className={styles.heart}
                    style={{
                        left: heart.left,
                        animationDelay: heart.delay,
                        animationDuration: heart.duration,
                        fontSize: heart.size,
                        opacity: heart.opacity,
                        '--drift': heart.drift
                    }}
                >
                    ❤
                </span>
            ))}
        </div>
    );
};

export default FloatingHearts;
