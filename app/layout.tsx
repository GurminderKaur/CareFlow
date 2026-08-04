import './globals.css';

export const metadata = {
  title: 'CareFlow',
  description: 'AI-assisted administrative workflow for small clinics',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
