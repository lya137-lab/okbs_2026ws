import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { ScheduleSection } from "@/components/sections/ScheduleSection";
import { AnnouncementsSection } from "@/components/sections/AnnouncementsSection";
import { ParticipantsSection } from "@/components/sections/ParticipantsSection";
import { BusAssignmentSection } from "@/components/sections/BusAssignmentSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { useParticipantAuth } from "@/hooks/useParticipantAuth";
import { LoginPromptSection } from "@/components/sections/LoginPromptSection";

const Index = () => {
  const { isLoggedIn } = useParticipantAuth();
  const location = useLocation();

  // URL 해시(#schedule, #faq 등)에 맞춰 해당 섹션으로 스크롤 (일정표·FAQ 메뉴 동작)
  useEffect(() => {
    const hash = location.hash?.replace("#", "");
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) {
      const timer = setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, location.hash]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <AnnouncementsSection />
        <ScheduleSection />
        <ContactSection />
        
        {isLoggedIn ? (
          <>
            <ParticipantsSection />
            <BusAssignmentSection />
          </>
        ) : (
          <LoginPromptSection />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
