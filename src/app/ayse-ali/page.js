import Hero from '@/components/Hero/Hero';
import Timeline from '@/components/Timeline/Timeline';
import Guestbook from '@/components/Guestbook/Guestbook';
import RSVP from '@/components/RSVP/RSVP';
import Venue from '@/components/Venue/Venue';
import MusicPlayer from '@/components/MusicPlayer/MusicPlayer';
import FloatingHearts from '@/components/FloatingHearts/FloatingHearts';
import styles from '../page.module.css';

export default function ExamplePage() {
    const storyEvents = [
        {
            date: "Bahar 2019",
            title: "İlk Karşılaşma",
            image: "/images/story-1.png",
            description: "Kalabalık bir kafede gözlerimiz buluştu ve zaman o an durdu. Bu anın her şeyi değiştireceğini henüz bilmiyorduk."
        },
        {
            date: "Yaz 2019",
            title: "İlk Randevu",
            image: "/images/story-2.png",
            description: "Yıldızlar çıkana kadar süren sahil yürüyüşü... Saatlerce konuştuk ve senin 'o kişi' olduğunu o gün anladım."
        },
        {
            date: "Kış 2022",
            title: "Evlilik Teklifi",
            image: "/images/story-3.png",
            description: "Karlı bir akşamda, bir ömür boyu yanımda olmanı istedim. Verdiğin o 'evet' cevabı, duyduğum en güzel sesti."
        },
        {
            date: "Bugün",
            title: "Sonsuzluğa Doğru",
            image: "/images/story-4.png",
            description: "Seninle geçen her gün, güzel hikayemizin yeni bir sayfası. Nice mutlu yıllara ve maceralara beraber yürümeye..."
        }
    ];

    const guestMessages = [
        { text: "Size bir ömür boyu mutluluklar ve aşk dolu bir hayat diliyoruz!", author: "Selin & Mert" },
        { text: "Birbirini bulan iki güzel ruhu görmek harika.", author: "Can Yılmaz" }
    ];

    return (
        <main className={styles.mainContainer}>
            <FloatingHearts />

            <Hero
                title={<>İki Ruh,<br />Tek Yolculuk</>}
                subtitle="Örnek Sayfa"
                imageUrl="/images/hero.png"
                quote="Seninle tanışmak, en sevdiğim şarkıyı ilk kez dinlemek ve onun hayatımın şarkısı olacağını o andan bilmek gibiydi."
            />

            <Timeline events={storyEvents} />

            <Venue
                name="Kız Kulesi, İstanbul"
                address="Salacak Mevkii, Üsküdar/İstanbul"
                time="20:00 - 14 Şubat Cumartesi"
                imageUrl="https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?q=80&w=1000&auto=format&fit=crop"
            />

            <Guestbook initialMessages={guestMessages} />

            <RSVP />

            {/* Galeri Bölümü */}
            <section style={{ padding: '60px 20px' }}>
                <h2 className="section-title">
                    <span className="heart-icon-animate">❤</span>
                    Anılarımız
                    <span className="heart-icon-animate">❤</span>
                </h2>
                <p className="section-subtitle">Aşk dolu kareler</p>
                <div className={styles.galleryGrid}>
                    <div className={styles.galleryItemLarge}>
                        <img src="/images/story-4.png" alt="Anı" className={styles.galleryImg} />
                    </div>
                    <div className={styles.galleryItem}>
                        <img src="/images/gallery-1.png" alt="Anı" className={styles.galleryImg} />
                    </div>
                    <div className={styles.galleryItem}>
                        <img src="/images/gallery-2.png" alt="Anı" className={styles.galleryImg} />
                    </div>
                </div>
            </section>

            <footer className={styles.footer}>
                <p className={styles.footerBrand}>Sonsuz Aşk</p>
                <div className={styles.footerSymbol}>∞</div>
                <p className={styles.footerText}>HİKAYEMİZİN BİR PARÇASI OLDUĞUN İÇİN TEŞEKKÜRLER</p>
            </footer>

            <MusicPlayer
                songTitle="Bizim Şarkımız"
                artistName="Teoman - Papatya"
                thumbnailUrl="/images/music-thumb.png"
            />
        </main>
    );
}
