"use client";
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import Link from 'next/link';
import styles from './landing.module.css';
import FloatingHearts from '@/components/FloatingHearts/FloatingHearts';
import {
  HiOutlineHeart,
  HiOutlineLockClosed,
  HiOutlineMusicalNote,
  HiOutlineUserGroup,
  HiOutlinePhoto,
  HiOutlineSparkles
} from "react-icons/hi2";

export default function LandingPage() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref');

  useEffect(() => {
    if (refCode) {
      const trackRef = async () => {
        try {
          await updateDoc(doc(db, "referrals", refCode.toUpperCase()), {
            clicks: increment(1)
          });
        } catch (e) {
          // Silently fail if ref code doesn't exist
        }
      };
      trackRef();
    }
  }, [refCode]);
  return (
    <div className={styles.landingWrapper}>
      <FloatingHearts />

      {/* INTRODUCTION: Navbar & Hero */}
      <nav className={styles.navbar}>
        <div className={styles.navContainer}>
          <div className={styles.logo}>Sonsuz Aşk</div>
          <div className={styles.navLinks}>
            <a href="#ozellikler">Özellikler</a>
            <a href="#nasil-calisir">Nasıl Çalışır</a>
            <Link href="/login" className={styles.navLoginBtn}>Hemen Başla</Link>
          </div>
        </div>
      </nav>

      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            En Güzel Gününüzü <br />
            <span className={styles.heroHighlight}>Dijitalde Ölümsüzleştirin</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Sadece birkaç dakika içinde size özel, romantik ve modern düğün sayfanızı oluşturun.
            Hikayenizi tüm dünyaya zarafetle anlatın.
          </p>
          <div className={styles.ctaButtons}>
            <Link href="/login" className={styles.primaryBtn}>
              Ücretsiz Oluştur
            </Link>
            <Link href="/ayse-ali" className={styles.secondaryBtn}>
              Örneği Gör
            </Link>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.mockupWrapper}>
            <div className={styles.mockupPhone}>
              <img src="/images/landing_hero_preview.png" alt="Düğün Sayfası Önizleme" />
            </div>
            <div className={styles.floatingCard1}>
              <HiOutlineHeart className={styles.cardIcon} />
              <span>LVC Aktif (RSVP)</span>
            </div>
            <div className={styles.floatingCard2}>
              <HiOutlineMusicalNote className={styles.cardIcon} />
              <span>Müzik Çalıyor</span>
            </div>
          </div>
        </div>
      </header>

      {/* DEVELOPMENT: Story & Emotional Connection */}
      <section id="ozellikler" className={styles.storySection}>
        <div className={styles.sectionHeader}>
          <span className={styles.badge}>Daha Fazlasını Sunuyoruz</span>
          <h2 className={styles.sectionTitle}>Aşk Hikayenizi Anlatmanız İçin <br /> Zarif Detaylar</h2>
        </div>

        <div className={styles.storyGrid}>
          <div className={styles.storyCard}>
            <div className={styles.iconWrapper}><HiOutlinePhoto /></div>
            <h3>Sonsuz Galeri</h3>
            <p>En mutlu anılarınızı, yüksek çözünürlüklü fotoğraflarla sayfanızın en güzel yerinde sergileyin.</p>
          </div>

          <div className={styles.storyCard}>
            <div className={styles.iconWrapper}><HiOutlineMusicalNote /></div>
            <h3>Sizin Şarkınız</h3>
            <p>Sayfanız açıldığında aşkınızı anlatan melodiler başlasın. YouTube entegrasyonu ile dilediğiniz müziği ekleyin.</p>
          </div>

          <div className={styles.storyCard}>
            <div className={styles.iconWrapper}><HiOutlineLockClosed /></div>
            <h3>Bize Özel</h3>
            <p>Sayfanızı şifreleyin. Sadece sizin belirlediğiniz özel soruya doğru cevap verenler bu dünyayı görebilir.</p>
          </div>

          <div className={styles.storyCard}>
            <div className={styles.iconWrapper}><HiOutlineUserGroup /></div>
            <h3>Dijital LCV</h3>
            <p>Misafirleriniz katılım durumlarını bildirsin. Panelinizden tüm detayları romantik bir kolaylıkla takip edin.</p>
          </div>

          <div className={styles.storyCard}>
            <div className={styles.iconWrapper}><HiOutlineSparkles /></div>
            <h3>Anı Defteri</h3>
            <p>Sevdikleriniz sizin için romantik notlar ve iyi dilekler bıraksın. Dijital bir hatıra defteri oluşturun.</p>
          </div>

          <div className={styles.storyCard}>
            <div className={styles.iconWrapper}><HiOutlineHeart /></div>
            <h3>Zarif Tasarım</h3>
            <p>Her detay aşkınızı yansıtması için tasarlandı. Sürükle-bırak editör ile sayfanızı saniyeler içinde değiştirin.</p>
          </div>
        </div>
      </section>

      {/* Emotional Quote Section */}
      <section className={styles.memoriesSection}>
        <p className={styles.memoriesQuote}>
          "Gerçek aşkın hikayesi asla bitmez, sadece yeni sayfalara taşınır."
        </p>
        <span className={styles.author}>— Sonsuz Aşk</span>
      </section>

      {/* DEVELOPMENT: How it Works (Introduction to Process) */}
      <section id="nasil-calisir" className={styles.stepsSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.badge}>Kolay ve Hızlı</span>
          <h2 className={styles.sectionTitle}>Birlikte Başlamanız İçin 3 Adım</h2>
        </div>

        <div className={styles.stepsTimeline}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>01</div>
            <h3>Tasarımı Özelleştir</h3>
            <p>Kolay editörümüzle renkleri, yazıları ve fotoğraflarınızı seçin. Her şey sizin tarzınıza bürünsün.</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>02</div>
            <h3>Duyguları Ekle</h3>
            <p>Müziğinizi seçin, hikayenizi anlatın ve misafirleriniz için özel detayları kaydedin.</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>03</div>
            <h3>Sonsuzluğa Paylaş</h3>
            <p>Sadece tek bir tık ile linkinizi sevdiklerinize gönderin ve tebrikleri kabul etmeye başlayın.</p>
          </div>
        </div>
      </section>

      {/* CONCLUSION: Final CTA */}
      <section className={styles.ctaBanner}>
        <div className={styles.ctaInner}>
          <h2>Aşk Hikayenizi Ölümsüzleştirin</h2>
          <p>Gelin, bu güzel yolu birlikte yürüyelim. Bugün ücretsiz sayfanızı oluşturun.</p>
          <Link href="/login" className={styles.finalBtn}>Şimdi Başla</Link>
        </div>
      </section>

      {/* CONCLUSION: Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerLogo}>
            <h3>Sonsuz Aşk</h3>
            <p>En mutlu gününüz, dijital dünyada.</p>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.linkGroup}>
              <h4>Ürün</h4>
              <Link href="#ozellikler">Özellikler</Link>
              <Link href="/ayse-ali">Örnek Sayfa</Link>
            </div>
            <div className={styles.linkGroup}>
              <h4>Kurumsal</h4>
              <Link href="/gizlilik">Gizlilik Politikası</Link>
              <Link href="/sartlar">Kullanım Koşulları</Link>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          © 2024 Sonsuz Aşk. Sevgiyle tasarlandı.
        </div>
      </footer>
    </div>
  );
}
