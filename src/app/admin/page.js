"use client";
import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import styles from './admin.module.css';
import {
    HiOutlineUsers,
    HiOutlineCursorArrowRays,
    HiOutlineBanknotes,
    HiOutlineArrowPath,
    HiOutlineLink,
    HiOutlineTrash,
    HiOutlineChartBar,
    HiOutlineChevronLeft,
    HiOutlineChevronRight,
    HiOutlineRectangleStack,
    HiOutlineArrowLeftOnRectangle,
    HiOutlineCog6Tooth,
    HiOutlineCreditCard,
    HiOutlineKey,
    HiOutlineServerStack
} from "react-icons/hi2";

const ITEMS_PER_PAGE = 10;
const REFERRAL_CODE_LENGTH = 6;
const DEFAULT_PAYMENT_SETTINGS = {
    iyzico: {
        active: true,
        apiKey: '',
        secretKey: '',
        baseUrl: 'https://api.iyzipay.com',
        secretKeyConfigured: false
    },
    package: {
        packageKey: 'single_page_live',
        packageName: 'Sonsuz Ask Sayfa Yayini',
        amount: 499,
        currency: 'TRY'
    },
    appUrl: ''
};

function buildReferralCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: REFERRAL_CODE_LENGTH }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function formatReferralDiscount(ref, currency = 'TRY') {
    if (ref.discount) return ref.discount;

    const amount = Number(ref.amount || 0);
    const type = ref.discountType || 'fixed';

    if (type === 'percentage') {
        return `%${amount}`;
    }

    return `${amount} ${currency}`;
}

export default function AdminDashboard() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, users, pages, referrals

    // Data states
    const [stats, setStats] = useState({ totalUsers: 0, totalHits: 0, totalRevenue: 0, totalPages: 0 });
    const [usersList, setUsersList] = useState([]);
    const [pagesList, setPagesList] = useState([]);
    const [referrals, setReferrals] = useState([]);
    const [paymentSettings, setPaymentSettings] = useState(DEFAULT_PAYMENT_SETTINGS);
    const [paymentSettingsLoading, setPaymentSettingsLoading] = useState(false);
    const [paymentSettingsSaving, setPaymentSettingsSaving] = useState(false);
    const [paymentMessage, setPaymentMessage] = useState('');
    const [paymentError, setPaymentError] = useState('');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [newRefName, setNewRefName] = useState('');
    const [newRefDiscount, setNewRefDiscount] = useState('');
    const [newRefDiscountType, setNewRefDiscountType] = useState('percentage');
    const [newRefLimit, setNewRefLimit] = useState('');
    const [newRefExpiry, setNewRefExpiry] = useState('');
    const [referralMessage, setReferralMessage] = useState('');
    const [referralError, setReferralError] = useState('');
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                if (currentUser.email !== 'alceix@admin.com') {
                    router.push('/dashboard');
                    return;
                }
                setUser(currentUser);
                fetchData();
                fetchPaymentSettings(currentUser);
            } else {
                router.push('/login');
            }
        });
        return () => unsubscribe();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const usersSnap = await getDocs(collection(db, "users"));
            const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsersList(users);

            const pagesSnap = await getDocs(collection(db, "pages"));
            const pages = pagesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPagesList(pages);

            const refsSnap = await getDocs(collection(db, "referrals"));
            const refs = refsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setReferrals(refs);

            const paymentsSnap = await getDocs(collection(db, "payments"));
            const payments = paymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const totalHits = pages.reduce((acc, curr) => acc + (curr.hits || 0), 0);
            const paidRevenue = payments
                .filter(payment => payment.status === 'paid')
                .reduce((acc, payment) => acc + Number(payment.finalAmount || payment.amount || 0), 0);

            setStats({
                totalUsers: users.length,
                totalHits: totalHits,
                totalRevenue: paidRevenue,
                totalPages: pages.length
            });
        } catch (error) {
            console.error("Data fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPaymentSettings = async (currentUser = user) => {
        if (!currentUser) return;
        setPaymentSettingsLoading(true);
        setPaymentError('');
        try {
            const token = await currentUser.getIdToken();
            const response = await fetch('/api/admin/payment-settings', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Ödeme ayarları alınamadı.');
            }

            setPaymentSettings({
                ...DEFAULT_PAYMENT_SETTINGS,
                ...result.data,
                iyzico: {
                    ...DEFAULT_PAYMENT_SETTINGS.iyzico,
                    ...result.data.iyzico,
                    secretKey: ''
                },
                package: {
                    ...DEFAULT_PAYMENT_SETTINGS.package,
                    ...result.data.package
                }
            });
        } catch (error) {
            setPaymentError(error.message);
        } finally {
            setPaymentSettingsLoading(false);
        }
    };

    const updatePaymentSetting = (section, field, value) => {
        setPaymentSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const savePaymentSettings = async () => {
        if (!user) return;
        setPaymentSettingsSaving(true);
        setPaymentMessage('');
        setPaymentError('');
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/admin/payment-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(paymentSettings)
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Ödeme ayarları kaydedilemedi.');
            }

            setPaymentSettings({
                ...DEFAULT_PAYMENT_SETTINGS,
                ...result.data,
                iyzico: {
                    ...DEFAULT_PAYMENT_SETTINGS.iyzico,
                    ...result.data.iyzico,
                    secretKey: ''
                },
                package: {
                    ...DEFAULT_PAYMENT_SETTINGS.package,
                    ...result.data.package
                }
            });
            setPaymentMessage('Ödeme ayarları kaydedildi.');
        } catch (error) {
            setPaymentError(error.message);
        } finally {
            setPaymentSettingsSaving(false);
        }
    };

    const createReferral = async () => {
        if (!newRefName) return;
        setReferralMessage('');
        setReferralError('');

        const amount = Number.parseFloat(String(newRefDiscount).replace(',', '.'));
        if (!Number.isFinite(amount) || amount <= 0) {
            setReferralError('Referans indirimi icin gecerli bir deger girin.');
            return;
        }

        const refCode = buildReferralCode();
        const displayDiscount = newRefDiscountType === 'percentage'
            ? `%${amount}`
            : `${amount} ${paymentSettings.package.currency}`;
        const payload = {
            name: newRefName,
            code: refCode,
            clicks: 0,
            conversions: 0,
            discount: displayDiscount,
            discountType: newRefDiscountType,
            amount,
            usageLimit: newRefLimit ? parseInt(newRefLimit, 10) : null,
            expiryDate: newRefExpiry || null,
            usageCount: 0,
            usedCount: 0,
            isActive: true,
            createdAt: new Date().toISOString()
        };

        try {
            await Promise.all([
                setDoc(doc(db, "referrals", refCode), payload),
                setDoc(doc(db, "coupons", refCode), payload)
            ]);
        } catch (error) {
            setReferralError(error.message || 'Referans kodu olusturulamadi.');
            return;
        }

        setNewRefName('');
        setNewRefDiscount('');
        setNewRefDiscountType('percentage');
        setNewRefLimit('');
        setNewRefExpiry('');
        setReferralMessage(`Referans kodu olusturuldu: ${refCode}`);
        fetchData();
    };

    const deleteReferral = async (id) => {
        await Promise.all([
            deleteDoc(doc(db, "referrals", id)),
            deleteDoc(doc(db, "coupons", id))
        ]);
        fetchData();
    };

    // Pagination helper
    const paginate = (data) => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return data.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    };

    const totalPages = (data) => Math.ceil(data.length / ITEMS_PER_PAGE);

    if (loading) return <div className={styles.loading}>Yükleniyor...</div>;

    const renderOverview = () => (
        <>
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.iconWrapper} style={{ background: '#ecfdf5', color: '#059669' }}><HiOutlineUsers /></div>
                    <span className={styles.statValue}>{stats.totalUsers}</span>
                    <span className={styles.statLabel}>Toplam Kullanıcı</span>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.iconWrapper} style={{ background: '#fef2f2', color: '#dc2626' }}><HiOutlineCursorArrowRays /></div>
                    <span className={styles.statValue}>{stats.totalHits}</span>
                    <span className={styles.statLabel}>Toplam Ziyaret</span>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.iconWrapper} style={{ background: '#f0f9ff', color: '#0284c7' }}><HiOutlineBanknotes /></div>
                    <span className={styles.statValue}>{stats.totalRevenue} TL</span>
                    <span className={styles.statLabel}>Tahmini Kazanç</span>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.iconWrapper} style={{ background: '#faf5ff', color: '#9333ea' }}><HiOutlineArrowPath /></div>
                    <span className={styles.statValue}>{stats.totalPages}</span>
                    <span className={styles.statLabel}>Oluşturulan Sayfa</span>
                </div>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Son Aktivite</h2>
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr><th>Sayfa</th><th>Hit</th><th>Kullanıcı</th><th>Tarih</th></tr>
                        </thead>
                        <tbody>
                            {pagesList.slice(0, 5).map(page => (
                                <tr key={page.id}>
                                    <td><a href={`/${page.urlSlug}`} target="_blank" style={{ color: 'var(--primary-rose)', fontWeight: '600' }}>/{page.urlSlug}</a></td>
                                    <td>{page.hits || 0}</td>
                                    <td>{page.userId?.substring(0, 8)}...</td>
                                    <td>{new Date(page.updatedAt || Date.now()).toLocaleDateString('tr-TR')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );

    const renderUsers = () => {
        const data = usersList;
        const currentData = paginate(data);
        return (
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Kayıtlı Kullanıcılar</h2>
                    <span className={styles.pageInfo}>{data.length} Toplam</span>
                </div>
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead><tr><th>E-posta</th><th>Son Giriş</th><th>Giriş Sayısı</th></tr></thead>
                        <tbody>
                            {currentData.map(u => (
                                <tr key={u.id}>
                                    <td>{u.email}</td>
                                    <td>{u.lastLogin ? new Date(u.lastLogin).toLocaleString('tr-TR') : '-'}</td>
                                    <td>{u.loginCount || 1}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {data.length > ITEMS_PER_PAGE && (
                    <div className={styles.pagination}>
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className={styles.pageBtn}><HiOutlineChevronLeft /></button>
                        <span className={styles.pageInfo}>{currentPage} / {totalPages(data)}</span>
                        <button disabled={currentPage === totalPages(data)} onClick={() => setCurrentPage(prev => prev + 1)} className={styles.pageBtn}><HiOutlineChevronRight /></button>
                    </div>
                )}
            </div>
        );
    };

    const renderPages = () => {
        const data = pagesList;
        const currentData = paginate(data);
        return (
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Tüm Sayfalar</h2>
                    <span className={styles.pageInfo}>{data.length} Toplam</span>
                </div>
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead><tr><th>Link</th><th>Kullanıcı</th><th>Ziyaret</th><th>Durum</th></tr></thead>
                        <tbody>
                            {currentData.map(page => (
                                <tr key={page.id}>
                                    <td><a href={`/${page.urlSlug}`} target="_blank" style={{ color: 'var(--primary-rose)', fontWeight: '600' }}>/{page.urlSlug}</a></td>
                                    <td>{page.userId?.substring(0, 8)}...</td>
                                    <td>{page.hits || 0}</td>
                                    <td><span className={`${styles.badge} ${page.isLive ? styles.premiumBadge : styles.freeBadge}`}>{page.isLive ? 'Yayında' : 'Taslak'}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {data.length > ITEMS_PER_PAGE && (
                    <div className={styles.pagination}>
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className={styles.pageBtn}><HiOutlineChevronLeft /></button>
                        <span className={styles.pageInfo}>{currentPage} / {totalPages(data)}</span>
                        <button disabled={currentPage === totalPages(data)} onClick={() => setCurrentPage(prev => prev + 1)} className={styles.pageBtn}><HiOutlineChevronRight /></button>
                    </div>
                )}
            </div>
        );
    };

    const renderReferrals = () => {
        const data = referrals;
        const currentData = paginate(data);
        return (
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Referans Bağlantıları</h2>
                </div>

                {referralMessage && <div className={styles.successBox}>{referralMessage}</div>}
                {referralError && <div className={styles.errorBox}>{referralError}</div>}

                <div className={styles.refForm}>
                    <div className={styles.refInputGroup}>
                        <input type="text" className={styles.input} placeholder="Kaynak Adı (örn: Instagram)" value={newRefName} onChange={(e) => setNewRefName(e.target.value)} />
                        <div className={styles.formGridTwo}>
                            <input type="number" min="0" step="0.01" className={styles.input} placeholder={newRefDiscountType === 'percentage' ? 'İndirim yüzdesi' : 'İndirim tutarı'} value={newRefDiscount} onChange={(e) => setNewRefDiscount(e.target.value)} />
                            <select className={styles.input} value={newRefDiscountType} onChange={(e) => setNewRefDiscountType(e.target.value)}>
                                <option value="percentage">%</option>
                                <option value="fixed">{paymentSettings.package.currency}</option>
                            </select>
                        </div>
                    </div>
                    <div className={styles.refInputGroup}>
                        <input type="number" className={styles.input} placeholder="Kişi Limiti (Opsiyonel)" value={newRefLimit} onChange={(e) => setNewRefLimit(e.target.value)} />
                        <input type="date" className={styles.input} value={newRefExpiry} onChange={(e) => setNewRefExpiry(e.target.value)} />
                    </div>
                    <button onClick={createReferral} className={styles.btn}>Referans Kodu Oluştur</button>
                </div>

                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead><tr><th>Kaynak</th><th>Kod</th><th>İndirim</th><th>Tık/Limit</th><th>Son Tarih</th><th>Sil</th></tr></thead>
                        <tbody>
                            {currentData.map(ref => {
                                const isExpired = ref.expiryDate && new Date(ref.expiryDate) < new Date();
                                const usageCount = ref.usedCount || ref.usageCount || 0;
                                const isLimitReached = ref.usageLimit && usageCount >= ref.usageLimit;

                                return (
                                    <tr key={ref.id}>
                                        <td>{ref.name}</td>
                                        <td><code>{ref.code}</code></td>
                                        <td style={{ fontWeight: '700', color: 'var(--primary-rose)' }}>{formatReferralDiscount(ref, paymentSettings.package.currency)}</td>
                                        <td>
                                            {usageCount} / {ref.usageLimit || '∞'}
                                            {isLimitReached && <span className={styles.limitedBadge} style={{ marginLeft: '5px', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '100px' }}>DOLU</span>}
                                        </td>
                                        <td>
                                            {ref.expiryDate ? new Date(ref.expiryDate).toLocaleDateString('tr-TR') : '∞'}
                                            {isExpired && <span className={styles.expiredBadge} style={{ marginLeft: '5px', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '100px' }}>BİTTİ</span>}
                                        </td>
                                        <td><button onClick={() => deleteReferral(ref.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><HiOutlineTrash /></button></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {data.length > ITEMS_PER_PAGE && (
                    <div className={styles.pagination}>
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className={styles.pageBtn}><HiOutlineChevronLeft /></button>
                        <span className={styles.pageInfo}>{currentPage} / {totalPages(data)}</span>
                        <button disabled={currentPage === totalPages(data)} onClick={() => setCurrentPage(prev => prev + 1)} className={styles.pageBtn}><HiOutlineChevronRight /></button>
                    </div>
                )}
            </div>
        );
    };

    const renderPaymentSettings = () => (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <div>
                    <h2 className={styles.sectionTitle}>Ödeme Ayarları</h2>
                    <p className={styles.sectionHint}>Iyzico canlı bilgileri ve tek seferlik yayın paketini buradan yönet.</p>
                </div>
                <span className={`${styles.badge} ${paymentSettings.iyzico.active ? styles.premiumBadge : styles.freeBadge}`}>
                    {paymentSettings.iyzico.active ? 'Aktif' : 'Pasif'}
                </span>
            </div>

            {paymentMessage && <div className={styles.successBox}>{paymentMessage}</div>}
            {paymentError && <div className={styles.errorBox}>{paymentError}</div>}

            <div className={styles.settingsGrid}>
                <div className={styles.settingsCard}>
                    <h3><HiOutlineCreditCard /> Paket</h3>
                    <label className={styles.label}>Paket anahtarı</label>
                    <input
                        className={styles.input}
                        value={paymentSettings.package.packageKey}
                        onChange={(event) => updatePaymentSetting('package', 'packageKey', event.target.value)}
                        placeholder="single_page_live"
                    />

                    <label className={styles.label}>Paket adı</label>
                    <input
                        className={styles.input}
                        value={paymentSettings.package.packageName}
                        onChange={(event) => updatePaymentSetting('package', 'packageName', event.target.value)}
                        placeholder="Sonsuz Ask Sayfa Yayini"
                    />

                    <div className={styles.formGridTwo}>
                        <div>
                            <label className={styles.label}>Fiyat</label>
                            <input
                                className={styles.input}
                                type="number"
                                min="0"
                                step="0.01"
                                value={paymentSettings.package.amount}
                                onChange={(event) => updatePaymentSetting('package', 'amount', event.target.value)}
                            />
                        </div>
                        <div>
                            <label className={styles.label}>Para birimi</label>
                            <select
                                className={styles.input}
                                value={paymentSettings.package.currency}
                                onChange={(event) => updatePaymentSetting('package', 'currency', event.target.value)}
                            >
                                <option value="TRY">TRY</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className={styles.settingsCard}>
                    <h3><HiOutlineKey /> Iyzico Canlı</h3>
                    <label className={styles.checkboxLine}>
                        <input
                            type="checkbox"
                            checked={paymentSettings.iyzico.active}
                            onChange={(event) => updatePaymentSetting('iyzico', 'active', event.target.checked)}
                        />
                        Ödeme sistemi aktif
                    </label>

                    <label className={styles.label}>API Key</label>
                    <input
                        className={styles.input}
                        value={paymentSettings.iyzico.apiKey}
                        onChange={(event) => updatePaymentSetting('iyzico', 'apiKey', event.target.value)}
                        placeholder="Iyzico canlı API key"
                    />

                    <label className={styles.label}>Secret Key</label>
                    <input
                        className={styles.input}
                        type="password"
                        value={paymentSettings.iyzico.secretKey}
                        onChange={(event) => updatePaymentSetting('iyzico', 'secretKey', event.target.value)}
                        placeholder={paymentSettings.iyzico.secretKeyConfigured ? 'Kayıtlı secret korunacak' : 'Iyzico canlı secret key'}
                    />

                    <div className={styles.liveEndpoint}>
                        <HiOutlineServerStack />
                        <div>
                            <strong>Canlı endpoint</strong>
                            <span>https://api.iyzipay.com</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.settingsCard} style={{ marginTop: 20 }}>
                <h3><HiOutlineCog6Tooth /> Site</h3>
                <label className={styles.label}>Canlı site adresi</label>
                <input
                    className={styles.input}
                    value={paymentSettings.appUrl}
                    onChange={(event) => setPaymentSettings(prev => ({ ...prev, appUrl: event.target.value }))}
                    placeholder="https://askarsivi.com"
                />
                <p className={styles.sectionHint}>Iyzico callback sonrası kullanıcı bu adrese yönlendirilir. Canlıda domaini eksiksiz yaz.</p>
            </div>

            <div className={styles.settingsActions}>
                <button onClick={() => fetchPaymentSettings()} className={`${styles.btn} ${styles.btnOutline}`} disabled={paymentSettingsLoading || paymentSettingsSaving}>
                    Yenile
                </button>
                <button onClick={savePaymentSettings} className={styles.btn} disabled={paymentSettingsSaving}>
                    {paymentSettingsSaving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                </button>
            </div>
        </div>
    );

    return (
        <div className={styles.adminLayout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.logoArea}>Sonsuz Aşk</div>
                <nav className={styles.navMenu}>
                    <button onClick={() => { setActiveTab('overview'); setCurrentPage(1); }} className={`${styles.navItem} ${activeTab === 'overview' ? styles.navItemActive : ''}`}><HiOutlineChartBar /> Genel Bakış</button>
                    <button onClick={() => { setActiveTab('users'); setCurrentPage(1); }} className={`${styles.navItem} ${activeTab === 'users' ? styles.navItemActive : ''}`}><HiOutlineUsers /> Kullanıcılar</button>
                    <button onClick={() => { setActiveTab('pages'); setCurrentPage(1); }} className={`${styles.navItem} ${activeTab === 'pages' ? styles.navItemActive : ''}`}><HiOutlineRectangleStack /> Sayfalar</button>
                    <button onClick={() => { setActiveTab('referrals'); setCurrentPage(1); }} className={`${styles.navItem} ${activeTab === 'referrals' ? styles.navItemActive : ''}`}><HiOutlineLink /> Referanslar</button>
                    <button onClick={() => { setActiveTab('payments'); setCurrentPage(1); }} className={`${styles.navItem} ${activeTab === 'payments' ? styles.navItemActive : ''}`}><HiOutlineCog6Tooth /> Ödeme</button>
                </nav>
                <div style={{ marginTop: 'auto' }}>
                    <button onClick={() => router.push('/dashboard')} className={styles.navItem}><HiOutlineChevronLeft /> Editöre Dön</button>
                    <button onClick={() => auth.signOut()} className={styles.navItem} style={{ color: '#ef4444' }}><HiOutlineArrowLeftOnRectangle /> Çıkış Yap</button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.mainContent}>
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'users' && renderUsers()}
                {activeTab === 'pages' && renderPages()}
                {activeTab === 'referrals' && renderReferrals()}
                {activeTab === 'payments' && renderPaymentSettings()}
            </main>
        </div>
    );
}
