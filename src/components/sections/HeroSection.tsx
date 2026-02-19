import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Users, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParticipantAuth } from "@/hooks/useParticipantAuth";
import heroBg from "@/assets/hero-bg.jpg";
import mascotHappy from "@/assets/mascot-happy.png";

export const HeroSection = () => {
  const { isLoggedIn } = useParticipantAuth();

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt="Hero background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      {/* Content with Mascot */}
      <div className="relative z-10 container mx-auto px-4 pt-20">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
          {/* Mascot Character - Left Side */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex-shrink-0"
          >
            <img
              src={mascotHappy}
              alt="OK배정장학재단 캐릭터"
              className="w-40 sm:w-52 md:w-64 lg:w-72 xl:w-80 h-auto drop-shadow-2xl"
            />
          </motion.div>

          {/* Text Content - Right Side */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-sm font-medium text-primary-foreground">2026년 상반기</span>
            </motion.div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
              OK배정장학재단
              <br />
              <span className="text-gradient-accent">장학생 워크숍</span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-primary-foreground/80 mb-10 max-w-2xl">
              함께 성장하고, 나누고, 연결되는 특별한 시간
              <br className="hidden sm:block" />
              2026년 상반기 장학생 워크숍에 여러분을 초대합니다
            </p>

            {/* Info Cards */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-card px-5 py-3 rounded-2xl flex items-center gap-3"
              >
                <CalendarDays className="h-5 w-5 text-accent" />
                <span className="text-sm font-medium text-foreground">2026.02.28 - 03.02</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass-card px-5 py-3 rounded-2xl flex items-center gap-3"
              >
                <MapPin className="h-5 w-5 text-accent" />
                <span className="text-sm font-medium text-foreground">부산 BNK 연수원</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="glass-card px-5 py-3 rounded-2xl flex items-center gap-3"
              >
                <Users className="h-5 w-5 text-accent" />
                <span className="text-sm font-medium text-foreground">120명 참석 예정</span>
              </motion.div>
            </div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex justify-center lg:justify-start"
            >
              <Link to={isLoggedIn ? "/self-introduction" : "/login"}>
                <Button
                  size="lg"
                  className="bg-gradient-accent hover:opacity-90 text-accent-foreground shadow-lg shadow-accent/30 px-8 py-6 text-lg rounded-xl"
                >
                  자기소개 등록하기
                </Button>
              </Link>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-10 flex justify-center lg:justify-start"
            >
              <a
                href="#schedule"
                className="flex flex-col items-center gap-2 text-primary-foreground/60 hover:text-primary-foreground transition-colors"
              >
                <span className="text-xs font-medium">스크롤하세요</span>
                <ArrowDown className="h-4 w-4 animate-bounce" />
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
