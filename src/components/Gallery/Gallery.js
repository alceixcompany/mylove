import styles from './Gallery.module.css';

const Gallery = ({ title, subtitle, images }) => {
    const displayImages = images && images.length > 0 ? images : ["/images/story-4.png", "/images/gallery-1.png", "/images/gallery-2.png"];

    return (
        <section className={styles.section}>
            <h2 className="section-title">
                <span className="heart-icon-animate">❤</span>
                {title || "Anılarımız"}
                <span className="heart-icon-animate">❤</span>
            </h2>
            <p className="section-subtitle">{subtitle || "Aşk dolu kareler"}</p>
            <div className={styles.grid}>
                {displayImages.map((img, idx) => (
                    <div key={idx} className={idx === 0 ? styles.itemLarge : styles.item}>
                        <img src={img} alt={`Anı ${idx + 1}`} className={styles.img} />
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Gallery;
