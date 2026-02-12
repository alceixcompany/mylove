import Footer from '@/components/Footer';
import Link from 'next/link';
import { HiArrowLeft } from 'react-icons/hi2';

export default function TeslimatIade() {
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
                <h1 style={{ fontSize: '2.5rem', marginBottom: '40px', fontFamily: '"Playfair Display", serif', color: '#D6949F', textAlign: 'center' }}>Teslimat ve İade Şartları</h1>

                <div style={{ lineHeight: '1.8', color: '#5C4044' }}>
                    <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#D6949F' }}>1. Teslimat Politikası</h3>
                    <p style={{ marginBottom: '20px' }}>
                        Sonsuz Aşk üzerinden satın alınan hizmetler dijital niteliktedir. Ödeme işleminin tamamlanmasının ardından, üyelik hesabınız anında aktif edilir ve web sayfanızı düzenlemeye başlayabilirsiniz. Herhangi bir fiziksel kargo gönderimi yapılmamaktadır.
                    </p>

                    <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#D6949F' }}>2. İade Koşulları</h3>
                    <p style={{ marginBottom: '20px' }}>
                        Dijital içerik ve hizmetlerin doğası gereği, hizmetin ifasına başlandıktan (sayfanın yayına alınması veya özelliklerin kullanılması) sonra cayma hakkı kısıtlıdır. Ancak, teknik bir aksaklık yaşanması veya hizmetin vaat edilen özellikleri karşılamaması durumunda, satın alma tarihinden itibaren 14 gün içinde iade talebinde bulunabilirsiniz.
                    </p>

                    <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#D6949F' }}>3. İade Süreci</h3>
                    <p style={{ marginBottom: '20px' }}>
                        İade taleplerinizi destek@sonsuzask.com adresine iletebilirsiniz. Talebiniz incelendikten sonra, uygun görülmesi durumunda 7 iş günü içerisinde ödeme yaptığınız karta iade işlemi gerçekleştirilir.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
}
