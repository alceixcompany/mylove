"use client";
import styles from './Guestbook.module.css';

const Guestbook = ({ initialMessages = [] }) => {
    return (
        <section className={styles.section}>
            <h2 className="section-title">Aşk Notları</h2>
            <p className="section-subtitle">Kalbimizden dökülen kelimeler</p>

            <div className={styles.inputArea}>
                <div className={styles.quoteMark}>“</div>
                <textarea
                    className={styles.textarea}
                    placeholder="Ona kalbinden neler geçiyor?"
                    rows="3"
                ></textarea>
                <button className={styles.submitBtn}>Notumu Bırak</button>
            </div>

            <div className={styles.messagesList}>
                {initialMessages.map((msg, i) => (
                    <div key={i} className={styles.messageCard}>
                        <p className={styles.messageText}>{msg.text}</p>
                        <span className={styles.messageAuthor}>— {msg.author}</span>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Guestbook;
