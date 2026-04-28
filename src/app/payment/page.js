"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import IyzicoForm from "./_components/IyzicoForm";
import styles from "./payment.module.css";
import {
    HiOutlineArrowLeft,
    HiOutlineCheckCircle,
    HiOutlineCreditCard,
    HiOutlineSparkles,
    HiOutlineTag
} from "react-icons/hi2";

function formatCurrency(amount, currency) {
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: currency || "TRY"
    }).format(Number(amount || 0));
}

export default function PaymentPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState(null);
    const [pageData, setPageData] = useState(null);
    const [config, setConfig] = useState(null);
    const [couponCode, setCouponCode] = useState("");
    const [couponPreview, setCouponPreview] = useState(null);
    const [checkoutContent, setCheckoutContent] = useState("");
    const [paymentPageUrl, setPaymentPageUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [validatingCoupon, setValidatingCoupon] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        fetch("/api/payments/config")
            .then((res) => res.json())
            .then((res) => {
                if (!cancelled && res.success) setConfig(res.data);
            })
            .catch(() => {
                if (!cancelled) setError("Odeme bilgileri alinamadi.");
            });

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push("/login");
                return;
            }

            try {
                setCurrentUser(user);
                const userSnap = await getDoc(doc(db, "users", user.uid));
                const userData = userSnap.exists() ? userSnap.data() : {};

                if (userData.paid === true) {
                    router.push("/dashboard");
                    return;
                }

                const pagesQuery = query(collection(db, "pages"), where("userId", "==", user.uid));
                const pagesSnap = await getDocs(pagesQuery);

                if (!pagesSnap.empty) {
                    const pageDoc = pagesSnap.docs[0];
                    setPageData({ id: pageDoc.id, ...pageDoc.data() });
                }
            } catch (err) {
                setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        });

        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, [router]);

    const finalAmount = useMemo(() => {
        if (couponPreview) return couponPreview.finalAmount;
        return config?.amount || 0;
    }, [config, couponPreview]);

    const handleValidateCoupon = async () => {
        if (!couponCode.trim() || !currentUser) return;

        setValidatingCoupon(true);
        setError("");
        setMessage("");

        try {
            const token = await currentUser.getIdToken();
            const response = await fetch("/api/coupons/validate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ couponCode })
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Indirim kodu uygulanamadi.");
            }

            setCouponPreview(result.data);
            setMessage("Indirim kodu uygulandi.");
        } catch (err) {
            setCouponPreview(null);
            setError(err.message);
        } finally {
            setValidatingCoupon(false);
        }
    };

    const handleStartPayment = async () => {
        if (!currentUser || !pageData) return;

        setStarting(true);
        setError("");
        setMessage("");
        setCheckoutContent("");
        setPaymentPageUrl("");

        try {
            const token = await currentUser.getIdToken();
            const response = await fetch("/api/payments/iyzico/initialize", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    pageId: pageData.id,
                    couponCode: couponCode.trim() || null
                })
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Odeme baslatilamadi.");
            }

            if (result.data?.requiresPayment === false) {
                router.push(result.data.redirectUrl || "/payment/callback?status=success");
                return;
            }

            if (result.data?.checkoutFormContent) {
                setCheckoutContent(result.data.checkoutFormContent);
                setPaymentPageUrl(result.data.paymentPageUrl || "");
                setMessage("Guvenli odeme formu hazir.");
                return;
            }

            if (result.data?.paymentPageUrl) {
                window.location.href = result.data.paymentPageUrl;
                return;
            }

            throw new Error("Iyzico odeme formu donmedi.");
        } catch (err) {
            setError(err.message);
        } finally {
            setStarting(false);
        }
    };

    if (loading) {
        return <main className={styles.paymentShell}><div className={styles.paymentPanel}><div className={styles.paymentBody}>Yukleniyor...</div></div></main>;
    }

    return (
        <main className={styles.paymentShell}>
            <section className={styles.paymentPanel}>
                <header className={styles.paymentHeader}>
                    <div>
                        <Link href="/dashboard" className={styles.backLink}>
                            <HiOutlineArrowLeft /> Panele don
                        </Link>
                        <p className={styles.eyebrow}>Tek seferlik odeme</p>
                        <h1 className={styles.title}>Sayfani yayina al</h1>
                        <p className={styles.subtitle}>
                            Odeme tamamlandiginda Firestore kullanici kaydina paid=true yazilir ve sayfan aktif hale gelir.
                        </p>
                    </div>
                    <div className={styles.secureBadge}>
                        <HiOutlineCheckCircle /> Iyzico guvenli odeme
                    </div>
                </header>

                <div className={styles.paymentBody}>
                    <aside className={styles.summaryBox}>
                        <h2 className={styles.summaryTitle}>Yayin paketi</h2>
                        <div className={styles.summaryRow}>
                            <span>{config?.packageName || "Sonsuz Ask Sayfa Yayini"}</span>
                            <strong>{formatCurrency(config?.amount, config?.currency)}</strong>
                        </div>
                        <div className={styles.summaryRow}>
                            <span>Indirim</span>
                            <strong>-{formatCurrency(couponPreview?.discountAmount || 0, config?.currency)}</strong>
                        </div>
                        <div className={styles.totalRow}>
                            <span>Odenecek tutar</span>
                            <strong>{formatCurrency(finalAmount, config?.currency)}</strong>
                        </div>

                        <div className={styles.couponForm}>
                            <input
                                className={styles.couponInput}
                                value={couponCode}
                                onChange={(event) => {
                                    setCouponCode(event.target.value);
                                    setCouponPreview(null);
                                }}
                                placeholder="Indirim kodu"
                            />
                            <button
                                type="button"
                                className={styles.couponBtn}
                                onClick={handleValidateCoupon}
                                disabled={validatingCoupon || !couponCode.trim()}
                            >
                                <HiOutlineTag /> {validatingCoupon ? "..." : "Uygula"}
                            </button>
                        </div>

                        {message && <div className={styles.messageSuccess}>{message}</div>}
                        {error && <div className={styles.messageError}>{error}</div>}

                        {!pageData ? (
                            <Link href="/dashboard" className={styles.secondaryBtn} style={{ marginTop: 18, width: "100%" }}>
                                <HiOutlineSparkles /> Once sayfani kaydet
                            </Link>
                        ) : (
                            <button
                                type="button"
                                className={styles.primaryBtn}
                                onClick={handleStartPayment}
                                disabled={starting || !config}
                            >
                                <HiOutlineCreditCard /> {starting ? "Hazirlaniyor..." : "Odeme formunu ac"}
                            </button>
                        )}
                    </aside>

                    <section className={styles.checkoutBox}>
                        {checkoutContent ? (
                            <>
                                <IyzicoForm content={checkoutContent} />
                                {paymentPageUrl && (
                                    <a href={paymentPageUrl} className={styles.secondaryBtn} target="_blank" rel="noreferrer" style={{ marginTop: 16 }}>
                                        Odeme sayfasini yeni sekmede ac
                                    </a>
                                )}
                            </>
                        ) : (
                            <div className={styles.checkoutPlaceholder}>
                                <div className={styles.checkoutIcon}>
                                    <HiOutlineCreditCard />
                                </div>
                                <h2 className={styles.summaryTitle}>Kart bilgileri Iyzico tarafinda alinir</h2>
                                <p>Formu actiginda kart bilgileri bu alanda guvenli olarak gorunecek.</p>
                            </div>
                        )}
                    </section>
                </div>
            </section>
        </main>
    );
}
