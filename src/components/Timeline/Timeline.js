import styles from './Timeline.module.css';

const Timeline = ({ events }) => {
    return (
        <section className={styles.section}>
            <h2 className="section-title">Hikayemiz</h2>
            <p className="section-subtitle">Unutulmaz anılarımız</p>

            <div className={styles.timeline}>
                <div className={styles.line}></div>
                {events.map((event, index) => (
                    <div key={index} className={styles.item}>
                        <div className={styles.dot}></div>
                        <div className={styles.card}>
                            <div className={styles.imageBox}>
                                <img src={event.image} alt={event.title} className={styles.image} />
                            </div>
                            <div className={styles.content}>
                                <span className={styles.date}>{event.date}</span>
                                < h3 className={styles.title}>{event.title}</h3>
                                <p className={styles.description}>{event.description}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Timeline;
