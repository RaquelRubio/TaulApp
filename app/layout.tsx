import BottomNav from "./components/BottomNav";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="m-0">
        {/* paddingBottom para que la barra no tape el contenido */}
        <div className="pb-[72px]">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
