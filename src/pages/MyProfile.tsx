import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Bus,
  BedDouble,
  FileText,
  Loader2,
  MapPin,
  Clock,
  GraduationCap,
} from "lucide-react";
import { useParticipantAuth } from "@/hooks/useParticipantAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

/** participant_profiles Row */
type ProfileRow = Tables<"participant_profiles">;
/** bus_passengers + buses 조인 결과 */
type BusAssignmentRow = Tables<"bus_passengers"> & { buses: Tables<"buses"> | null };
/** room_members + rooms + 같은 방 입실자 조인 결과 */
type RoomAssignmentRow = Tables<"room_members"> & {
  rooms: Tables<"rooms"> | null;
  room_members: Tables<"room_members">[] | null;
};

/**
 * 나의 프로필 페이지
 * participants.id에 연동된 participant_profiles, bus_passengers, room_members를 한 화면에 표시
 */
const MyProfile = () => {
  const navigate = useNavigate();
  const { isLoggedIn, participantId, participantName, participantPhone, login } = useParticipantAuth();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [busAssignments, setBusAssignments] = useState<BusAssignmentRow[]>([]);
  const [roomAssignment, setRoomAssignment] = useState<RoomAssignmentRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPersonalInfo, setIsSavingPersonalInfo] = useState(false);
  const [boardingUpdateIds, setBoardingUpdateIds] = useState<Record<string, boolean>>({});
  const [personalForm, setPersonalForm] = useState({
    name: "",
    phone: "",
    team: "",
    cohort: "",
    university: "",
    major: "",
    enrollmentStatus: "",
  });

  // 재학여부 옵션
  const ENROLLMENT_STATUSES = ["재학", "휴학", "교환학생", "졸업예정", "기타"];
  // 버스 구분 정렬 기준
  const BUS_TYPE_ORDER = ["출발", "행사중", "귀가"];

  useEffect(() => {
    if (!isLoggedIn || !participantId) {
      setIsLoading(false);
      return;
    }
    fetchMyProfile();
  }, [isLoggedIn, participantId]);

  /** participant_id 기준으로 자기소개·버스·숙소 한 번에 조회 */
  const fetchMyProfile = async (): Promise<void> => {
    if (!participantId) return;
    try {
      setIsLoading(true);
      const pid = participantId;

      // 0. 개인정보 (participants)
      const { data: participantData } = await supabase
        .from("participants")
        .select("*")
        .eq("id", pid)
        .maybeSingle();
      setPersonalForm({
        name: participantData?.name ?? participantName ?? "",
        phone: participantData?.phone ?? participantPhone ?? "",
        team: participantData?.team ?? "STAFF",
        cohort: participantData?.cohort ?? "",
        university: participantData?.university ?? "",
        major: participantData?.major ?? "",
        enrollmentStatus: participantData?.enrollment_status ?? "",
      });

      // 1. 자기소개 (participant_profiles)
      const { data: profileData } = await supabase
        .from("participant_profiles")
        .select("*")
        .eq("participant_id", pid)
        .maybeSingle();
      setProfile(profileData ?? null);

      // 2. 버스 배정 (bus_passengers + buses, participant_id 연동)
      const { data: busData } = await supabase
        .from("bus_passengers")
        .select("*, buses(*)")
        .eq("participant_id", pid);

      // participant_id로 찾지 못하면 이름 기준으로 보완 조회
      const fallbackBusData = !busData || busData.length === 0
        ? await supabase
            .from("bus_passengers")
            .select("*, buses(*)")
            .eq("name", participantName)
        : null;

      const resolvedBusAssignments =
        (busData as BusAssignmentRow[] | null) ??
        (fallbackBusData?.data as BusAssignmentRow[] | null) ??
        [];
      // 출발/행사중/귀가 순서로 정렬
      const sortedBusAssignments = [...resolvedBusAssignments].sort((a, b) => {
        const aType = a.buses?.bus_type || a.bus_type || "출발";
        const bType = b.buses?.bus_type || b.bus_type || "출발";
        return BUS_TYPE_ORDER.indexOf(aType) - BUS_TYPE_ORDER.indexOf(bType);
      });
      setBusAssignments(sortedBusAssignments);

      // 3. 숙소 배정 (room_members -> rooms -> 같은 방 입실자)
      const { data: roomMemberData } = await supabase
        .from("room_members")
        .select("*")
        .eq("participant_id", pid)
        .maybeSingle();

      // participant_id로 찾지 못하면 이름/연락처로 보완 조회
      const normalizedPhone = normalizePhoneNumber(participantPhone ?? "");
      const fallbackRoomMember = !roomMemberData
        ? await supabase
            .from("room_members")
            .select("*")
            .or(`name.eq.${participantName},phone.eq.${normalizedPhone}`)
            .order("created_at", { ascending: false })
            .limit(1)
        : null;

      const selectedRoomMember =
        (roomMemberData as Tables<"room_members"> | null) ??
        (fallbackRoomMember?.data?.[0] as Tables<"room_members"> | null);

      if (selectedRoomMember?.room_id) {
        const { data: roomWithMembers } = await supabase
          .from("rooms")
          .select("*, room_members(*)")
          .eq("id", selectedRoomMember.room_id)
          .maybeSingle();

        setRoomAssignment({
          ...selectedRoomMember,
          rooms: (roomWithMembers as Tables<"rooms"> | null) ?? null,
          room_members: (roomWithMembers?.room_members as Tables<"room_members">[]) ?? [],
        });
      } else {
        setRoomAssignment((selectedRoomMember as RoomAssignmentRow) ?? null);
      }
    } catch (error) {
      console.error("Error fetching my profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 전화번호 숫자만 저장 (로그인/연동 기준 통일)
  const normalizePhoneNumber = (value: string): string => value.replace(/[^\d]/g, "");

  // 개인정보 저장
  const handleSavePersonalInfo = async (): Promise<void> => {
    if (!participantId) return;

    if (!personalForm.name || !personalForm.phone) {
      toast.error("이름과 연락처를 입력해주세요.");
      return;
    }

    try {
      setIsSavingPersonalInfo(true);
      const normalizedPhone = normalizePhoneNumber(personalForm.phone);

      const { error } = await supabase
        .from("participants")
        .update({
          name: personalForm.name,
          phone: normalizedPhone,
          cohort: personalForm.cohort || null,
          university: personalForm.university || null,
          major: personalForm.major || null,
          enrollment_status: personalForm.enrollmentStatus || null,
        })
        .eq("id", participantId);

      if (error) throw error;

      // 로그인 정보 동기화 (이름/연락처)
      login(participantId, personalForm.name, normalizedPhone);

      // 최신 개인정보 다시 로드
      fetchMyProfile();
      toast.success("개인정보가 저장되었습니다.");
    } catch (error) {
      console.error("Error updating personal info:", error);
      toast.error("개인정보 저장에 실패했습니다.");
    } finally {
      setIsSavingPersonalInfo(false);
    }
  };

  // 버스 탑승 여부 토글
  const handleToggleBoarded = async (assignment: BusAssignmentRow): Promise<void> => {
    try {
      setBoardingUpdateIds((prev) => ({ ...prev, [assignment.id]: true }));
      const nextBoarded = !assignment.boarded;

      const { error } = await supabase
        .from("bus_passengers")
        .update({ boarded: nextBoarded })
        .eq("id", assignment.id);

      if (error) throw error;

      toast.success(nextBoarded ? "탑승 처리되었습니다." : "미탑승으로 변경되었습니다.");
      fetchMyProfile();
    } catch (error) {
      console.error("Error updating boarded status:", error);
      toast.error("탑승 여부 변경에 실패했습니다.");
    } finally {
      setBoardingUpdateIds((prev) => ({ ...prev, [assignment.id]: false }));
    }
  };

  if (!isLoggedIn) {
    navigate("/login", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* 상단 뒤로가기 */}
          <div className="mb-6">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                <ArrowLeft className="w-4 h-4" />
                홈으로
              </Button>
            </Link>
          </div>

          <div className="max-w-2xl mx-auto space-y-6">
            {/* 제목 */}
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center justify-center gap-2">
                <User className="w-8 h-8 text-primary" />
                나의 프로필
              </h1>
              <p className="text-muted-foreground mt-2">
                {participantName}님의 배정·자기소개 정보입니다
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* 메뉴 */}
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href="#personal-info">개인정보 수정</a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href="#self-intro">자기소개 수정</a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href="#bus-assignment">버스배정 확인</a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href="#room-assignment">숙소배정 확인</a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* 0. 개인정보 (participants) */}
                <Card id="personal-info">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      개인정보 수정
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="personal_name">이름 *</Label>
                        <Input
                          id="personal_name"
                          value={personalForm.name}
                          onChange={(e) =>
                            setPersonalForm({ ...personalForm, name: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="personal_phone">연락처 *</Label>
                        <Input
                          id="personal_phone"
                          value={personalForm.phone}
                          onChange={(e) =>
                            setPersonalForm({ ...personalForm, phone: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="personal_team">조</Label>
                        <Input
                          id="personal_team"
                          value={personalForm.team}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="personal_cohort">기수</Label>
                        <Input
                          id="personal_cohort"
                          value={personalForm.cohort}
                          onChange={(e) =>
                            setPersonalForm({ ...personalForm, cohort: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="personal_university">학교</Label>
                        <Input
                          id="personal_university"
                          value={personalForm.university}
                          onChange={(e) =>
                            setPersonalForm({ ...personalForm, university: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="personal_major">전공</Label>
                        <Input
                          id="personal_major"
                          value={personalForm.major}
                          onChange={(e) =>
                            setPersonalForm({ ...personalForm, major: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>26년 1학기 재학여부</Label>
                        <Select
                          value={personalForm.enrollmentStatus}
                          onValueChange={(value) =>
                            setPersonalForm({ ...personalForm, enrollmentStatus: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="재학여부를 선택하세요" />
                          </SelectTrigger>
                          <SelectContent>
                            {ENROLLMENT_STATUSES.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSavePersonalInfo}
                        disabled={isSavingPersonalInfo}
                      >
                        {isSavingPersonalInfo ? "저장 중..." : "저장"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* 1. 자기소개 (participant_profiles) */}
                <Card id="self-intro">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      자기소개
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {profile ? (
                      <>
                        {(profile.university || profile.major) && (
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" />
                            {[profile.university, profile.major].filter(Boolean).join(" · ")}
                          </p>
                        )}
                        {profile.location && (
                          <p className="text-sm flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            {profile.location}
                          </p>
                        )}
                        {profile.mbti && (
                          <Badge variant="secondary">{profile.mbti}</Badge>
                        )}
                        {profile.keywords?.filter(Boolean).length > 0 && (
                          <p className="text-sm">
                            키워드: {profile.keywords.filter(Boolean).join(", ")}
                          </p>
                        )}
                        {profile.specialty && (
                          <p className="text-sm"><span className="font-medium">특기:</span> {profile.specialty}</p>
                        )}
                        {profile.goals_2026 && (
                          <p className="text-sm"><span className="font-medium">2026 목표:</span> {profile.goals_2026}</p>
                        )}
                        {profile.foundation_activities && (
                          <p className="text-sm"><span className="font-medium">재단 활동:</span> {profile.foundation_activities}</p>
                        )}
                        <Link to="/self-introduction">
                          <Button variant="outline" size="sm" className="mt-2">
                            자기소개 수정
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <>
                        <p className="text-muted-foreground text-sm">작성한 자기소개가 없습니다.</p>
                        <Link to="/self-introduction">
                          <Button variant="outline" size="sm">자기소개 작성하기</Button>
                        </Link>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* 2. 버스 배정 (bus_passengers + buses) */}
                <Card id="bus-assignment">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bus className="w-5 h-5 text-primary" />
                      버스 배정
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {busAssignments.length > 0 ? (
                      <div className="space-y-4">
                        {busAssignments.map((assignment) => (
                          <div key={assignment.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">
                                {assignment.buses?.bus_number || assignment.bus_id}
                              </p>
                              <Badge variant={assignment.boarded ? "default" : "secondary"}>
                                {assignment.boarded ? "탑승" : "미탑승"}
                              </Badge>
                            </div>
                            {/* 버스 운행 구분 표시 */}
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">구분:</span>{" "}
                              {assignment.buses?.bus_type || assignment.bus_type || "출발"}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {assignment.buses?.meeting_point || "-"}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {assignment.buses?.departure_time || "-"} 출발 ·{" "}
                              {assignment.buses?.departure || "-"}
                            </p>
                            <div className="flex justify-end">
                              <Button
                                variant={assignment.boarded ? "outline" : "default"}
                                size="sm"
                                onClick={() => handleToggleBoarded(assignment)}
                                disabled={boardingUpdateIds[assignment.id]}
                              >
                                {assignment.boarded ? "미탑승으로 변경" : "탑승 체크"}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">배정된 버스가 없습니다.</p>
                    )}
                  </CardContent>
                </Card>

                {/* 3. 숙소 배정 (room_members + rooms) */}
                <Card id="room-assignment">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BedDouble className="w-5 h-5 text-primary" />
                      숙소 배정
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {roomAssignment?.rooms ? (
                      <div className="space-y-4">
                        <p className="font-medium">
                          {roomAssignment.rooms.room_number} ({roomAssignment.rooms.room_type})
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {roomAssignment.rooms.building_name
                            ? `${roomAssignment.rooms.building_name} · `
                            : ""}
                          {roomAssignment.rooms.floor} · {roomAssignment.rooms.gender}
                        </p>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-foreground">같은 방 입실자</p>
                          {(roomAssignment.room_members || []).length > 0 ? (
                            <div className="space-y-2">
                              {(roomAssignment.room_members || []).map((member) => (
                                <div
                                  key={member.id}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">{member.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {member.university || "-"}
                                    </span>
                                  </div>
                                  <span className="text-muted-foreground">
                                    {member.phone || "-"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">입실자 정보가 없습니다.</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">배정된 숙소가 없습니다.</p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyProfile;
