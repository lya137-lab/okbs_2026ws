import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Search, GraduationCap, Building2, Sparkles, Loader2, Calendar, MapPin, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface Participant {
  id: string;
  name: string;
  university: string | null;
  major: string | null;
  intro: string | null;
  photo_url: string | null;
}

interface ParticipantProfileDetail {
  id: string;
  name: string;
  university: string | null;
  major: string | null;
  birth_date: string | null;
  location: string | null;
  mbti: string | null;
  keywords: string[] | null;
  specialty: string | null;
  goals_2026: string | null;
  foundation_activities: string | null;
  photo_url: string | null;
}

export const ParticipantsSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ParticipantProfileDetail | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("participant_profiles")
        .select("id, name, university, major, goals_2026, photo_url")
        .order("created_at", { ascending: true });

      if (error) throw error;

      const participantsData: Participant[] = (data || []).map((profile) => ({
        id: profile.id,
        name: profile.name,
        university: profile.university || null,
        major: profile.major || null,
        intro: profile.goals_2026 || null,
        photo_url: profile.photo_url || null,
      }));

      setParticipants(participantsData);
    } catch (error) {
      console.error("Error fetching participants:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 프로필 상세 정보 조회 (팝업용)
  const fetchProfileDetail = async (profileId: string): Promise<void> => {
    try {
      setIsProfileLoading(true);
      const { data, error } = await supabase
        .from("participant_profiles")
        .select(
          "id, name, university, major, birth_date, location, mbti, keywords, specialty, goals_2026, foundation_activities, photo_url"
        )
        .eq("id", profileId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return;

      setSelectedProfile(data as ParticipantProfileDetail);
      setIsProfileOpen(true);
    } catch (error) {
      console.error("Error fetching participant profile:", error);
    } finally {
      setIsProfileLoading(false);
    }
  };

  const filteredParticipants = participants.filter(
    (p) =>
      p.name.includes(searchQuery) ||
      (p.university && p.university.includes(searchQuery)) ||
      (p.major && p.major.includes(searchQuery))
  );

  return (
    <section id="participants" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            PARTICIPANTS
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            참석자 명단
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            함께할 장학생들을 미리 만나보세요
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-md mx-auto mb-10"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="이름, 학교, 전공으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-6 rounded-2xl bg-card border-border/50 text-base"
            />
          </div>
        </motion.div>

        {/* Participants Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery ? "검색 결과가 없습니다" : "등록된 참가자가 없습니다"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredParticipants.map((participant, index) => (
              <motion.div
                key={participant.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                className="bg-card rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all border border-border/50 cursor-pointer group"
                onClick={() => fetchProfileDetail(participant.id)}
              >
                {/* Avatar */}
                <div className="flex items-start gap-4 mb-4">
                  {participant.photo_url ? (
                    <img
                      src={participant.photo_url}
                      alt={participant.name}
                      className="w-14 h-14 rounded-2xl object-cover shadow-glow/50"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center text-2xl shadow-glow/50">
                      {participant.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">
                      {participant.name}
                    </h3>
                    {participant.university && (
                      <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{participant.university}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2">
                  {participant.major && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="rounded-lg font-normal">
                        <GraduationCap className="h-3 w-3 mr-1" />
                        {participant.major}
                      </Badge>
                    </div>
                  )}
                  {participant.intro && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      <Sparkles className="inline h-3.5 w-3.5 mr-1 text-accent" />
                      {participant.intro}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 프로필 상세 팝업 */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>참가자 프로필</DialogTitle>
          </DialogHeader>
          {isProfileLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : selectedProfile ? (
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div className="flex items-start gap-4">
                {selectedProfile.photo_url ? (
                  <img
                    src={selectedProfile.photo_url}
                    alt={selectedProfile.name}
                    className="w-20 h-20 rounded-2xl object-cover shadow-glow/50"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center text-2xl shadow-glow/50">
                    {selectedProfile.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-foreground">{selectedProfile.name}</h3>
                  <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-4 w-4" />
                      <span>
                        {selectedProfile.university || "-"}
                        {selectedProfile.major ? ` · ${selectedProfile.major}` : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>{selectedProfile.birth_date || "-"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      <span>{selectedProfile.location || "-"}</span>
                    </div>
                  </div>
                </div>
                {selectedProfile.mbti && (
                  <Badge variant="secondary">{selectedProfile.mbti}</Badge>
                )}
              </div>

              {/* 키워드 */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  나를 표현하는 키워드
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(selectedProfile.keywords || []).filter(Boolean).length > 0 ? (
                    (selectedProfile.keywords || []).filter(Boolean).map((keyword) => (
                      <Badge key={keyword} variant="outline">
                        {keyword}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">등록된 키워드가 없습니다.</span>
                  )}
                </div>
              </div>

              {/* 특기 */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">나만의 특기</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedProfile.specialty || "등록된 특기가 없습니다."}
                </p>
              </div>

              {/* 2026년 목표 */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">2026년 목표</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedProfile.goals_2026 || "등록된 목표가 없습니다."}
                </p>
              </div>

              {/* 장학재단 활동 */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">장학재단에서 하고 싶은 활동</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedProfile.foundation_activities || "등록된 활동이 없습니다."}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground">
              프로필 정보를 불러올 수 없습니다.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};
