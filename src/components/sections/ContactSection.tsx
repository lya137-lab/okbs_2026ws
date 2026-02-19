import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { Phone, Mail, MessageCircle, ChevronDown, ExternalLink, MapPin, Bus, BedDouble, Utensils, FileText, HelpCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

// 담당자 연락처 (수정 시 이 값만 변경)
const contacts = [
  {
    name: "김태훈 (운영 총괄)",
    phone: "010-8571-1911",
    email: "ok_scholarship@naver.com",
    avatar: "👨‍💼",
  },
  {
    name: "임영아 (스태프)",
    phone: "010-9373-6288",
    email: "lya0215@naver.com",
    avatar: "👩‍💻",
  },
];

/**
 * 카카오톡 문의 링크
 * - 카카오톡 채널이 있으면: 채널 관리자센터 > 상세설정 > 채널 URL 복사 (예: https://pf.kakao.com/_xxxxx/chat)
 * - 없으면 빈 문자열("")로 두면 버튼 클릭 시 #으로만 이동
 */
const KAKAOTALK_INQUIRY_URL = "https://open.kakao.com/o/gyeai6ei";

// 아이콘 매핑
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MapPin,
  Bus,
  BedDouble,
  Utensils,
  FileText,
  HelpCircle,
};

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  icon_name: string;
  display_order: number;
}

interface FAQCategory {
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  items: FAQItem[];
}

export const ContactSection = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // 카테고리별로 FAQ 그룹핑 (Supabase faqs 테이블 데이터 전부 반영)
  const faqCategories = useMemo((): FAQCategory[] => {
    const categories: Record<string, FAQItem[]> = {};

    faqs.forEach((faq) => {
      if (!categories[faq.category]) {
        categories[faq.category] = [];
      }
      categories[faq.category].push(faq);
    });

    // 각 카테고리 내에서 display_order로 정렬
    Object.keys(categories).forEach((cat) => {
      categories[cat].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    });

    // FAQ 탭 표시 순서 (Supabase에 없는 카테고리는 무시됨). 그 외 새 카테고리는 뒤에 추가
    const preferredOrder = [
      "준비사항 관련",
      "연수 관련",
      "객실 관련",
      "프로그램 관련",
    ];
    const orderedSet = new Set<string>();
    preferredOrder.forEach((cat) => {
      if (categories[cat]?.length) orderedSet.add(cat);
    });
    Object.keys(categories).forEach((cat) => orderedSet.add(cat));
    const categoryOrder = Array.from(orderedSet);

    return categoryOrder.map((cat) => {
      const firstItem = categories[cat][0];
      const Icon = iconMap[firstItem?.icon_name] || HelpCircle;
      return {
        category: cat,
        icon: Icon,
        items: categories[cat],
      };
    });
  }, [faqs]);

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        setIsLoading(true);
        // faqs 테이블은 types.ts에 없음. Supabase에는 존재하므로 타입 단언 사용
        const { data, error } = await (supabase as { from: (t: string) => ReturnType<typeof supabase["from"]> }).from("faqs").select("*").order("category", { ascending: true }).order("display_order", { ascending: true });

        if (error) throw error;
        setFaqs((data as FAQItem[]) || []);

        setOpenCategory((prev) => {
          const items = (data as FAQItem[]) || [];
          if (items.length > 0 && !prev) return items[0].category;
          return prev;
        });
      } catch (error) {
        console.error("Error fetching FAQs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFAQs();

    // 실시간 업데이트: FAQ 변경 시 자동 반영
    const channel = supabase
      .channel("faqs-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "faqs" },
        () => fetchFAQs()
      )
      .subscribe();

    // 탭 전환 후 돌아왔을 때 최신 FAQ 다시 불러오기 (Supabase 수정 반영)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchFAQs();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <section id="faq" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            FAQ & CONTACT
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            자주 묻는 질문
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            궁금한 점이 있으시면 아래 FAQ를 확인하거나 담당자에게 문의하세요
          </p>
        </motion.div>

        {/* FAQ Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto mb-12"
        >
          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {faqCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.category}
                  onClick={() => {
                    setOpenCategory(cat.category);
                    setOpenFaq(null);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                    openCategory === cat.category
                      ? "bg-gradient-primary text-primary-foreground shadow-glow"
                      : "bg-card text-muted-foreground hover:text-foreground border border-border/50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {cat.category}
                </button>
              );
            })}
          </div>

          {/* FAQ Items */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {faqCategories
                .find((cat) => cat.category === openCategory)
                ?.items.map((faq, index) => (
                  <motion.div
                    key={faq.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      className="w-full flex items-center justify-between p-5 text-left"
                    >
                      <span className="font-medium text-foreground pr-4">{faq.question}</span>
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 text-muted-foreground shrink-0 transition-transform",
                          openFaq === index && "rotate-180"
                        )}
                      />
                    </button>
                    <motion.div
                      initial={false}
                      animate={{
                        height: openFaq === index ? "auto" : 0,
                        opacity: openFaq === index ? 1 : 0,
                      }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                        {faq.answer}
                      </p>
                    </motion.div>
                  </motion.div>
                ))}
            </div>
          )}
        </motion.div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <h3 className="text-xl font-bold text-foreground text-center mb-6">
            추가 문의가 필요하신가요?
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {contacts.map((contact, index) => (
              <div
                key={index}
                className="bg-card rounded-2xl p-5 shadow-card border border-border/50 flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-xl shadow-glow/50">
                  {contact.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-foreground text-sm mb-2">{contact.name}</h4>
                  <div className="space-y-1">
                    <a
                      href={`tel:${contact.phone.replace(/-/g, "")}`}
                      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {contact.phone}
                    </a>
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors truncate"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {contact.email}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Links */}
          <div className="mt-6 bg-card rounded-2xl p-5 shadow-card border border-border/50">
            <div className="grid grid-cols-2 gap-3">
              <a
                href={KAKAOTALK_INQUIRY_URL || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-sm font-medium"
              >
                <MessageCircle className="h-4 w-4 text-primary" />
                카카오톡 문의
                <ExternalLink className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
              </a>
              <a
                href="#"
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-sm font-medium"
              >
                📋 만족도 설문
                <ExternalLink className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
