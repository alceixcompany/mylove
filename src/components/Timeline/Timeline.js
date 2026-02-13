import styles from './Timeline.module.css';

import TimelineItem from './TimelineItem';

const Timeline = ({ title = "Hikayemiz", subtitle = "Unutulmaz anılarımız", events = [] }) => {
    return (
        <section className={styles.section}>
            <h2 className="section-title">{title}</h2>
            <p className="section-subtitle">{subtitle}</p>

            <div className={styles.timeline}>
                <div className={styles.line}></div>
                {events.map((event, index) => (
                    <TimelineItem
                        key={index}
                        date={event.date}
                        title={event.title}
                        description={event.description}
                        image={event.image}
                    />
                ))}
            </div>
        </section>
    );
};

export default Timeline;
