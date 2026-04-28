"use client";
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

// DND Kit
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';

// Components
import Hero from '@/components/Hero/Hero';
import Timeline from '@/components/Timeline/Timeline';
import Guestbook from '@/components/Guestbook/Guestbook';
import RSVP from '@/components/RSVP/RSVP';
import Venue from '@/components/Venue/Venue';
import Gallery from '@/components/Gallery/Gallery';
import MusicPlayer from '@/components/MusicPlayer/MusicPlayer';
import FloatingHearts from '@/components/FloatingHearts/FloatingHearts';
import { uploadImage, getYoutubeMetadata } from '../actions/upload';

// Icons
import {
    HiOutlineSparkles,
    HiOutlineClock,
    HiOutlineMapPin,
    HiOutlinePhoto,
    HiOutlineBookOpen,
    HiOutlineEnvelope,
    HiOutlineMusicalNote,
    HiOutlineEye,
    HiOutlineEyeSlash,
    HiOutlinePencilSquare,
    HiOutlineEllipsisVertical,
    HiOutlineLink,
    HiOutlineDevicePhoneMobile,
    HiOutlineComputerDesktop,
    HiOutlineArrowLeft,
    HiOutlineLockClosed,
    HiOutlineCheckCircle,
    HiOutlineCreditCard
} from "react-icons/hi2";

import styles from '../page.module.css';
import editorStyles from './editor.module.css';

const DEFAULT_SECTIONS = ['Hero', 'Timeline', 'Venue', 'Gallery', 'Guestbook', 'RSVP', 'Music'];

const SECTION_LABELS = {
    Hero: 'Kapak (Giriş)',
    Timeline: 'Hikayemiz',
    Venue: 'Mekan / Davet',
    Gallery: 'Anılarımız (Galeri)',
    Guestbook: 'Ziyaretçi Defteri',
    RSVP: 'LCV (Katılım)',
    Music: 'Müzik Çalar'
};

const SECTION_ICONS = {
    Hero: <HiOutlineSparkles />,
    Timeline: <HiOutlineClock />,
    Venue: <HiOutlineMapPin />,
    Gallery: <HiOutlinePhoto />,
    Guestbook: <HiOutlineBookOpen />,
    RSVP: <HiOutlineEnvelope />,
    Music: <HiOutlineMusicalNote />
};

function SortableSection({ id, children, onEdit, isEditing }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        position: 'relative',
        marginBottom: '0px',
        border: isEditing ? '2px solid var(--primary-rose)' : '2px solid transparent',
        borderRadius: '12px',
        overflow: 'hidden'
    };

    return (
        <div ref={setNodeRef} style={style} className={editorStyles.sortableItem}>
            <div className={editorStyles.sectionControls}>
                <div {...attributes} {...listeners} className={editorStyles.dragHandle} title="Sırala">
                    <HiOutlineEllipsisVertical />
                </div>
                <button onClick={() => onEdit(id)} className={editorStyles.editBtn} title="Düzenle">
                    <HiOutlinePencilSquare /> {SECTION_LABELS[id]}
                </button>
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
                {children}
            </div>
        </div>
    );
}

function SidebarSortableItem({ id, isVisible, onToggle, onEdit }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className={editorStyles.sidebarOrderItem}>
            <div {...attributes} {...listeners} className={editorStyles.sidebarDragHandle}>
                <HiOutlineEllipsisVertical />
            </div>
            <div className={editorStyles.sidebarItemInfo}>
                <button
                    onClick={() => onToggle(id)}
                    className={isVisible ? editorStyles.visibilityBtnActive : editorStyles.visibilityBtn}
                >
                    {isVisible ? <HiOutlineEye /> : <HiOutlineEyeSlash />}
                </button>
                <span className={editorStyles.sectionIcon}>{SECTION_ICONS[id]}</span>
                <span style={{ opacity: isVisible ? 1 : 0.5 }}>{SECTION_LABELS[id]}</span>
            </div>
            <button onClick={() => onEdit(id)} className={editorStyles.sidebarMiniEditBtn}>
                <HiOutlinePencilSquare />
            </button>
        </div>
    );
}

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pageData, setPageData] = useState(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [activeEditor, setActiveEditor] = useState(null);
    const [previewDevice, setPreviewDevice] = useState('phone');
    const [visibleSections, setVisibleSections] = useState(DEFAULT_SECTIONS);
    const router = useRouter();


    const [slug, setSlug] = useState('');
    const [sectionOrder, setSectionOrder] = useState(DEFAULT_SECTIONS);
    const [formData, setFormData] = useState({
        heroTitle: 'İki Ruh, Tek Yolculuk',
        heroSubtitle: 'Bizim Hikayemiz Başlıyor',
        heroQuote: 'Seninle tanışmak, en sevdiğim şarkıyı ilk kez dinlemek ve onun hayatımın şarkısı olacağını o andan bilmek gibiydi.',
        heroImage: '/images/hero.png',
        venueName: 'Kız Kulesi, İstanbul',
        venueAddress: 'Salacak Mevkii, Üsküdar/İstanbul',
        venueTime: '20:00 - 14 Şubat Cumartesi',
        venueImage: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?q=80&w=1000&auto=format&fit=crop',
        storyEvents: [
            { date: 'Bahar 2019', title: 'İlk Karşılaşma', description: 'Gözlerimizin buluştuğu o an, hayatımın en güzel hikayesinin başladığını biliyordum.', image: '/images/story-1.png' },
            { date: 'Yaz 2019', title: 'İlk Randevu', description: 'Saatlerce süren heyecan dolu o ilk yürüyüşümüz...', image: '/images/story-2.png' },
            { date: 'Kış 2022', title: 'O Büyük Gün', description: 'Hayatımızı birleştirmeye karar verdiğimiz, en mutlu anımız.', image: '/images/story-3.png' },
            { date: 'Bugün', title: 'Sonsuz Aşk', description: 'Sonsuzluğa doğru her geçen gün büyüyen sevgimizle yürüyoruz.', image: '/images/story-4.png' }
        ],
        galleryTitle: 'Anılarımız',
        gallerySubtitle: 'Aşk dolu kareler',
        galleryImages: ["/images/story-4.png", "/images/gallery-1.png", "/images/gallery-2.png"],
        songTitle: 'Bizim Şarkımız',
        artistName: 'Sizin Sanatçınız',
        musicThumb: '/images/music-thumb.png',
        songUrl: '',
        isProtected: false,
        protectionQuestion: '',
        protectionAnswer: '',
        protectionAnswer: '',
        guestMessages: [],
        guestbookTitle: 'Aşk Notları',
        guestbookTitle: 'Aşk Notları',
        guestbookSubtitle: 'Kalbimizden dökülen kelimeler',
        rsvpTitle: 'Sevgilim Olur Musun?',
        rsvpSubtitle: 'Bu özel günü beraber geçirelim',
        rsvpYesOption: 'Evet, kesinlikle!',
        rsvpNoOption: 'Maalesef...',
        rsvpOptionsTitle: 'Akşam Planı Seçeneği',
        rsvpOptions: [
            { label: 'Romantik Bir Akşam Yemeği', value: 'dinner' },
            { label: 'Yıldızlar Altında Sinema', value: 'cinema' },
            { label: 'Sıcak Bir Ev Akşamı', value: 'home' }
        ],
        timelineTitle: 'Hikayemiz',
        timelineSubtitle: 'Unutulmaz anılarımız',
        countdownDate: new Date('2026-02-14').toISOString(),
        countdownTitle: "14 Şubat'a Kalan Zaman"
    });

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
    const hasPaid = userProfile?.paid === true;
    const canViewLivePage = Boolean(pageData && hasPaid && pageData.isLive !== false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            try {
                if (currentUser) {
                    setUser(currentUser);

                    // Update user stats for admin panel
                    const userRef = doc(db, "users", currentUser.uid);
                    await setDoc(userRef, {
                        email: currentUser.email,
                        lastLogin: new Date().toISOString(),
                        loginCount: increment(1)
                    }, { merge: true });

                    const userSnap = await getDoc(userRef);
                    setUserProfile(userSnap.exists() ? userSnap.data() : { paid: false });

                    // More robust way with atomic increment if we import it
                    // But let's just do a simple set for now to ensure the user exists in Firestore

                    const q = query(collection(db, "pages"), where("userId", "==", currentUser.uid));
                    const snapshot = await getDocs(q);
                    if (!snapshot.empty) {
                        const data = snapshot.docs[0].data();
                        setPageData({ ...data, id: snapshot.docs[0].id });
                        setSlug(data.urlSlug);
                        // Fix: Eğer firestore'da eksik component varsa defaultları ekle
                        const savedOrder = data.sectionOrder || DEFAULT_SECTIONS;
                        const finalOrder = [...new Set([...savedOrder, ...DEFAULT_SECTIONS])];
                        setSectionOrder(finalOrder);
                        setVisibleSections(data.visibleSections || finalOrder);

                        setFormData(prev => ({
                            ...prev,
                            heroTitle: data.heroTitle || prev.heroTitle,
                            heroSubtitle: data.heroSubtitle || prev.heroSubtitle,
                            heroQuote: data.heroQuote || prev.heroQuote,
                            heroImage: data.heroImage || prev.heroImage,
                            venueName: data.venue?.name || prev.venueName,
                            venueAddress: data.venue?.address || prev.venueAddress,
                            venueTime: data.venue?.time || prev.venueTime,
                            venueImage: data.venue?.imageUrl || prev.venueImage,
                            storyEvents: data.storyEvents || prev.storyEvents,
                            galleryTitle: data.galleryTitle || prev.galleryTitle,
                            gallerySubtitle: data.gallerySubtitle || prev.gallerySubtitle,
                            galleryImages: data.galleryImages || prev.galleryImages,
                            songTitle: data.songTitle || prev.songTitle,
                            artistName: data.artistName || prev.artistName,
                            musicThumb: data.musicThumb || prev.musicThumb,
                            songUrl: data.songUrl || '',
                            isProtected: data.isProtected || false,
                            protectionQuestion: data.protectionQuestion || '',
                            protectionQuestion: data.protectionQuestion || '',
                            protectionAnswer: data.protectionAnswer || '',
                            guestMessages: data.guestMessages || [],
                            guestbookTitle: data.guestbookTitle || prev.guestbookTitle,
                            guestbookTitle: data.guestbookTitle || prev.guestbookTitle,
                            guestbookSubtitle: data.guestbookSubtitle || prev.guestbookSubtitle,
                            rsvpTitle: data.rsvpTitle || prev.rsvpTitle,
                            rsvpSubtitle: data.rsvpSubtitle || prev.rsvpSubtitle,
                            rsvpYesOption: data.rsvpYesOption || prev.rsvpYesOption,
                            rsvpNoOption: data.rsvpNoOption || prev.rsvpNoOption,
                            rsvpOptionsTitle: data.rsvpOptionsTitle || prev.rsvpOptionsTitle,
                            rsvpOptions: data.rsvpOptions || prev.rsvpOptions,
                            timelineTitle: data.timelineTitle || prev.timelineTitle,
                            timelineSubtitle: data.timelineSubtitle || prev.timelineSubtitle,
                            countdownDate: data.countdownDate || prev.countdownDate,
                            countdownTitle: data.countdownTitle || prev.countdownTitle
                        }));
                    }
                } else {
                    router.push('/login');
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active && over && active.id !== over.id) {
            setSectionOrder((items) => {
                const oldIndex = items.indexOf(active.id);
                const newIndex = items.indexOf(over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleUpdateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleUpdateStory = (index, field, value) => {
        const newEvents = [...formData.storyEvents];
        newEvents[index] = { ...newEvents[index], [field]: value };
        setFormData(prev => ({ ...prev, storyEvents: newEvents }));
    };

    const handleUpdateGuestMessage = (index, field, value) => {
        const newMessages = [...formData.guestMessages];
        newMessages[index] = { ...newMessages[index], [field]: value };
        setFormData(prev => ({ ...prev, guestMessages: newMessages }));
    };

    const handleUpdateRsvpOption = (index, value) => {
        const newOptions = [...formData.rsvpOptions];
        newOptions[index] = { ...newOptions[index], label: value };
        setFormData(prev => ({ ...prev, rsvpOptions: newOptions }));
    };

    const handleAddRsvpOption = () => {
        setFormData(prev => ({
            ...prev,
            rsvpOptions: [...prev.rsvpOptions, { label: 'Yeni Seçenek', value: `option-${Date.now()}` }]
        }));
    };

    const handleDeleteRsvpOption = (index) => {
        const newOptions = formData.rsvpOptions.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, rsvpOptions: newOptions }));
    };

    const handleDeleteGuestMessage = (index) => {
        const newMessages = formData.guestMessages.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, guestMessages: newMessages }));
    };

    const moveSection = (index, direction) => {
        const newOrder = [...sectionOrder];
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= newOrder.length) return;
        [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
        setSectionOrder(newOrder);
    };

    const toggleSection = (id) => {
        setVisibleSections(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const handleFileUpload = async (e, field, index = null) => {
        const file = e.target.files[0];
        if (!file) return;
        setSaving(true);
        const fd = new FormData();
        fd.append('file', file);
        try {
            const url = await uploadImage(fd);
            if (index !== null) handleUpdateStory(index, field, url);
            else handleUpdateField(field, url);
            setMessage('Resim başarıyla yüklendi!');
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleGalleryImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSaving(true);
        const fd = new FormData();
        fd.append('file', file);
        try {
            const url = await uploadImage(fd);
            const newImages = [...formData.galleryImages, url];
            handleUpdateField('galleryImages', newImages);
            setMessage('Resim başarıyla galeriye eklendi!');
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteGalleryImage = (index) => {
        const newImages = formData.galleryImages.filter((_, i) => i !== index);
        handleUpdateField('galleryImages', newImages);
    };

    const handleYoutubeUrlChange = async (url) => {
        handleUpdateField('songUrl', url);
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            setSaving(true);
            try {
                const metadata = await getYoutubeMetadata(url);
                if (metadata) {
                    setFormData(prev => ({
                        ...prev,
                        songUrl: url,
                        songTitle: metadata.title || prev.songTitle,
                        artistName: metadata.artist || prev.artistName,
                        musicThumb: metadata.thumbnail || prev.musicThumb
                    }));
                }
            } catch (err) {
                console.error('Metadata fetch error:', err);
            } finally {
                setSaving(false);
            }
        }
    };

    const handleSaveAll = async (options = {}) => {
        const silent = options?.silent === true;
        setSaving(true);
        setMessage('');
        setError('');
        try {
            if (!user) {
                setError('Oturum bulunamadı.');
                return null;
            }

            const cleanSlug = slug.toLowerCase().trim().replace(/\s+/g, '-');

            if (!cleanSlug) {
                setError('Sayfa linki boş olamaz.');
                return null;
            }

            const now = new Date().toISOString();
            const isLive = hasPaid || pageData?.isLive === true;
            const dataToSave = {
                userId: user.uid,
                urlSlug: cleanSlug,
                sectionOrder,
                visibleSections,
                isLive,
                updatedAt: now,
                ...formData,
                venue: {
                    name: formData.venueName,
                    address: formData.venueAddress,
                    time: formData.venueTime,
                    imageUrl: formData.venueImage
                }
            };

            const slugChanged = !pageData || pageData.urlSlug !== cleanSlug;

            if (slugChanged) {
                const q = query(collection(db, "pages"), where("urlSlug", "==", cleanSlug));
                const snap = await getDocs(q);

                if (!snap.empty && snap.docs.some(page => page.id !== pageData?.id)) {
                    setError('Bu link daha önce alınmış.');
                    return null;
                }
            }

            let savedPage;

            if (!pageData) {
                const ref = doc(collection(db, "pages"));
                savedPage = { ...dataToSave, id: ref.id, createdAt: now };
                await setDoc(ref, savedPage);
                setPageData(savedPage);
            } else {
                await updateDoc(doc(db, "pages", pageData.id), {
                    ...dataToSave
                });
                savedPage = { ...pageData, ...dataToSave };
                setPageData(savedPage);
            }

            if (!silent) {
                setMessage(isLive ? 'Tüm değişiklikler başarıyla yayınlandı!' : 'Taslağın kaydedildi. Yayına almak için ödeme adımına geçebilirsin.');
            }
            setActiveEditor(null);
            return savedPage;
        } catch (err) {
            setError(err.message);
            return null;
        } finally {
            setSaving(false);
        }
    };

    const handleGoLive = async () => {
        const savedPage = await handleSaveAll({ silent: true });

        if (savedPage) {
            router.push('/payment');
        }
    };

    const renderComponent = (id) => {
        switch (id) {
            case 'Hero': return <Hero title={formData.heroTitle} subtitle={formData.heroSubtitle} imageUrl={formData.heroImage} quote={formData.heroQuote} countdownDate={formData.countdownDate} countdownTitle={formData.countdownTitle} />;
            case 'Timeline': return <Timeline title={formData.timelineTitle} subtitle={formData.timelineSubtitle} events={formData.storyEvents} />;
            case 'Venue': return <Venue name={formData.venueName} address={formData.venueAddress} time={formData.venueTime} imageUrl={formData.venueImage} />;
            case 'Gallery': return <Gallery title={formData.galleryTitle} subtitle={formData.gallerySubtitle} images={formData.galleryImages} />;
            case 'Guestbook': return <Guestbook title={formData.guestbookTitle} subtitle={formData.guestbookSubtitle} initialMessages={formData.guestMessages || []} />;
            case 'RSVP': return <RSVP
                title={formData.rsvpTitle}
                subtitle={formData.rsvpSubtitle}
                yesOption={formData.rsvpYesOption}
                noOption={formData.rsvpNoOption}
                optionsTitle={formData.rsvpOptionsTitle}
                options={formData.rsvpOptions}
            />;
            case 'Music': return (
                <MusicPlayer
                    songTitle={formData.songTitle}
                    artistName={formData.artistName}
                    thumbnailUrl={formData.musicThumb}
                    songUrl={formData.songUrl}
                    isDashboard={true}
                />
            );
            default: return null;
        }
    };

    const renderMusicPlayer = () => (
        <div onClick={() => setActiveEditor('Music')} style={{ cursor: 'pointer' }}>
            <MusicPlayer
                songTitle={formData.songTitle}
                artistName={formData.artistName}
                thumbnailUrl={formData.musicThumb}
                songUrl={formData.songUrl}
                isDashboard={true}
            />
        </div>
    );

    const [mobileTab, setMobileTab] = useState('editor'); // 'editor' | 'preview'

    if (loading) return <div className={editorStyles.loading}>Yükleniyor...</div>;

    return (
        <div className={editorStyles.dashboardLayout}>
            {/* Sidebar (Editor) */}
            <aside className={`${editorStyles.sidebar} ${mobileTab === 'preview' ? editorStyles.hiddenOnMobile : ''}`}>
                <div className={editorStyles.sidebarHeader}>
                    <div className={editorStyles.sidebarTitleRow}>
                        <h2>Aşk Paneli</h2>
                        {canViewLivePage && (
                            <a
                                href={`/${pageData.urlSlug}`}
                                target="_blank"
                                className={editorStyles.liveLink}
                                title="Canlı Sayfayı Gör"
                            >
                                <HiOutlineLink /> Gör
                            </a>
                        )}
                    </div>

                    <div className={`${editorStyles.deviceToggle} ${editorStyles.hiddenOnMobile}`}>
                        <button
                            onClick={() => setPreviewDevice('phone')}
                            className={previewDevice === 'phone' ? editorStyles.deviceBtnActive : editorStyles.deviceBtn}
                        >
                            <HiOutlineDevicePhoneMobile /> Mobil
                        </button>
                        <button
                            onClick={() => setPreviewDevice('desktop')}
                            className={previewDevice === 'desktop' ? editorStyles.deviceBtnActive : editorStyles.deviceBtn}
                        >
                            <HiOutlineComputerDesktop /> Masaüstü
                        </button>
                    </div>

                    <div className={editorStyles.slugHeaderCont}>
                        <div className={editorStyles.slugLabelRow}>
                            <HiOutlineLink /> <span>Sayfa Linkiniz:</span>
                        </div>
                        <div className={editorStyles.slugInputRow}>
                            <span>askarsivi.com/</span>
                            <input
                                type="text"
                                value={slug}
                                onChange={e => setSlug(e.target.value)}
                                placeholder="ayse-ali"
                                className={editorStyles.slugInputMinimal}
                            />
                        </div>
                    </div>

                    <div className={hasPaid ? editorStyles.liveStatusBox : editorStyles.paymentNoticeBox}>
                        <div className={editorStyles.statusIcon}>
                            {hasPaid ? <HiOutlineCheckCircle /> : <HiOutlineCreditCard />}
                        </div>
                        <div>
                            <strong>{hasPaid ? 'Sayfan yayında' : 'Taslak modunda'}</strong>
                            <span>
                                {hasPaid
                                    ? 'Kaydettiğin değişiklikler canlı sayfaya yansır.'
                                    : 'Sayfan kaydedilir, ödeme sonrası public link aktif olur.'}
                            </span>
                        </div>
                    </div>

                    <div className={editorStyles.publishActions}>
                        <button onClick={handleSaveAll} disabled={saving} className={editorStyles.saveBtn}>
                            {saving ? 'Kaydediliyor...' : (hasPaid ? 'Değişiklikleri Yayınla' : 'Taslağı Kaydet')}
                        </button>
                        {!hasPaid && (
                            <button onClick={handleGoLive} disabled={saving} className={editorStyles.publishBtn}>
                                Yayına Al
                            </button>
                        )}
                    </div>
                </div>

                <div className={editorStyles.sidebarContent}>
                    {message && <div className={editorStyles.successMsg}>{message}</div>}
                    {error && <div className={editorStyles.errorMsg}>{error}</div>}

                    {activeEditor && (
                        <button
                            onClick={() => setActiveEditor(null)}
                            className={editorStyles.backBtn}
                        >
                            <HiOutlineArrowLeft /> Geri Dön (Sayfa Yapısı)
                        </button>
                    )}

                    {/* Editor sections (Hero, Timeline, etc.) */}
                    {activeEditor === 'Hero' && (
                        <div className={editorStyles.sidebarItem}>
                            <h3>Kapak Ayarları</h3>
                            <label className={editorStyles.label}>Başlık</label>
                            <input type="text" value={formData.heroTitle} onChange={e => handleUpdateField('heroTitle', e.target.value)} className={editorStyles.input} />
                            <label className={editorStyles.label}>Alt Başlık</label>
                            <input type="text" value={formData.heroSubtitle} onChange={e => handleUpdateField('heroSubtitle', e.target.value)} className={editorStyles.input} />
                            <label className={editorStyles.label}>Sözünüz</label>
                            <textarea value={formData.heroQuote} onChange={e => handleUpdateField('heroQuote', e.target.value)} className={editorStyles.textarea} />

                            <label className={editorStyles.label}>Geri Sayım Başlığı</label>
                            <input type="text" value={formData.countdownTitle} onChange={e => handleUpdateField('countdownTitle', e.target.value)} className={editorStyles.input} />

                            <label className={editorStyles.label}>Hedef Tarih</label>
                            <input type="datetime-local" value={formData.countdownDate ? new Date(formData.countdownDate).toISOString().slice(0, 16) : ''} onChange={e => handleUpdateField('countdownDate', new Date(e.target.value).toISOString())} className={editorStyles.input} />

                            <label className={editorStyles.label}>Kapak Fotoğrafı</label>
                            <input type="file" onChange={e => handleFileUpload(e, 'heroImage')} className={editorStyles.input} />
                        </div>
                    )}

                    {activeEditor === 'Timeline' && (
                        <div className={editorStyles.sidebarItem}>
                            <h3>Hikayemiz</h3>
                            <label className={editorStyles.label}>Başlık</label>
                            <input type="text" value={formData.timelineTitle} onChange={e => handleUpdateField('timelineTitle', e.target.value)} className={editorStyles.input} />

                            <label className={editorStyles.label}>Alt Başlık</label>
                            <input type="text" value={formData.timelineSubtitle} onChange={e => handleUpdateField('timelineSubtitle', e.target.value)} className={editorStyles.input} />

                            <h4 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '0.9rem' }}>Olaylar</h4>
                            {formData.storyEvents.map((ev, i) => (
                                <div key={i} className={editorStyles.storyItemBox}>
                                    <strong>{i + 1}. Olay</strong>

                                    <label className={editorStyles.label} style={{ marginTop: '10px' }}>Tarih / Zaman</label>
                                    <input type="text" value={ev.date} onChange={e => handleUpdateStory(i, 'date', e.target.value)} className={editorStyles.input} placeholder="Örn: Bahar 2019" />

                                    <label className={editorStyles.label}>Başlık</label>
                                    <input type="text" value={ev.title} onChange={e => handleUpdateStory(i, 'title', e.target.value)} className={editorStyles.input} placeholder="Başlık" />

                                    <label className={editorStyles.label}>Açıklama</label>
                                    <textarea value={ev.description} onChange={e => handleUpdateStory(i, 'description', e.target.value)} className={editorStyles.textarea} placeholder="O anı anlatın..." />

                                    <label className={editorStyles.label}>Fotoğraf</label>
                                    <input type="file" onChange={e => handleFileUpload(e, 'image', i)} className={editorStyles.input} />
                                </div>
                            ))}
                        </div>
                    )}

                    {activeEditor === 'Venue' && (
                        <div className={editorStyles.sidebarItem}>
                            <h3>Mekan ve Davet Ayarları</h3>
                            <label className={editorStyles.label}>Mekan Adı</label>
                            <input type="text" value={formData.venueName} onChange={e => handleUpdateField('venueName', e.target.value)} className={editorStyles.input} />
                            <label className={editorStyles.label}>Adres</label>
                            <input type="text" value={formData.venueAddress} onChange={e => handleUpdateField('venueAddress', e.target.value)} className={editorStyles.input} />
                            <label className={editorStyles.label}>Zaman</label>
                            <input type="text" value={formData.venueTime} onChange={e => handleUpdateField('venueTime', e.target.value)} className={editorStyles.input} />
                            <label className={editorStyles.label}>Mekan Fotoğrafı</label>
                            <input type="file" onChange={e => handleFileUpload(e, 'venueImage')} className={editorStyles.input} />
                        </div>
                    )}

                    {activeEditor === 'Gallery' && (
                        <div className={editorStyles.sidebarItem}>
                            <h3>Galeri Ayarları</h3>
                            <label className={editorStyles.label}>Başlık</label>
                            <input type="text" value={formData.galleryTitle} onChange={e => handleUpdateField('galleryTitle', e.target.value)} className={editorStyles.input} />

                            <label className={editorStyles.label}>Alt Başlık</label>
                            <input type="text" value={formData.gallerySubtitle} onChange={e => handleUpdateField('gallerySubtitle', e.target.value)} className={editorStyles.input} />

                            <h4 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '0.9rem' }}>Galerideki Resimler</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
                                {formData.galleryImages.map((img, i) => (
                                    <div key={i} style={{ position: 'relative', width: '80px', height: '80px' }}>
                                        <img src={img} alt={`Gallery ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                                        <button
                                            onClick={() => handleDeleteGalleryImage(i)}
                                            style={{
                                                position: 'absolute', top: '-5px', right: '-5px',
                                                background: '#ff4d4f', color: 'white', border: 'none',
                                                borderRadius: '50%', width: '20px', height: '20px',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px'
                                            }}
                                            title="Sil"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <label className={editorStyles.label} style={{ cursor: 'pointer', display: 'inline-block', background: '#f0f0f0', padding: '8px 12px', borderRadius: '4px', fontSize: '0.9rem' }}>
                                + Yeni Resim Ekle
                                <input type="file" onChange={handleGalleryImageUpload} style={{ display: 'none' }} />
                            </label>
                        </div>
                    )}

                    {activeEditor === 'Guestbook' && (
                        <div className={editorStyles.sidebarItem}>

                            <h3>Ziyaretçi Defteri</h3>
                            <label className={editorStyles.label}>Başlık</label>
                            <input type="text" value={formData.guestbookTitle} onChange={e => handleUpdateField('guestbookTitle', e.target.value)} className={editorStyles.input} />
                            <label className={editorStyles.label}>Alt Başlık</label>
                            <input type="text" value={formData.guestbookSubtitle} onChange={e => handleUpdateField('guestbookSubtitle', e.target.value)} className={editorStyles.input} />

                            <p className={editorStyles.sidebarHint} style={{ marginTop: '20px' }}>Ziyaretçilerinizin bıraktığı notları buradan düzenleyebilir veya silebilirsiniz.</p>

                            {formData.guestMessages && formData.guestMessages.length > 0 ? (
                                formData.guestMessages.map((msg, i) => (
                                    <div key={i} className={editorStyles.storyItemBox} style={{ position: 'relative' }}>
                                        <button
                                            onClick={() => handleDeleteGuestMessage(i)}
                                            style={{
                                                position: 'absolute',
                                                right: '10px',
                                                top: '10px',
                                                background: '#ff4d4f',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                padding: '4px 8px',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem'
                                            }}
                                            title="Sil"
                                        >
                                            Sil
                                        </button>
                                        <strong>{i + 1}. Mesaj</strong>
                                        <label className={editorStyles.label} style={{ marginTop: '20px' }}>Yazan</label>
                                        <input
                                            type="text"
                                            value={msg.author}
                                            onChange={e => handleUpdateGuestMessage(i, 'author', e.target.value)}
                                            className={editorStyles.input}
                                        />
                                        <label className={editorStyles.label}>Mesaj</label>
                                        <textarea
                                            value={msg.text}
                                            onChange={e => handleUpdateGuestMessage(i, 'text', e.target.value)}
                                            className={editorStyles.textarea}
                                            rows={3}
                                        />
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#888', background: '#f9f9f9', borderRadius: '8px' }}>
                                    Henüz hiç mesaj yok.
                                </div>
                            )}
                        </div>
                    )}

                    {activeEditor === 'RSVP' && (
                        <div className={editorStyles.sidebarItem}>
                            <h3>LCV Ayarları</h3>
                            <label className={editorStyles.label}>Başlık</label>
                            <input type="text" value={formData.rsvpTitle} onChange={e => handleUpdateField('rsvpTitle', e.target.value)} className={editorStyles.input} />

                            <label className={editorStyles.label}>Alt Başlık</label>
                            <input type="text" value={formData.rsvpSubtitle} onChange={e => handleUpdateField('rsvpSubtitle', e.target.value)} className={editorStyles.input} />

                            <h4 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '0.9rem' }}>Katılım Seçenekleri</h4>
                            <label className={editorStyles.label}>Evet metni</label>
                            <input type="text" value={formData.rsvpYesOption} onChange={e => handleUpdateField('rsvpYesOption', e.target.value)} className={editorStyles.input} />

                            <label className={editorStyles.label}>Hayır metni</label>
                            <input type="text" value={formData.rsvpNoOption} onChange={e => handleUpdateField('rsvpNoOption', e.target.value)} className={editorStyles.input} />

                            <h4 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '0.9rem' }}>Ekstra Seçenekler (Menü/Plan)</h4>
                            <label className={editorStyles.label}>Seçenek Başlığı</label>
                            <input type="text" value={formData.rsvpOptionsTitle} onChange={e => handleUpdateField('rsvpOptionsTitle', e.target.value)} className={editorStyles.input} />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                                {formData.rsvpOptions.map((opt, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            type="text"
                                            value={opt.label}
                                            onChange={e => handleUpdateRsvpOption(i, e.target.value)}
                                            className={editorStyles.input}
                                            style={{ marginBottom: 0 }}
                                        />
                                        <button
                                            onClick={() => handleDeleteRsvpOption(i)}
                                            style={{ background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px', padding: '0 10px', cursor: 'pointer' }}
                                        >
                                            Sil
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={handleAddRsvpOption}
                                    style={{ background: '#f0f0f0', border: '1px dashed #ccc', padding: '8px', borderRadius: '4px', cursor: 'pointer', marginTop: '5px', color: '#666' }}
                                >
                                    + Yeni Seçenek Ekle
                                </button>
                            </div>
                        </div>
                    )}

                    {activeEditor === 'Music' && (
                        <div className={editorStyles.sidebarItem}>
                            <h3>Müzik Ayarları</h3>
                            <label className={editorStyles.label}>Şarkı Adı</label>
                            <input type="text" value={formData.songTitle} onChange={e => handleUpdateField('songTitle', e.target.value)} className={editorStyles.input} />
                            <label className={editorStyles.label}>Sanatçı</label>
                            <input type="text" value={formData.artistName} onChange={e => handleUpdateField('artistName', e.target.value)} className={editorStyles.input} />
                            <label className={editorStyles.label}>Albüm Kapağı</label>
                            <input type="file" onChange={e => handleFileUpload(e, 'musicThumb')} className={editorStyles.input} />
                            <label className={editorStyles.label}>YouTube Müzik Linki</label>
                            <input
                                type="text"
                                value={formData.songUrl}
                                onChange={e => handleYoutubeUrlChange(e.target.value)}
                                className={editorStyles.input}
                                placeholder="https://www.youtube.com/watch?v=..."
                            />
                            <p className={editorStyles.sidebarHint} style={{ marginTop: '5px' }}>Buraya bir YouTube linki yapıştırın.</p>
                        </div>
                    )}

                    {!activeEditor && (
                        <div className={editorStyles.sidebarSection} style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                            <h3><HiOutlineLockClosed style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Bize Özel</h3>
                            <p className={editorStyles.sidebarHint}>Sayfanıza sadece soruya doğru cevap verenlerin girmesini sağlayın.</p>

                            <label className={editorStyles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={formData.isProtected}
                                    onChange={e => handleUpdateField('isProtected', e.target.checked)}
                                />
                                <span>Bu Sayfayı Bize Özel Yap</span>
                            </label>

                            {formData.isProtected && (
                                <div style={{ marginTop: '15px', animation: 'fadeIn 0.3s ease' }}>
                                    <label className={editorStyles.label}>Sevgiline Soru</label>
                                    <input
                                        type="text"
                                        value={formData.protectionQuestion}
                                        onChange={e => handleUpdateField('protectionQuestion', e.target.value)}
                                        className={editorStyles.input}
                                        placeholder="Örn: En sevdiğimiz şehir neresi?"
                                    />
                                    <label className={editorStyles.label}>Cevabı</label>
                                    <input
                                        type="text"
                                        value={formData.protectionAnswer}
                                        onChange={e => handleUpdateField('protectionAnswer', e.target.value)}
                                        className={editorStyles.input}
                                        placeholder="Cevabı buraya yazın..."
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {!activeEditor && (
                        <div className={editorStyles.sidebarSection}>
                            <h3>Sayfa Yapısı</h3>
                            <p className={editorStyles.sidebarHint}>Sıralamak için <b>⠿</b> ikonundan tutarak kaydırın.</p>

                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                                modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                            >
                                <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
                                    <div className={editorStyles.sidebarOrderList}>
                                        {sectionOrder.map((id) => (
                                            <SidebarSortableItem
                                                key={id}
                                                id={id}
                                                isVisible={visibleSections.includes(id)}
                                                onToggle={toggleSection}
                                                onEdit={setActiveEditor}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    )}
                </div>

                <button onClick={() => signOut(auth)} className={editorStyles.logoutBtn}>Çıkış Yap</button>
            </aside>

            {/* Preview (Mockup) */}
            <main className={`${editorStyles.previewContainer} ${mobileTab === 'editor' ? editorStyles.hiddenOnMobile : ''}`}>
                {previewDevice === 'phone' ? (
                    <div className={editorStyles.phoneMockup}>
                        <div className={editorStyles.phoneScreen}>
                            <div className={styles.mainContainer} style={{ width: '100%', maxWidth: 'none', margin: 0, boxShadow: 'none' }}>
                                <FloatingHearts />
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
                                        {sectionOrder
                                            .filter(id => id !== 'Music' && visibleSections.includes(id))
                                            .map((id) => (
                                                <SortableSection key={id} id={id} onEdit={setActiveEditor} isEditing={activeEditor === id}>
                                                    {renderComponent(id)}
                                                </SortableSection>
                                            ))}
                                    </SortableContext>
                                </DndContext>
                                {visibleSections.includes('Music') && renderMusicPlayer()}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={editorStyles.desktopPreview}>
                        <div className={styles.mainContainer} style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', boxShadow: '0 0 50px rgba(0,0,0,0.1)' }}>
                            <FloatingHearts />
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
                                    {sectionOrder
                                        .filter(id => id !== 'Music' && visibleSections.includes(id))
                                        .map((id) => (
                                            <SortableSection key={id} id={id} onEdit={setActiveEditor} isEditing={activeEditor === id}>
                                                {renderComponent(id)}
                                            </SortableSection>
                                        ))}
                                </SortableContext>
                            </DndContext>
                            {visibleSections.includes('Music') && renderMusicPlayer()}
                        </div>
                    </div>
                )}
            </main>

            {/* Mobile Navigation */}
            <div className={editorStyles.mobileNav}>
                <button
                    onClick={() => setMobileTab('editor')}
                    className={`${editorStyles.mobileNavBtn} ${mobileTab === 'editor' ? editorStyles.mobileNavBtnActive : ''}`}
                >
                    <HiOutlinePencilSquare className={editorStyles.mobileNavIcon} />
                    Düzenle
                </button>
                <button
                    onClick={() => setMobileTab('preview')}
                    className={`${editorStyles.mobileNavBtn} ${mobileTab === 'preview' ? editorStyles.mobileNavBtnActive : ''}`}
                >
                    <HiOutlineDevicePhoneMobile className={editorStyles.mobileNavIcon} />
                    Önizle
                </button>
            </div>
        </div>
    );
}
