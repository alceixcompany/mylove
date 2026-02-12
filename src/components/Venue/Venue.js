import styles from './Venue.module.css';

const Venue = ({ name, address, time, imageUrl }) => {
    return (
        <section className={styles.section}>
            <h2 className="section-title">Buluşma Noktamız</h2>
            <p className="section-subtitle">Aşkın en güzel hali</p>

            <div className={styles.card}>
                <div className={styles.imageWrapper}>
                    <img src={imageUrl} alt="Mekan" className={styles.image} />
                    <div className={styles.timeTag}>{time}</div>
                </div>
                <div className={styles.details}>
                    <h3 className={styles.name}>{name}</h3>
                    <p className={styles.address}>
                        <span className={styles.icon}>📍</span>
                        {address}
                    </p>
                    <div className={styles.mapLook}>
                        <div className={styles.mapDot}></div>
                        <div className={styles.mapPulse}></div>
                        <p className={styles.mapText}>Konuma Git</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Venue;
