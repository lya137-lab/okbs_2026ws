import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { MapPin, Users, Coffee, Utensils, Music, Presentation, MessageSquare, Moon, Clock, Bus, Route, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

// 아이콘 매핑 (시계 대신 Bus, Route(투어) 등 선택 가능)
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MapPin,
  Users,
  Coffee,
  Utensils,
  Music,
  Presentation,
  MessageSquare,
  Moon,
  Clock,
  Bus,
  Route,
};

/** 일정 항목 (schedules 테이블) */
interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  location: string;
  type: string;
  icon_name: string;
  display_order: number;
  scheduled_date: string | null;
}

/** 날짜별 일정 맵 (날짜 ISO 문자열 -> 일정 목록) */
interface ScheduleDataByDate {
  [dateKey: string]: ScheduleItem[];
}

const typeColors = {
  main: "bg-primary text-primary-foreground",
  activity: "bg-accent text-accent-foreground",
  meal: "bg-amber-500 text-white",
  break: "bg-emerald-500 text-white",
  info: "bg-muted text-muted-foreground",
};

/** scheduled_date 포맷: "3월 14일 (토)" */
function formatDateLabel(isoDate: string): string {
  try {
    return format(new Date(isoDate), "M월 d일 (EEE)", { locale: ko });
  } catch {
    return isoDate;
  }
}

export const ScheduleSection = () => {
  const [scheduleData, setScheduleData] = useState<ScheduleDataByDate>({});
  const [dateKeys, setDateKeys] = useState<string[]>([]);
  const [activeDate, setActiveDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setIsLoading(true);

        const { data, error } = await supabase
          .from("schedules")
          .select("*")
          .order("scheduled_date", { ascending: true, nullsFirst: false })
          .order("display_order", { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
          setScheduleData({});
          setDateKeys([]);
          setActiveDate("");
          return;
        }

        // scheduled_date 기준 그룹핑 (NULL은 "미정" 등으로 묶을 수 있으나, 우선 제외)
        const byDate: ScheduleDataByDate = {};
        const keys: string[] = [];

        for (const item of data as ScheduleItem[]) {
          const d = item.scheduled_date;
          if (!d) continue;
          if (!byDate[d]) {
            byDate[d] = [];
            keys.push(d);
          }
          byDate[d].push(item);
        }

        setScheduleData(byDate);
        setDateKeys(keys);
        if (keys.length > 0 && !activeDate) setActiveDate(keys[0]);
      } catch (err) {
        console.error("Error fetching schedules:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedules();

    // 실시간 업데이트: 스케줄 변경 시 자동 반영 (아이콘, 제목, 시간 등 모든 변경사항)
    const channel = supabase
      .channel('schedules-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE 모두 감지
          schema: 'public',
          table: 'schedules'
        },
        () => {
          // 변경 사항 발생 시 데이터 다시 불러오기
          fetchSchedules();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const activeSchedules = useMemo(
    () => (activeDate ? scheduleData[activeDate] ?? [] : []),
    [activeDate, scheduleData]
  );

  return (
    <section id="schedule" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            SCHEDULE
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            행사 일정표
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            1박 2일간의 알찬 프로그램을 확인하세요
          </p>
        </motion.div>

        {/* 날짜 탭 */}
        {dateKeys.length > 0 && (
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1 bg-secondary rounded-xl flex-wrap justify-center gap-1">
              {dateKeys.map((key, idx) => (
                <button
                  key={key}
                  onClick={() => setActiveDate(key)}
                  className={cn(
                    "px-6 py-3 rounded-lg font-medium transition-all",
                    activeDate === key
                      ? "bg-gradient-primary text-primary-foreground shadow-lg"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="block text-sm">{idx + 1}일차</span>
                  <span className="block text-xs opacity-80">{formatDateLabel(key)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 일정 타임라인 */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : activeSchedules.length > 0 ? (
          <motion.div
            key={activeDate}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-3xl mx-auto"
          >
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />
              <div className="space-y-4">
                {activeSchedules.map((item, index) => {
                  const Icon = iconMap[item.icon_name] || Clock;
                  // info 유형 또는 Bus 아이콘은 아이콘 색상을 회색으로 통일
                  const isGrayIcon = item.type === "info" || item.icon_name === "Bus";
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative flex gap-4 pl-4"
                    >
                      <div
                        className={cn(
                          "w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 z-10",
                          typeColors[item.type as keyof typeof typeColors]
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5 mb-1",
                            isGrayIcon && "text-muted-foreground"
                          )}
                        />
                        <span className="text-xs font-bold">{item.time}</span>
                      </div>
                      <div className="flex-1 bg-card rounded-2xl p-4 shadow-card hover:shadow-card-hover transition-shadow border border-border/50">
                        <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{item.location}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <p>일정 정보가 없습니다.</p>
          </div>
        )}
      </div>
    </section>
  );
};
