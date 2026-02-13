import styles from './Timeline.module.css';

const TimelineItem = ({ date, title, description, image }) => {
    return (
        <div className={styles.item}>
            <div className={styles.dot}></div>
            <div className={styles.card}>
                <div className={styles.imageBox}>
                    <img src={image} alt={title} className={styles.image} />
                </div>
                <div className={styles.content}>
                    <span className={styles.date}>{date}</span>
                    <h3 className={styles.title}>{title}</h3>
                    <p className={styles.description}>{description}</p>
                </div>
            </div>
        </div>
    );
};

export default TimelineItem;
