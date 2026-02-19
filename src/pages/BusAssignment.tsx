import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BusAssignmentSection } from "@/components/sections/BusAssignmentSection";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * 버스배정 전용 페이지
 * Supabase buses, bus_passengers 테이블과 연동된 버스 배정 정보를 표시합니다.
 */
const BusAssignment = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* 상단 뒤로가기 */}
        <div className="container mx-auto px-4 pt-24 pb-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
              홈으로
            </Button>
          </Link>
        </div>
        <BusAssignmentSection />
      </main>
      <Footer />
    </div>
  );
};

export default BusAssignment;
