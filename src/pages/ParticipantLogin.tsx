import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Loader2, User, Phone } from "lucide-react";
import { useParticipantAuth } from "@/hooks/useParticipantAuth";
import { supabase } from "@/integrations/supabase/client";
import { logDatabaseStatus } from "@/utils/dbCheck";
import logoOK from "@/assets/logo-ok-foundation.png";
import mascotGlasses from "@/assets/mascot-glasses.png";

const ParticipantLogin = () => {
  // Login state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useParticipantAuth();

  // 개발 환경에서 데이터베이스 상태 확인
  useEffect(() => {
    if (import.meta.env.DEV) {
      logDatabaseStatus();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // 참가자 정보 확인
      const { data: participantData, error: participantError } = await supabase
        .from("participants")
        .select("*")
        .eq("name", name)
        .eq("phone", phone.replace(/[^\d]/g, ""))
        .maybeSingle();

      if (participantError) {
        throw participantError;
      }

      if (!participantData) {
        toast.error("등록된 참가자 정보가 없습니다. 이름과 전화번호를 확인해주세요.", {
          description: "관리자에게 이름/연락처 등록을 요청해주세요."
        });
        setIsLoading(false);
        return;
      }

      // 로그인 성공 (participantId 저장 → 나의 프로필/버스·숙소 연동용)
      login(participantData.id, participantData.name, participantData.phone ?? phone.replace(/[^\d]/g, ""));
      toast.success(`${name}님, 환영합니다!`);
      navigate("/");
    } catch (error: any) {
      console.error("Login error:", error);
      
      let errorMessage = "로그인에 실패했습니다.";
      let showDetailedHelp = false;
      
      if (error.message?.includes("Could not find the table") || 
          error.message?.includes("relation") ||
          error.code === "PGRST116" ||
          error.message?.includes("schema cache")) {
        errorMessage = "데이터베이스 테이블이 아직 생성되지 않았습니다.";
        showDetailedHelp = true;
      } else if (error.message) {
        errorMessage = `로그인에 실패했습니다: ${error.message}`;
      }
      
      toast.error(errorMessage, {
        duration: showDetailedHelp ? 10000 : 5000,
        description: showDetailedHelp 
          ? "Supabase 대시보드 > SQL Editor에서 'CREATE_TABLES_NOW.sql' 파일을 실행하세요"
          : undefined
      });
      
      if (showDetailedHelp) {
        console.error("❌ 테이블 생성 필요:");
        console.error("1. Supabase 대시보드 접속: https://supabase.com/dashboard");
        console.error("2. SQL Editor 열기");
        console.error("3. 'CREATE_TABLES_NOW.sql' 파일 내용 복사하여 실행");
        console.error("4. 브라우저 새로고침 후 다시 시도");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
          {/* Mascot - Left Side */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex-shrink-0"
          >
            <img
              src={mascotGlasses}
              alt="OK배정장학재단 캐릭터"
              className="w-48 sm:w-56 md:w-64 lg:w-80 h-auto drop-shadow-xl"
            />
          </motion.div>

          {/* Login Card - Right Side */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="bg-card rounded-3xl shadow-2xl border border-border/50 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-accent p-6 text-center">
                <motion.img
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                  src={logoOK}
                  alt="OK배정장학재단"
                  className="h-14 w-auto mx-auto mb-3"
                />
                <h1 className="text-xl font-bold text-accent-foreground">
                  2026 상반기 장학생 워크숍
                </h1>
                <p className="text-accent-foreground/80 text-sm mt-1">
                  참가자 로그인
                </p>
              </div>

              {/* Form */}
              <div className="p-6">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground font-medium flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      이름
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="홍길동"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-12 rounded-xl border-border/60 focus:border-primary focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      휴대폰 번호
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="010-1234-5678"
                      value={phone}
                      onChange={handlePhoneChange}
                      required
                      maxLength={13}
                      className="h-12 rounded-xl border-border/60 focus:border-primary focus:ring-primary/20"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-gradient-accent hover:opacity-90 text-accent-foreground font-bold rounded-xl shadow-lg shadow-accent/30 transition-all"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        확인 중...
                      </>
                    ) : (
                      "로그인"
                    )}
                  </Button>
                </form>

                <div className="mt-6 pt-4 border-t border-border/30">
                  <p className="text-center text-sm text-muted-foreground mb-4">
                    관리자에게 등록된 이름/연락처로 로그인해주세요
                  </p>
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-foreground"
                    onClick={() => navigate("/")}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    메인 페이지로 돌아가기
                  </Button>
                </div>
              </div>
            </div>

            {/* Admin Link */}
            <div className="mt-4 text-center">
              <Button
                variant="link"
                className="text-muted-foreground hover:text-foreground text-sm"
                onClick={() => navigate("/admin")}
              >
                관리자 로그인
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantLogin;
