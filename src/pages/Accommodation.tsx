import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AccommodationSection } from "@/components/sections/AccommodationSection";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

/**
 * 숙소배정 전용 페이지
 * Supabase rooms, room_members 테이블과 연동된 숙소 배정 정보를 표시합니다.
 */
const Accommodation = () => {
  const { user, isAdmin, isLoading } = useAuth();

  // 관리자 인증 로딩 중 처리
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 관리자만 숙소 전체 배정 페이지 접근 가능
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center py-16">
              <p className="text-muted-foreground">관리자만 접근 가능한 페이지입니다.</p>
              <Link to="/">
                <Button variant="outline" size="sm" className="mt-4">
                  홈으로 돌아가기
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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
        <AccommodationSection />
      </main>
      <Footer />
    </div>
  );
};

export default Accommodation;
