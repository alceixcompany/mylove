import "./globals.css";

export const metadata = {
  title: "Two Souls, One Journey | Our Love Story",
  description: "A digital celebration of our journey together, from the first glance to forever.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
