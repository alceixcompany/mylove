import Footer from '@/components/Footer';
import Link from 'next/link';
import { HiArrowLeft } from 'react-icons/hi2';

export default function Hakkimizda() {
    return (
        <div style={{ background: '#FFF4F6', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <nav style={{ position: 'sticky', top: 0, width: '100%', padding: '20px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #FCE4E8', zIndex: 100 }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Link href="/" style={{ fontSize: '1.5rem', fontFamily: '"Alex Brush", cursive', color: '#D6949F', fontWeight: 'bold', textDecoration: 'none' }}>Aşk Arşivi</Link>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5C4044', textDecoration: 'none', fontWeight: 500 }}>
                        <HiArrowLeft /> Ana Sayfa
                    </Link>
                </div>
            </nav>

            <main style={{ flex: 1, maxWidth: '800px', margin: '0 auto', padding: '60px 20px' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '40px', fontFamily: '"Playfair Display", serif', color: '#D6949F', textAlign: 'center' }}>Hakkımızda</h1>

                <div style={{ lineHeight: '1.8', color: '#5C4044', fontSize: '1.1rem' }}>
                    <p style={{ marginBottom: '20px' }}>
                        Sonsuz Aşk, modern çiftlerin en özel günlerini dijital dünyada estetik ve kalıcı bir şekilde paylaşmalarını sağlayan yenilikçi bir platformdur. Teknolojinin sunduğu imkanları, aşkın romantizmiyle birleştirerek düğün davetiyelerini ve anılarını sıradanlıktan çıkarıyoruz.
                    </p>
                    <p style={{ marginBottom: '20px' }}>
                        Misyonumuz, kağıt israfını azaltırken, çiftlere interaktif, yaşayan ve yıllar sonra bile dönüp bakabilecekleri dijital bir anı defteri sunmaktır. Galeri, müzik, LCV takibi ve özel hikaye bölümleriyle, düğün sürecinizi hem sizin hem de misafirleriniz için unutulmaz bir deneyime dönüştürüyoruz.
                    </p>
                    <p>
                        Siz aşkınızı yaşarken, biz bu hikayeyi en güzel haliyle anlatmanız için yanınızdayız.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
}
