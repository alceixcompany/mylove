import Link from "next/link";
import styles from "../payment.module.css";
import { HiOutlineCheckCircle, HiOutlineCreditCard } from "react-icons/hi2";

const ERROR_MESSAGES = {
    missing_token: "Odeme dogrulama bilgisi gelmedi.",
    payment_not_found: "Odeme kaydi bulunamadi.",
    amount_mismatch: "Iyzico tutari beklenen tutarla eslesmedi.",
    currency_mismatch: "Para birimi dogrulamasi basarisiz oldu.",
    callback_error: "Odeme sonucu islenirken bir hata olustu."
};

export default async function PaymentCallbackPage({ searchParams }) {
    const params = await searchParams;
    const success = params?.status === "success";
    const messageKey = params?.message;
    const message = ERROR_MESSAGES[messageKey] || "Odeme basarisiz veya iptal edilmis gorunuyor.";

    return (
        <main className={styles.callbackShell}>
            <section className={styles.callbackCard}>
                <div className={`${styles.callbackIcon} ${success ? styles.callbackIconSuccess : styles.callbackIconError}`}>
                    {success ? <HiOutlineCheckCircle /> : <HiOutlineCreditCard />}
                </div>
                <h1 className={styles.callbackTitle}>
                    {success ? "Sayfan yayinda" : "Odeme tamamlanamadi"}
                </h1>
                <p className={styles.callbackText}>
                    {success
                        ? "Odeme dogrulandi. Hesabin paid=true olarak guncellendi ve sayfan aktif hale getirildi."
                        : message}
                </p>
                <div className={styles.callbackActions}>
                    <Link href="/dashboard" className={styles.primaryBtn}>
                        Panele don
                    </Link>
                    {!success && (
                        <Link href="/payment" className={styles.secondaryBtn}>
                            Tekrar dene
                        </Link>
                    )}
                </div>
            </section>
        </main>
    );
}
