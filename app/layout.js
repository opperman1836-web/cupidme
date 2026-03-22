import './globals.css';

export const metadata = {
  title: "New Skills Marketing",
};

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
