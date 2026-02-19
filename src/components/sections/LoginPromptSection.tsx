import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Lock, Users, BedDouble, Bus, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import mascotHappy from "@/assets/mascot-happy.png";

const protectedFeatures = [
  { icon: Users, label: "참석자 명단", description: "워크숍 참가자 정보 확인" },
  { icon: BedDouble, label: "숙소배정", description: "방 배정 및 룸메이트 확인" },
  { icon: Bus, label: "버스배정", description: "출발 장소 및 탑승 정보" },
  { icon: Image, label: "갤러리", description: "워크숍 사진 및 추억" },
];

export const LoginPromptSection = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-muted/30 to-background relative overflow-hidden">
      {/* Mascot Character */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="absolute bottom-10 left-10 hidden lg:block"
      >
        <img
          src={mascotHappy}
          alt="OK배정장학재단 캐릭터"
          className="w-40 h-auto drop-shadow-lg"
        />
      </motion.div>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center"
        >
          {/* Lock Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <Lock className="w-10 h-10 text-primary" />
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            로그인이 필요합니다
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            아래 콘텐츠를 확인하려면 참가자 로그인이 필요합니다
          </p>

          {/* Protected Features Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {protectedFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-xl bg-card border border-border/50 text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{feature.label}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Login Button */}
          <Link to="/login">
            <Button
              size="lg"
              className="bg-gradient-accent hover:opacity-90 text-accent-foreground shadow-lg shadow-accent/30 px-10 py-6 text-lg rounded-xl"
            >
              참가자 로그인하기
            </Button>
          </Link>

          <p className="mt-6 text-sm text-muted-foreground">
            워크숍 참가 신청 시 등록한 이름과 연락처로 로그인해주세요
          </p>
        </motion.div>
      </div>
    </section>
  );
};
