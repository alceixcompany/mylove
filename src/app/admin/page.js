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
    HiOutlineArrowLeftOnRectangle
} from "react-icons/hi2";

const ITEMS_PER_PAGE = 10;

export default function AdminDashboard() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, users, pages, referrals

    // Data states
    const [stats, setStats] = useState({ totalUsers: 0, totalHits: 0, totalRevenue: 0, totalPages: 0 });
    const [usersList, setUsersList] = useState([]);
    const [pagesList, setPagesList] = useState([]);
    const [referrals, setReferrals] = useState([]);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [newRefName, setNewRefName] = useState('');
    const [newRefDiscount, setNewRefDiscount] = useState('');
    const [newRefLimit, setNewRefLimit] = useState('');
    const [newRefExpiry, setNewRefExpiry] = useState('');
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

            const totalHits = pages.reduce((acc, curr) => acc + (curr.hits || 0), 0);
            const premiumPages = pages.filter(p => p.isPremium).length;

            setStats({
                totalUsers: users.length,
                totalHits: totalHits,
                totalRevenue: premiumPages * 250,
                totalPages: pages.length
            });
        } catch (error) {
            console.error("Data fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const createReferral = async () => {
        if (!newRefName) return;
        const refCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        await setDoc(doc(db, "referrals", refCode), {
            name: newRefName,
            code: refCode,
            clicks: 0,
            conversions: 0,
            discount: newRefDiscount || '0',
            usageLimit: newRefLimit ? parseInt(newRefLimit) : null,
            expiryDate: newRefExpiry || null,
            usageCount: 0,
            createdAt: new Date().toISOString()
        });
        setNewRefName('');
        setNewRefDiscount('');
        setNewRefLimit('');
        setNewRefExpiry('');
        fetchData();
    };

    const deleteReferral = async (id) => {
        await deleteDoc(doc(db, "referrals", id));
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
                                    <td><span className={`${styles.badge} ${page.isPremium ? styles.premiumBadge : styles.freeBadge}`}>{page.isPremium ? 'Premium' : 'Ücretsiz'}</span></td>
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

                <div className={styles.refForm}>
                    <div className={styles.refInputGroup}>
                        <input type="text" className={styles.input} placeholder="Kaynak Adı (örn: Instagram)" value={newRefName} onChange={(e) => setNewRefName(e.target.value)} />
                        <input type="text" className={styles.input} placeholder="İndirim (örn: %20 veya 50TL)" value={newRefDiscount} onChange={(e) => setNewRefDiscount(e.target.value)} />
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
                                const isLimitReached = ref.usageLimit && (ref.clicks || 0) >= ref.usageLimit;

                                return (
                                    <tr key={ref.id}>
                                        <td>{ref.name}</td>
                                        <td><code>{ref.code}</code></td>
                                        <td style={{ fontWeight: '700', color: 'var(--primary-rose)' }}>{ref.discount}</td>
                                        <td>
                                            {ref.clicks || 0} / {ref.usageLimit || '∞'}
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
            </main>
        </div>
    );
}
