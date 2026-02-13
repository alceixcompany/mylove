import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, increment } from 'firebase/firestore';
import Hero from '@/components/Hero/Hero';
import Timeline from '@/components/Timeline/Timeline';
import Guestbook from '@/components/Guestbook/Guestbook';
import RSVP from '@/components/RSVP/RSVP';
import Venue from '@/components/Venue/Venue';
import MusicPlayer from '@/components/MusicPlayer/MusicPlayer';
import FloatingHearts from '@/components/FloatingHearts/FloatingHearts';
import ProtectionGate from '@/components/ProtectionGate/ProtectionGate';
import styles from '../page.module.css';
import { notFound } from 'next/navigation';

export default async function CouplePage({ params }) {
    const { slug } = await params;

    const q = query(collection(db, "pages"), where("urlSlug", "==", slug));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        notFound();
    }

    const pageDoc = querySnapshot.docs[0];
    const userData = pageDoc.data();

    // Background hit tracking
    try {
        await updateDoc(doc(db, "pages", pageDoc.id), {
            hits: increment(1)
        });
    } catch (e) {
        console.error("Hit tracking error:", e);
    }

    const sectionOrder = userData.sectionOrder || ['Hero', 'Timeline', 'Venue', 'Guestbook', 'RSVP'];

    // Data helpers
    const venueData = userData.venue || {
        name: "Henüz Belirtilmedi",
        address: "Adres girilmemiş",
        time: "Zaman girilmemiş",
        imageUrl: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?q=80&w=1000&auto=format&fit=crop"
    };

    const renderSection = (id) => {
        switch (id) {
            case 'Hero': return <Hero key={id} title={userData.heroTitle} subtitle={userData.heroSubtitle} imageUrl={userData.heroImage} quote={userData.heroQuote} countdownDate={userData.countdownDate} countdownTitle={userData.countdownTitle} />;
            case 'Timeline': return <Timeline key={id} title={userData.timelineTitle} subtitle={userData.timelineSubtitle} events={userData.storyEvents || []} />;
            case 'Venue': return <Venue key={id} name={venueData.name} address={venueData.address} time={venueData.time} imageUrl={venueData.imageUrl} />;
            case 'Guestbook': return <Guestbook key={id} title={userData.guestbookTitle} subtitle={userData.guestbookSubtitle} initialMessages={userData.guestMessages || []} />;
            case 'RSVP': return <RSVP
                key={id}
                title={userData.rsvpTitle}
                subtitle={userData.rsvpSubtitle}
                yesOption={userData.rsvpYesOption}
                noOption={userData.rsvpNoOption}
                optionsTitle={userData.rsvpOptionsTitle}
                options={userData.rsvpOptions}
            />;
            default: return null;
        }
    };

    const content = (
        <main className={styles.mainContainer}>
            <FloatingHearts />

            {sectionOrder.map(id => renderSection(id))}

            {/* Galeri Bölümü - Her zaman en sonda kalabilir veya listeye eklenebilir */}
            <section style={{ padding: '60px 20px' }}>
                <h2 className="section-title">
                    <span className="heart-icon-animate">❤</span>
                    Anılarımız
                    <span className="heart-icon-animate">❤</span>
                </h2>
                <div className={styles.galleryGrid}>
                    {(userData.galleryImages || ["/images/story-4.png", "/images/gallery-1.png", "/images/gallery-2.png"]).map((img, idx) => (
                        <div key={idx} className={idx === 0 ? styles.galleryItemLarge : styles.galleryItem}>
                            <img src={img} alt={`Anı ${idx + 1}`} className={styles.galleryImg} />
                        </div>
                    ))}
                </div>
            </section>

            <footer className={styles.footer}>
                <p className={styles.footerBrand}>{userData.footerBrand || "Sonsuz Aşk"}</p>
                <div className={styles.footerSymbol}>∞</div>
                <p className={styles.footerText}>HİKAYEMİZİN BİR PARÇASI OLDUĞUN İÇİN TEŞEKKÜRLER</p>
            </footer>

            <MusicPlayer
                songTitle={userData.songTitle || "Bizim Şarkımız"}
                artistName={userData.artistName || "Sizin Şarkınız"}
                thumbnailUrl={userData.musicThumb || "/images/music-thumb.png"}
                songUrl={userData.songUrl}
            />
        </main>
    );

    if (userData.isProtected && userData.protectionQuestion && userData.protectionAnswer) {
        return (
            <ProtectionGate
                question={userData.protectionQuestion}
                answer={userData.protectionAnswer}
            >
                {content}
            </ProtectionGate>
        );
    }

    return content;
}
