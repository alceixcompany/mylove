import "./globals.css";

export const metadata = {
  title: "Aşk Arşivi | Hikayenizi Ölümsüzleştirin",
  description: "En özel gününüzü dijital dünyada zarafetle paylaşın.",
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
