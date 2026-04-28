import './globals.css';

export const metadata = {
  title: 'ARAL Monitor',
  description: 'Attendance and learner progress monitoring system',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body id="app">{children}</body>
    </html>
  );
}
