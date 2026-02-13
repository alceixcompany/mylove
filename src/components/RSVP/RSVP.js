"use client";
import styles from './RSVP.module.css';

const RSVP = ({
    title = "Sevgilim Olur Musun?",
    subtitle = "Bu özel günü beraber geçirelim",
    yesOption = "Evet, kesinlikle!",
    noOption = "Maalesef...",
    optionsTitle = "Akşam Planı Seçeneği",
    options = [
        { label: 'Romantik Bir Akşam Yemeği', value: 'dinner' },
        { label: 'Yıldızlar Altında Sinema', value: 'cinema' },
        { label: 'Sıcak Bir Ev Akşamı', value: 'home' }
    ]
}) => {
    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <h2 className="section-title">{title}</h2>
                <p className="section-subtitle">{subtitle}</p>

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
                            {yesOption}
                        </label>
                        <label className={styles.radioLabel}>
                            <input type="radio" name="attendance" value="no" className={styles.radio} />
                            <span className={styles.radioCustom}></span>
                            {noOption}
                        </label>
                    </div>

                    <div className={styles.inputGroup}>
                        <select className={styles.select}>
                            <option value="">{optionsTitle}</option>
                            {options.map((opt, i) => (
                                <option key={i} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <button type="submit" className={styles.submitBtn}>Cevabımı Gönder</button>
                </form>
            </div>
        </section>
    );
};

export default RSVP;
