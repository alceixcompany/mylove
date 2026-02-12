"use client";
import styles from './RSVP.module.css';

const RSVP = () => {
    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <h2 className="section-title">Sevgilim Olur Musun?</h2>
                <p className="section-subtitle">Bu özel günü beraber geçirelim</p>

                <form className={styles.form} onSubmit={(e) => {
                    e.preventDefault();
                    alert("Harika! Bu 14 Şubat unutulmaz olacak. ❤️");
                }}>
                    <div className={styles.inputGroup}>
                        <input type="text" placeholder="Adın" className={styles.input} required />
                    </div>

                    <div className={styles.options}>
                        <label className={styles.radioLabel}>
                            <input type="radio" name="attendance" value="yes" className={styles.radio} required />
                            <span className={styles.radioCustom}></span>
                            Evet, kesinlikle!
                        </label>
                        <label className={styles.radioLabel}>
                            <input type="radio" name="attendance" value="no" className={styles.radio} />
                            <span className={styles.radioCustom}></span>
                            Maalesef...
                        </label>
                    </div>

                    <div className={styles.inputGroup}>
                        <select className={styles.select}>
                            <option value="">Akşam Planı Seçeneği</option>
                            <option value="dinner">Romantik Bir Akşam Yemeği</option>
                            <option value="cinema">Yıldızlar Altında Sinema</option>
                            <option value="home">Sıcak Bir Ev Akşamı</option>
                        </select>
                    </div>

                    <button type="submit" className={styles.submitBtn}>Cevabımı Gönder</button>
                </form>
            </div>
        </section>
    );
};

export default RSVP;
