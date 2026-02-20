import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

/**
 * 조별 미션 안내 페이지
 */
const TeamMission = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* 안내 문구 */}
          <div className="flex flex-col items-center justify-center text-center py-24">
            <p className="text-3xl md:text-4xl font-bold text-foreground">
              조별 미션 공개 예정
            </p>
            <p className="text-2xl md:text-3xl font-semibold text-muted-foreground mt-4">
              Comming Soon
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TeamMission;
