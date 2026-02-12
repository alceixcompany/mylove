import Footer from '@/components/Footer';
import Link from 'next/link';
import { HiArrowLeft } from 'react-icons/hi2';

export default function MesafeliSatisSozlesmesi() {
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
                <h1 style={{ fontSize: '2.5rem', marginBottom: '40px', fontFamily: '"Playfair Display", serif', color: '#D6949F', textAlign: 'center' }}>Mesafeli Satış Sözleşmesi</h1>

                <div style={{ lineHeight: '1.8', color: '#5C4044' }}>
                    <p style={{ marginBottom: '20px' }}>
                        İşbu sözleşme, Alıcı ile Satıcı (Sonsuz Aşk) arasında, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri uyarınca düzenlenmiştir.
                    </p>

                    <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#D6949F' }}>1. Taraflar</h3>
                    <p style={{ marginBottom: '20px' }}>
                        <strong>Satıcı:</strong> Sonsuz Aşk Platformu<br />
                        <strong>Alıcı:</strong> Hizmeti satın alan kullanıcı
                    </p>

                    <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#D6949F' }}>2. Konu</h3>
                    <p style={{ marginBottom: '20px' }}>
                        İşbu sözleşmenin konusu, Alıcının Satıcıya ait web sitesi üzerinden elektronik ortamda siparişini verdiği dijital hizmetin satışı ve teslimi ile ilgili olarak tarafların hak ve yükümlülüklerinin belirlenmesidir.
                    </p>

                    <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#D6949F' }}>3. Cayma Hakkı</h3>
                    <p style={{ marginBottom: '20px' }}>
                        Elektronik ortamda anında ifa edilen hizmetler kapsamına girdiği için, hizmetin ifasına başlandıktan sonra cayma hakkı kullanılamaz. Ancak Satıcı, müşteri memnuniyeti kapsamında 14 gün içinde mazeretli iadeleri değerlendirme hakkını saklı tutar.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
}
