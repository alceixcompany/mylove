import Footer from '@/components/Footer';
import Link from 'next/link';
import { HiArrowLeft } from 'react-icons/hi2';

export default function GizlilikSozlesmesi() {
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
                <h1 style={{ fontSize: '2.5rem', marginBottom: '40px', fontFamily: '"Playfair Display", serif', color: '#D6949F', textAlign: 'center' }}>Gizlilik Sözleşmesi</h1>

                <div style={{ lineHeight: '1.8', color: '#5C4044' }}>
                    <p style={{ marginBottom: '20px' }}>
                        İşbu Gizlilik Sözleşmesi, Sonsuz Aşk ("Şirket") tarafından işletilen web sitesini kullanan kullanıcıların ("Kullanıcı") kişisel verilerinin korunması ve işlenmesi hususlarını düzenlemektedir.
                    </p>

                    <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#D6949F' }}>1. Toplanan Veriler</h3>
                    <p style={{ marginBottom: '20px' }}>
                        Kullanıcıların sisteme kayıt olurken verdikleri ad, soyad, e-posta adresi ve düğün/etkinlik ile ilgili paylaştıkları bilgiler (tarih, mekan, fotoğraflar) tarafımızca saklanmaktadır.
                    </p>

                    <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#D6949F' }}>2. Verilerin Kullanımı</h3>
                    <p style={{ marginBottom: '20px' }}>
                        Toplanan veriler, hizmetin sağlanması, kullanıcı deneyiminin iyileştirilmesi ve yasal yükümlülüklerin yerine getirilmesi amacıyla kullanılır. Kişisel verileriniz, yasal zorunluluklar haricinde üçüncü şahıslarla paylaşılmaz.
                    </p>

                    <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#D6949F' }}>3. Çerezler (Cookies)</h3>
                    <p style={{ marginBottom: '20px' }}>
                        Sitemiz, kullanıcı deneyimini artırmak amacıyla çerez kullanmaktadır. Tarayıcı ayarlarınızdan çerezleri yönetebilirsiniz.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
}
