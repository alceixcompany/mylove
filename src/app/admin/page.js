"use client";
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
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
    HiOutlineServerStack,
    HiOutlineEye,
    HiOutlineFunnel
} from "react-icons/hi2";

const ITEMS_PER_PAGE = 10;
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

function formatDateValue(value) {
    if (!value) return '-';

    let date = null;

    if (typeof value?.toDate === 'function') {
        date = value.toDate();
    } else if (typeof value === 'string' || typeof value === 'number') {
        date = new Date(value);
    } else if (typeof value === 'object' && typeof value.seconds === 'number') {
        date = new Date(value.seconds * 1000);
    }

    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        return '-';
    }

    return date.toLocaleString('tr-TR');
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
    const [dataError, setDataError] = useState('');
    const [deletingUserId, setDeletingUserId] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('all');

    // Pagination states
    const [pageState, setPageState] = useState({
        overview: 1,
        users: 1,
        pages: 1,
        referrals: 1
    });
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
                fetchData(currentUser);
                fetchPaymentSettings(currentUser);
            } else {
                router.push('/login');
            }
        });
        return () => unsubscribe();
    }, []);

    const fetchData = async (currentUser = user || auth.currentUser) => {
        setLoading(true);
        setDataError('');
        try {
            if (!currentUser) return;
            const currentToken = await currentUser.getIdToken();
            const response = await fetch('/api/admin/dashboard', {
                headers: { Authorization: `Bearer ${currentToken}` }
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Admin verileri alinamadi.');
            }

            const users = result.data.users || [];
            const pages = result.data.pages || [];
            const refs = result.data.referrals || [];
            const payments = result.data.payments || [];

            setUsersList(users);
            setPagesList(pages);
            setReferrals(refs);

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
            setDataError(error.message || 'Admin verileri alinamadi.');
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

        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/admin/referrals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newRefName,
                    amount,
                    discountType: newRefDiscountType,
                    usageLimit: newRefLimit ? parseInt(newRefLimit, 10) : null,
                    expiryDate: newRefExpiry || null,
                    currency: paymentSettings.package.currency
                })
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Referans kodu olusturulamadi.');
            }

            setReferralMessage(`Referans kodu olusturuldu: ${result.data.code}`);
        } catch (error) {
            setReferralError(error.message || 'Referans kodu olusturulamadi.');
            return;
        }

        setNewRefName('');
        setNewRefDiscount('');
        setNewRefDiscountType('percentage');
        setNewRefLimit('');
        setNewRefExpiry('');
        fetchData();
    };

    const deleteReferral = async (id) => {
        const token = await user.getIdToken();
        const response = await fetch(`/api/admin/referrals/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
            setReferralError(result.message || 'Referans kodu silinemedi.');
            return;
        }

        fetchData();
    };

    const deleteUser = async (userId) => {
        if (!user || !window.confirm('Bu kullanici ve ilgili verileri silinsin mi?')) return;

        setDeletingUserId(userId);
        setDataError('');

        try {
            const token = await user.getIdToken();
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Kullanici silinemedi.');
            }

            fetchData();
        } catch (error) {
            setDataError(error.message || 'Kullanici silinemedi.');
        } finally {
            setDeletingUserId('');
        }
    };

    // Pagination helper
    const paginate = (data, page) => {
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        return data.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    };

    const totalPages = (data) => Math.ceil(data.length / ITEMS_PER_PAGE);

    const setTabPage = (tab, page) => {
        setPageState((prev) => ({ ...prev, [tab]: page }));
    };

    const renderPagination = (tab, data) => {
        const currentPage = pageState[tab] || 1;
        const pageCount = totalPages(data);

        if (data.length <= ITEMS_PER_PAGE) return null;

        return (
            <div className={styles.pagination}>
                <button
                    disabled={currentPage === 1}
                    onClick={() => setTabPage(tab, currentPage - 1)}
                    className={styles.pageBtn}
                >
                    <HiOutlineChevronLeft />
                </button>
                <span className={styles.pageInfo}>{currentPage} / {pageCount}</span>
                <button
                    disabled={currentPage === pageCount}
                    onClick={() => setTabPage(tab, currentPage + 1)}
                    className={styles.pageBtn}
                >
                    <HiOutlineChevronRight />
                </button>
            </div>
        );
    };

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
                            {paginate(pagesList, pageState.overview).map(page => (
                                <tr key={page.id}>
                                    <td><a href={`/${page.urlSlug}`} target="_blank" style={{ color: 'var(--primary-rose)', fontWeight: '600' }}>/{page.urlSlug}</a></td>
                                    <td>{page.hits || 0}</td>
                                    <td>{page.userId?.substring(0, 8)}...</td>
                                    <td>{formatDateValue(page.updatedAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {renderPagination('overview', pagesList)}
            </div>
        </>
    );

    const renderUsers = () => {
        const data = usersList.filter((entry) => {
            if (paymentFilter === 'paid') return entry.paid === true;
            if (paymentFilter === 'unpaid') return entry.paid !== true;
            return true;
        });
        const currentData = paginate(data, pageState.users);
        return (
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div>
                        <h2 className={styles.sectionTitle}>Kayıtlı Kullanıcılar</h2>
                        <span className={styles.pageInfo}>{data.length} Toplam</span>
                    </div>
                    <div className={styles.filterGroup}>
                        <span className={styles.filterLabel}><HiOutlineFunnel /> Odeme</span>
                        <button onClick={() => setPaymentFilter('all')} className={`${styles.filterBtn} ${paymentFilter === 'all' ? styles.filterBtnActive : ''}`}>Tumu</button>
                        <button onClick={() => setPaymentFilter('paid')} className={`${styles.filterBtn} ${paymentFilter === 'paid' ? styles.filterBtnActive : ''}`}>Odedi</button>
                        <button onClick={() => setPaymentFilter('unpaid')} className={`${styles.filterBtn} ${paymentFilter === 'unpaid' ? styles.filterBtnActive : ''}`}>Bekliyor</button>
                    </div>
                </div>
                {dataError && <div className={styles.errorBox}>{dataError}</div>}
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead><tr><th>E-posta</th><th>Kayit / Son Giris</th><th>Odeme</th><th>Sayfa</th><th>Sil</th></tr></thead>
                        <tbody>
                            {currentData.map(u => {
                                const page = pagesList.find((entry) => entry.userId === u.id);
                                return (
                                    <tr key={u.id}>
                                        <td>{u.email}</td>
                                        <td>
                                            <div className={styles.metaStack}>
                                                <span>Kayit: {formatDateValue(u.createdAt)}</span>
                                                <span>Son giris: {formatDateValue(u.lastLogin)}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`${styles.badge} ${u.paid === true ? styles.premiumBadge : styles.freeBadge}`}>
                                                {u.paid === true ? 'Odedi' : 'Bekliyor'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.rowActions}>
                                                {page?.urlSlug ? (
                                                    <a
                                                        href={`/${page.urlSlug}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className={styles.iconAction}
                                                        title="Gozat"
                                                        aria-label="Gozat"
                                                    >
                                                        <HiOutlineEye />
                                                    </a>
                                                ) : (
                                                    <span className={styles.iconActionDisabled} title="Sayfa yok" aria-hidden="true">
                                                        <HiOutlineEye />
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => deleteUser(u.id)}
                                                    className={styles.dangerAction}
                                                    disabled={deletingUserId === u.id}
                                                    title="Sil"
                                                    aria-label="Sil"
                                                >
                                                    <HiOutlineTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {renderPagination('users', data)}
            </div>
        );
    };

    const renderPages = () => {
        const data = pagesList;
        const currentData = paginate(data, pageState.pages);
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
                {renderPagination('pages', data)}
            </div>
        );
    };

    const renderReferrals = () => {
        const data = referrals;
        const currentData = paginate(data, pageState.referrals);
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
                {renderPagination('referrals', data)}
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
                    <button onClick={() => setActiveTab('overview')} className={`${styles.navItem} ${activeTab === 'overview' ? styles.navItemActive : ''}`}><HiOutlineChartBar /> Genel Bakış</button>
                    <button onClick={() => setActiveTab('users')} className={`${styles.navItem} ${activeTab === 'users' ? styles.navItemActive : ''}`}><HiOutlineUsers /> Kullanıcılar</button>
                    <button onClick={() => setActiveTab('pages')} className={`${styles.navItem} ${activeTab === 'pages' ? styles.navItemActive : ''}`}><HiOutlineRectangleStack /> Sayfalar</button>
                    <button onClick={() => setActiveTab('referrals')} className={`${styles.navItem} ${activeTab === 'referrals' ? styles.navItemActive : ''}`}><HiOutlineLink /> Referanslar</button>
                    <button onClick={() => setActiveTab('payments')} className={`${styles.navItem} ${activeTab === 'payments' ? styles.navItemActive : ''}`}><HiOutlineCog6Tooth /> Ödeme</button>
                </nav>
                <div style={{ marginTop: 'auto' }}>
                    <button onClick={() => router.push('/dashboard')} className={styles.navItem}><HiOutlineChevronLeft /> Editöre Dön</button>
                    <button onClick={() => auth.signOut()} className={styles.navItem} style={{ color: '#ef4444' }}><HiOutlineArrowLeftOnRectangle /> Çıkış Yap</button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.mainContent}>
                {dataError && activeTab === 'overview' && <div className={styles.errorBox}>{dataError}</div>}
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'users' && renderUsers()}
                {activeTab === 'pages' && renderPages()}
                {activeTab === 'referrals' && renderReferrals()}
                {activeTab === 'payments' && renderPaymentSettings()}
            </main>
        </div>
    );
}
