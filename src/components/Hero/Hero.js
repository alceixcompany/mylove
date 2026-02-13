import styles from './Hero.module.css';

import Countdown from '../Countdown/Countdown';

const Hero = ({ title, subtitle, imageUrl, quote, countdownDate, countdownTitle }) => {
    return (
        <section className={styles.hero}>
            <div className={styles.imageOverlay}></div>
            <div className={styles.heroImageWrapper}>
                <img src={imageUrl} alt="Sevgililer" className={styles.heroImage} />
            </div>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>{subtitle}</p>

            <Countdown targetDateStr={countdownDate} title={countdownTitle} />

            <p className={styles.quote}>{quote}</p>
            <button className={styles.ctaButton}>Seni Seviyorum</button>
        </section>
    );
};



export default Hero;
