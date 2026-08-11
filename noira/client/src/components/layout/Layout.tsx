import { AgeGate } from "@/components/AgeGate";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { useEffect } from "react";
import { useLocation } from "wouter";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  // Wouter behält die Scrollposition über Routen hinweg — für eine
  // Seitennavigation ist das fast nie das Gewünschte.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location]);

  return (
    <div className="flex min-h-screen flex-col">
      <AgeGate />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default Layout;
