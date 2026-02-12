import Link from 'next/link';
import { FaCcVisa, FaCcMastercard } from 'react-icons/fa';
import styles from './Footer.module.css';

const Footer = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.footerContent}>
                <div className={styles.footerLogo}>
                    <h3>Aşk Arşivi</h3>
                    <p>En mutlu gününüz, dijital dünyada.</p>
                </div>
                <div className={styles.footerLinks}>
                    <div className={styles.linkGroup}>
                        <h4>Kurumsal</h4>
                        <Link href="/hakkimizda">Hakkımızda</Link>
                        <Link href="/ozellikler">Özellikler</Link>
                        <Link href="/ayse-ali">Örnek Sayfa</Link>
                    </div>
                    <div className={styles.linkGroup}>
                        <h4>Yasal</h4>
                        <Link href="/gizlilik-sozlesmesi">Gizlilik Sözleşmesi</Link>
                        <Link href="/mesafeli-satis-sozlesmesi">Mesafeli Satış Sözleşmesi</Link>
                        <Link href="/teslimat-iade">Teslimat ve İade Şartları</Link>
                    </div>
                </div>
            </div>
            <div className={styles.footerBottom}>
                <p>© 2024 Aşk Arşivi. Sevgiyle tasarlandı.</p>

                <div className={styles.paymentLogos}>
                    <FaCcVisa className={styles.paymentIcon} title="Visa" />
                    <FaCcMastercard className={styles.paymentIcon} title="MasterCard" />

                    <img
                        src="https://media.licdn.com/dms/image/v2/D4D0BAQF6m7amYBA0Rw/company-logo_200_200/company-logo_200_200/0/1697575641523/iyzi_payments_logo?e=2147483647&v=beta&t=Cn9lA5HTHounZIvphtir_AGuryG92K0llT5SHOtnTBs"
                        alt="iyzico ile Öde"
                        className={styles.iyzicoLogo}
                        style={{ height: '32px', borderRadius: '4px' }}
                    />
                </div>
            </div>
        </footer>
    );
};

export default Footer;
