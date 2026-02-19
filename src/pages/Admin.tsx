import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { 
  ArrowLeft, 
  BedDouble, 
  Bus, 
  Plus, 
  Trash2, 
  Edit, 
  Users, 
  LogOut,
  Loader2,
  Building2,
  UserPlus,
  Search,
  Shield,
  Megaphone,
  Calendar,
  HelpCircle
} from "lucide-react";

/** scheduled_date 포맷: "3월 14일 (토)" */
function formatScheduleDateLabel(isoDate: string): string {
  try {
    return format(new Date(isoDate), "M월 d일 (EEE)", { locale: ko });
  } catch {
    return isoDate;
  }
}

// 버스 운행 구분 옵션 (출발/행사중/귀가)
const BUS_TYPE_OPTIONS = ["출발", "행사중", "귀가"] as const;

// 버스 운행 구분 타입
type BusType = (typeof BUS_TYPE_OPTIONS)[number];

// 잘못된 값이 들어올 때 기본값으로 보정
const getSafeBusType = (busType?: string | null): BusType => {
  if (BUS_TYPE_OPTIONS.includes(busType as BusType)) {
    return busType as BusType;
  }
  return "출발";
};

interface RoomAssignment {
  id: string;
  building_name: string | null;
  floor: string | null;
  room_number: string | null;
  room_type: string | null;
  team: string | null;
  name: string;
  university: string | null;
  major: string | null;
  phone: string | null;
}

interface BusData {
  id: string;
  bus_number: string;
  bus_type: string;
  departure: string;
  departure_time: string;
  meeting_point: string;
  capacity: number;
}

interface BusPassenger {
  id: string;
  bus_id: string;
  name: string;
  university: string | null;
  is_mentor: boolean | null;
  boarded: boolean | null;
}

interface ParticipantProfileDetail {
  id: string;
  participant_id: string;
  name: string;
  university: string | null;
  major: string | null;
  mbti: string | null;
  keywords: string[] | null;
  specialty: string | null;
  goals_2026: string | null;
  foundation_activities: string | null;
}

interface ParticipantItem {
  id: string;
  name: string;
  phone: string;
  cohort: string | null;
  university: string | null;
  major: string | null;
  enrollment_status: string | null;
}

interface Announcement {
  id: string;
  title: string;
  author: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// types.ts에 없는 테이블(faqs, announcements, schedules, room_assignments) 조회용
const supabaseTable = (table: string) =>
  (supabase as { from: (t: string) => ReturnType<typeof supabase["from"]> }).from(table);

const Admin = () => {
  const { user, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  // Room Assignments state (room_assignments 테이블)
  const [roomAssignments, setRoomAssignments] = useState<RoomAssignment[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  // rooms + room_members (웹사이트 숙소 배정과 동일 데이터)
  const [roomsWithMembers, setRoomsWithMembers] = useState<Array<{ id: string; building_name: string | null; room_number: string; floor: string; room_type: string; gender: string; capacity: number; room_members: Array<{ id: string; name: string; university: string | null; role: string | null; phone: string | null }> }>>([]);
  const [isLoadingRoomsWithMembers, setIsLoadingRoomsWithMembers] = useState(true);
  const [selectedRoomGroup, setSelectedRoomGroup] = useState("all");
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomAssignment | null>(null);
  const [newRoomAssignment, setNewRoomAssignment] = useState({
    building_name: "",
    floor: "",
    room_number: "",
    room_type: "2인실",
    team: "",
    name: "",
    university: "",
    major: "",
    phone: "",
  });
  
  // Buses state
  const [buses, setBuses] = useState<BusData[]>([]);
  const [busPassengers, setBusPassengers] = useState<BusPassenger[]>([]);
  const [isLoadingBuses, setIsLoadingBuses] = useState(true);
  const [selectedBusType, setSelectedBusType] = useState<BusType>("출발");
  const [busDialogOpen, setBusDialogOpen] = useState(false);
  const [passengerDialogOpen, setPassengerDialogOpen] = useState(false);
  const [selectedBus, setSelectedBus] = useState<BusData | null>(null);
  const [boardingUpdateIds, setBoardingUpdateIds] = useState<Record<string, boolean>>({});
  const [newBus, setNewBus] = useState<{
    bus_number: string;
    bus_type: BusType;
    departure: string;
    departure_time: string;
    meeting_point: string;
    capacity: number;
  }>({
    bus_number: "",
    bus_type: "출발",
    departure: "서울역",
    departure_time: "13:00",
    meeting_point: "",
    capacity: 45,
  });
  const [newPassenger, setNewPassenger] = useState({ name: "", university: "", is_mentor: false, bus_id: "" });

  // Participants state (participants 테이블)
  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(true);
  const [participantDialogOpen, setParticipantDialogOpen] = useState(false);
  const [participantSearchQuery, setParticipantSearchQuery] = useState("");
  const [participantEditDialogOpen, setParticipantEditDialogOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantItem | null>(null);
  const [participantProfileDialogOpen, setParticipantProfileDialogOpen] = useState(false);
  const [participantProfileDetail, setParticipantProfileDetail] = useState<ParticipantProfileDetail | null>(null);
  const [newParticipant, setNewParticipant] = useState({
    name: "",
    phone: "",
  });
  const [editParticipant, setEditParticipant] = useState({
    name: "",
    phone: "",
  });

  // Announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", author: "", content: "" });

  // FAQs state
  interface FAQItem {
    id: string;
    category: string;
    question: string;
    answer: string;
    icon_name: string;
    display_order: number;
  }

  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [isLoadingFAQs, setIsLoadingFAQs] = useState(true);
  const [faqDialogOpen, setFaqDialogOpen] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQItem | null>(null);
  const [newFAQ, setNewFAQ] = useState({
    category: "행사 기본정보",
    question: "",
    answer: "",
    icon_name: "MapPin",
    display_order: 0,
  });

  // Schedules state (schedules 테이블만 사용, schedule_days 미사용)
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

  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [newSchedule, setNewSchedule] = useState({
    scheduled_date: "",
    time: "",
    title: "",
    location: "",
    type: "info",
    icon_name: "Clock",
    display_order: 0,
  });

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchRoomAssignments();
      fetchRoomsWithMembers();
      fetchBuses();
      fetchParticipants();
      fetchAnnouncements();
      fetchSchedules();
      fetchFAQs();
    }
  }, [user]);

  // 버스 탑승 상태 실시간 반영
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("bus-passengers-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bus_passengers" },
        () => {
          fetchBuses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchRoomAssignments = async () => {
    setIsLoadingRooms(true);
    try {
      const { data, error } = await supabaseTable("room_assignments")
        .select("*")
        .order("building_name", { ascending: true })
        .order("floor", { ascending: true })
        .order("room_number", { ascending: true });

      if (error) throw error;
      setRoomAssignments((data as RoomAssignment[]) || []);
    } catch (error) {
      console.error("Error fetching room assignments:", error);
      toast.error("방배정 데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoadingRooms(false);
    }
  };

  /** 웹사이트 숙소 배정과 동일한 rooms + room_members 조회 */
  const fetchRoomsWithMembers = async () => {
    setIsLoadingRoomsWithMembers(true);
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("*, room_members(*)")
        .order("floor", { ascending: true })
        .order("room_number", { ascending: true });

      if (error) throw error;
      setRoomsWithMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching rooms/room_members:", error);
      toast.error("객실·입실자 데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoadingRoomsWithMembers(false);
    }
  };

  const fetchBuses = async () => {
    setIsLoadingBuses(true);
    try {
      const { data: busesData, error: busesError } = await supabase
        .from("buses")
        .select("*")
        .order("bus_number", { ascending: true });

      if (busesError) throw busesError;

      const { data: passengersData, error: passengersError } = await supabase
        .from("bus_passengers")
        .select("*");

      if (passengersError) throw passengersError;

      setBuses(busesData || []);
      setBusPassengers(passengersData || []);
    } catch (error) {
      console.error("Error fetching buses:", error);
      toast.error("버스 데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoadingBuses(false);
    }
  };

  // 전화번호 숫자만 추출
  const normalizePhoneNumber = (value: string): string => value.replace(/[^\d]/g, "");

  // 연락처 표시용 포맷
  const formatPhoneForDisplay = (value: string): string => {
    const numbers = normalizePhoneNumber(value);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  // 탑승자 이름 오름차순 정렬
  const sortPassengersByName = <T extends { name: string }>(passengers: T[]): T[] => {
    return [...passengers].sort((a, b) => a.name.localeCompare(b.name, "ko"));
  };

  // 개별이동 표시 여부
  const isIndividualMoveBus = (bus: BusData): boolean => {
    return bus.departure === "개별이동" || bus.bus_number.includes("개별");
  };

  // 참가자 목록 조회
  const fetchParticipants = async () => {
    setIsLoadingParticipants(true);
    try {
      const { data, error } = await supabase
        .from("participants")
        .select("id, name, phone, cohort, university, major, enrollment_status")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setParticipants((data as ParticipantItem[]) || []);
    } catch (error) {
      console.error("Error fetching participants:", error);
      toast.error("참가자 데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoadingParticipants(false);
    }
  };

  // 참가자 추가
  const handleAddParticipant = async () => {
    if (!isAdmin) {
      toast.error("관리자 권한이 필요합니다.");
      return;
    }

    if (!newParticipant.name || !newParticipant.phone) {
      toast.error("이름과 연락처를 모두 입력해주세요.");
      return;
    }

    try {
      const normalizedPhone = normalizePhoneNumber(newParticipant.phone);

      // 중복 연락처 확인
      const { data: existingParticipant } = await supabase
        .from("participants")
        .select("id")
        .eq("phone", normalizedPhone)
        .maybeSingle();

      if (existingParticipant) {
        toast.error("이미 등록된 연락처입니다.");
        return;
      }

      const { error } = await supabase
        .from("participants")
        .insert([{
          name: newParticipant.name,
          phone: normalizedPhone,
          cohort: null,
          university: null,
          major: null,
          enrollment_status: null,
        }]);

      if (error) throw error;

      toast.success("참가자가 등록되었습니다.");
      setParticipantDialogOpen(false);
      setNewParticipant({ name: "", phone: "" });
      fetchParticipants();
    } catch (error: any) {
      console.error("Error adding participant:", error);
      toast.error("참가자 등록에 실패했습니다: " + error.message);
    }
  };

  // 참가자 수정 열기
  const handleEditParticipant = (participant: ParticipantItem) => {
    setSelectedParticipant(participant);
    setEditParticipant({
      name: participant.name,
      phone: participant.phone,
    });
    setParticipantEditDialogOpen(true);
  };

  // 참가자 자기소개 조회
  const handleViewParticipantProfile = async (participantId: string) => {
    try {
      const { data, error } = await supabase
        .from("participant_profiles")
        .select("*")
        .eq("participant_id", participantId)
        .maybeSingle();

      if (error) throw error;

      setParticipantProfileDetail((data as ParticipantProfileDetail) ?? null);
      setParticipantProfileDialogOpen(true);
    } catch (error) {
      console.error("Error fetching participant profile:", error);
      toast.error("자기소개 정보를 불러오지 못했습니다.");
    }
  };

  // 참가자 수정 저장
  const handleUpdateParticipant = async () => {
    if (!isAdmin) {
      toast.error("관리자 권한이 필요합니다.");
      return;
    }

    if (!selectedParticipant) {
      toast.error("수정할 참가자를 선택해주세요.");
      return;
    }

    if (!editParticipant.name || !editParticipant.phone) {
      toast.error("이름과 연락처를 모두 입력해주세요.");
      return;
    }

    try {
      const normalizedPhone = normalizePhoneNumber(editParticipant.phone);

      // 중복 연락처 확인 (자기 자신 제외)
      const { data: existingParticipant } = await supabase
        .from("participants")
        .select("id")
        .eq("phone", normalizedPhone)
        .maybeSingle();

      if (existingParticipant && existingParticipant.id !== selectedParticipant.id) {
        toast.error("이미 등록된 연락처입니다.");
        return;
      }

      const { error } = await supabase
        .from("participants")
        .update({
          name: editParticipant.name,
          phone: normalizedPhone,
        })
        .eq("id", selectedParticipant.id);

      if (error) throw error;

      toast.success("참가자 정보가 수정되었습니다.");
      setParticipantEditDialogOpen(false);
      setSelectedParticipant(null);
      setEditParticipant({ name: "", phone: "" });
      fetchParticipants();
    } catch (error: any) {
      console.error("Error updating participant:", error);
      toast.error("참가자 수정에 실패했습니다: " + error.message);
    }
  };

  // 참가자 삭제
  const handleDeleteParticipant = async (participantId: string) => {
    if (!isAdmin) {
      toast.error("관리자 권한이 필요합니다.");
      return;
    }

    if (!confirm("정말 이 참가자를 삭제하시겠습니까?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("participants")
        .delete()
        .eq("id", participantId);

      if (error) throw error;

      toast.success("참가자가 삭제되었습니다.");
      fetchParticipants();
    } catch (error: any) {
      console.error("Error deleting participant:", error);
      toast.error("참가자 삭제에 실패했습니다: " + error.message);
    }
  };

  // 참가자 검색 필터
  const filteredParticipants = participants.filter((participant) => {
    const query = participantSearchQuery.trim();
    if (!query) return true;
    return (
      participant.name.includes(query) ||
      participant.phone.includes(normalizePhoneNumber(query))
    );
  });

  // 숙소(건물-층) 탭 목록
  const roomGroupKeys = Array.from(
    new Set(
      roomsWithMembers.map(
        (room) => `${room.building_name || "미정"} · ${room.floor || "미정"}`
      )
    )
  );
  const roomGroupOrder = ["본관 · 2층", "본관 · 3층", "별관 · 1층", "별관 · 2층"];
  const sortedRoomGroupKeys = [
    ...roomGroupOrder.filter((key) => roomGroupKeys.includes(key)),
    ...roomGroupKeys.filter((key) => !roomGroupOrder.includes(key)),
  ];

  const fetchAnnouncements = async () => {
    setIsLoadingAnnouncements(true);
    try {
      const { data, error } = await supabaseTable("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnouncements((data as Announcement[]) || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast.error("공지사항을 불러오는데 실패했습니다.");
    } finally {
      setIsLoadingAnnouncements(false);
    }
  };

  const handleAddAnnouncement = async () => {
    if (!isAdmin) {
      toast.error("관리자 권한이 필요합니다.");
      return;
    }

    if (!newAnnouncement.title || !newAnnouncement.author || !newAnnouncement.content) {
      toast.error("모든 필드를 입력해주세요.");
      return;
    }

    try {
      const { error } = await supabaseTable("announcements")
        .insert([newAnnouncement]);

      if (error) throw error;

      toast.success("공지사항이 추가되었습니다.");
      setAnnouncementDialogOpen(false);
      setNewAnnouncement({ title: "", author: "", content: "" });
      fetchAnnouncements();
    } catch (error: any) {
      console.error("Error adding announcement:", error);
      toast.error("공지사항 추가에 실패했습니다: " + error.message);
    }
  };

  const handleUpdateAnnouncement = async () => {
    if (!isAdmin || !selectedAnnouncement) {
      toast.error("관리자 권한이 필요합니다.");
      return;
    }

    if (!newAnnouncement.title || !newAnnouncement.author || !newAnnouncement.content) {
      toast.error("모든 필드를 입력해주세요.");
      return;
    }

    try {
      const { error } = await supabaseTable("announcements")
        .update({
          title: newAnnouncement.title,
          author: newAnnouncement.author,
          content: newAnnouncement.content,
        })
        .eq("id", selectedAnnouncement.id);

      if (error) throw error;

      toast.success("공지사항이 수정되었습니다.");
      setAnnouncementDialogOpen(false);
      setSelectedAnnouncement(null);
      setNewAnnouncement({ title: "", author: "", content: "" });
      fetchAnnouncements();
    } catch (error: any) {
      console.error("Error updating announcement:", error);
      toast.error("공지사항 수정에 실패했습니다: " + error.message);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!isAdmin) {
      toast.error("관리자 권한이 필요합니다.");
      return;
    }

    if (!confirm("정말 이 공지사항을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const { error } = await supabaseTable("announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("공지사항이 삭제되었습니다.");
      fetchAnnouncements();
    } catch (error: any) {
      console.error("Error deleting announcement:", error);
      toast.error("공지사항 삭제에 실패했습니다: " + error.message);
    }
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setNewAnnouncement({
      title: announcement.title,
      author: announcement.author,
      content: announcement.content,
    });
    setAnnouncementDialogOpen(true);
  };

  const handleNewAnnouncement = () => {
    setSelectedAnnouncement(null);
    setNewAnnouncement({ title: "", author: "", content: "" });
    setAnnouncementDialogOpen(true);
  };

  // FAQs functions
  const fetchFAQs = async () => {
    setIsLoadingFAQs(true);
    try {
      const { data, error } = await supabaseTable("faqs")
        .select("*")
        .order("category", { ascending: true })
        .order("display_order", { ascending: true });

      if (error) throw error;
      setFaqs((data as FAQItem[]) || []);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      toast.error("FAQ 데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoadingFAQs(false);
    }
  };

  const handleAddFAQ = async () => {
    if (!isAdmin) {
      toast.error("관리자 권한이 필요합니다.");
      return;
    }

    if (!newFAQ.category || !newFAQ.question || !newFAQ.answer) {
      toast.error("카테고리, 질문, 답변을 모두 입력해주세요.");
      return;
    }

    try {
      // display_order 자동 계산 (해당 카테고리의 마지막 순서 + 1)
      const categoryFAQs = faqs.filter(f => f.category === newFAQ.category);
      const maxOrder = categoryFAQs.length > 0
        ? Math.max(...categoryFAQs.map(f => f.display_order))
        : -1;

      const { error } = await supabaseTable("faqs")
        .insert([{
          ...newFAQ,
          display_order: maxOrder + 1,
        }]);

      if (error) throw error;

      toast.success("FAQ가 추가되었습니다.");
      setFaqDialogOpen(false);
      setNewFAQ({
        category: "행사 기본정보",
        question: "",
        answer: "",
        icon_name: "MapPin",
        display_order: 0,
      });
      fetchFAQs();
    } catch (error: any) {
      console.error("Error adding FAQ:", error);
      toast.error("FAQ 추가에 실패했습니다: " + error.message);
    }
  };

  const handleUpdateFAQ = async () => {
    if (!isAdmin || !selectedFAQ) {
      toast.error("관리자 권한이 필요합니다.");
      return;
    }

    if (!newFAQ.category || !newFAQ.question || !newFAQ.answer) {
      toast.error("카테고리, 질문, 답변을 모두 입력해주세요.");
      return;
    }

    try {
      const { error } = await supabaseTable("faqs")
        .update({
          category: newFAQ.category,
          question: newFAQ.question,
          answer: newFAQ.answer,
          icon_name: newFAQ.icon_name,
          display_order: newFAQ.display_order,
        })
        .eq("id", selectedFAQ.id);

      if (error) throw error;

      toast.success("FAQ가 수정되었습니다.");
      setFaqDialogOpen(false);
      setSelectedFAQ(null);
      setNewFAQ({
        category: "행사 기본정보",
        question: "",
        answer: "",
        icon_name: "MapPin",
        display_order: 0,
      });
      fetchFAQs();
    } catch (error: any) {
      console.error("Error updating FAQ:", error);
      toast.error("FAQ 수정에 실패했습니다: " + error.message);
    }
  };

  const handleDeleteFAQ = async (id: string) => {
    if (!isAdmin) {
      toast.error("관리자 권한이 필요합니다.");
      return;
    }

    if (!confirm("정말 이 FAQ를 삭제하시겠습니까?")) {
      return;
    }

    try {
      const { error } = await supabaseTable("faqs")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("FAQ가 삭제되었습니다.");
      fetchFAQs();
    } catch (error: any) {
      console.error("Error deleting FAQ:", error);
      toast.error("FAQ 삭제에 실패했습니다: " + error.message);
    }
  };

  const handleEditFAQ = (faq: FAQItem) => {
    setSelectedFAQ(faq);
    setNewFAQ({
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
      icon_name: faq.icon_name,
      display_order: faq.display_order,
    });
    setFaqDialogOpen(true);
  };

  const handleNewFAQ = () => {
    setSelectedFAQ(null);
    setNewFAQ({
      category: "행사 기본정보",
      question: "",
      answer: "",
      icon_name: "MapPin",
      display_order: 0,
    });
    setFaqDialogOpen(true);
  };

  // Schedules functions (schedules 테이블만 사용)
  const fetchSchedules = async () => {
    setIsLoadingSchedules(true);
    try {
      const { data, error } = await supabaseTable("schedules")
        .select("*")
        .order("scheduled_date", { ascending: true, nullsFirst: false })
        .order("display_order", { ascending: true });

      if (error) throw error;

      setSchedules((data as ScheduleItem[]) || []);
      const dates = [...new Set((data || []).map((s: ScheduleItem) => s.scheduled_date).filter(Boolean))] as string[];
      if (dates.length > 0 && !selectedDate) setSelectedDate(dates[0]);
      if (dates.length === 0) setSelectedDate("");
    } catch (error) {
      console.error("Error fetching schedules:", error);
      toast.error("일정 데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  const handleAddSchedule = async () => {
    if (!isAdmin) {
      toast.error("관리자 권한이 필요합니다.");
      return;
    }

    if (!newSchedule.scheduled_date || !newSchedule.time || !newSchedule.title || !newSchedule.location) {
      toast.error("날짜, 시간, 제목, 장소를 모두 입력해주세요.");
      return;
    }

    try {
      const dateSchedules = schedules.filter(s => s.scheduled_date === newSchedule.scheduled_date);
      const maxOrder = dateSchedules.length > 0
        ? Math.max(...dateSchedules.map(s => s.display_order))
        : -1;

      const { error } = await supabaseTable("schedules")
        .insert([{
          scheduled_date: newSchedule.scheduled_date,
          time: newSchedule.time,
          title: newSchedule.title,
          location: newSchedule.location,
          type: newSchedule.type,
          icon_name: newSchedule.icon_name,
          display_order: maxOrder + 1,
        }]);

      if (error) throw error;

      toast.success("일정이 추가되었습니다.");
      setScheduleDialogOpen(false);
      setNewSchedule({
        scheduled_date: "",
        time: "",
        title: "",
        location: "",
        type: "info",
        icon_name: "Clock",
        display_order: 0,
      });
      fetchSchedules();
    } catch (error: any) {
      console.error("Error adding schedule:", error);
      toast.error("일정 추가에 실패했습니다: " + error.message);
    }
  };

  const handleUpdateSchedule = async () => {
    if (!isAdmin || !selectedSchedule) {
      toast.error("관리자 권한이 필요합니다.");
      return;
    }

    if (!newSchedule.scheduled_date || !newSchedule.time || !newSchedule.title || !newSchedule.location) {
      toast.error("날짜, 시간, 제목, 장소를 모두 입력해주세요.");
      return;
    }

    try {
      const { error } = await supabaseTable("schedules")
        .update({
          scheduled_date: newSchedule.scheduled_date,
          time: newSchedule.time,
          title: newSchedule.title,
          location: newSchedule.location,
          type: newSchedule.type,
          icon_name: newSchedule.icon_name,
          display_order: newSchedule.display_order,
        })
        .eq("id", selectedSchedule.id);

      if (error) throw error;

      toast.success("일정이 수정되었습니다.");
      setScheduleDialogOpen(false);
      setSelectedSchedule(null);
      setNewSchedule({
        scheduled_date: "",
        time: "",
        title: "",
        location: "",
        type: "info",
        icon_name: "Clock",
        display_order: 0,
      });
      fetchSchedules();
    } catch (error: any) {
      console.error("Error updating schedule:", error);
      toast.error("일정 수정에 실패했습니다: " + error.message);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!isAdmin) {
      toast.error("관리자 권한이 필요합니다.");
      return;
    }

    if (!confirm("정말 이 일정을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const { error } = await supabaseTable("schedules")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("일정이 삭제되었습니다.");
      fetchSchedules();
    } catch (error: any) {
      console.error("Error deleting schedule:", error);
      toast.error("일정 삭제에 실패했습니다: " + error.message);
    }
  };

  const handleEditSchedule = (schedule: ScheduleItem) => {
    setSelectedSchedule(schedule);
    setNewSchedule({
      scheduled_date: schedule.scheduled_date || "",
      time: schedule.time,
      title: schedule.title,
      location: schedule.location,
      type: schedule.type,
      icon_name: schedule.icon_name,
      display_order: schedule.display_order,
    });
    setScheduleDialogOpen(true);
  };

  const scheduleDateKeys = [...new Set(schedules.map(s => s.scheduled_date).filter(Boolean))] as string[];

  const handleNewSchedule = () => {
    setSelectedSchedule(null);
    const defaultDate = selectedDate || scheduleDateKeys[0] || format(new Date(), "yyyy-MM-dd");
    setNewSchedule({
      scheduled_date: defaultDate,
      time: "",
      title: "",
      location: "",
      type: "info",
      icon_name: "Clock",
      display_order: 0,
    });
    setScheduleDialogOpen(true);
  };

  const handleAddRoomAssignment = async () => {
    if (!isAdmin) {
      toast.error("관리자 권한이 필요합니다.");
      return;
    }

    if (!newRoomAssignment.name) {
      toast.error("성명을 입력해주세요.");
      return;
    }

    try {
      const { error } = await supabaseTable("room_assignments")
        .insert([{
          ...newRoomAssignment,
          building_name: newRoomAssignment.building_name || null,
          floor: newRoomAssignment.floor || null,
          room_number: newRoomAssignment.room_number || null,
          room_type: newRoomAssignment.room_type || null,
          team: newRoomAssignment.team || null,
          university: newRoomAssignment.university || null,
          major: newRoomAssignment.major || null,
          phone: newRoomAssignment.phone || null,
        }]);

      if (error) throw error;

      toast.success("방배정이 추가되었습니다.");
      setRoomDialogOpen(false);
      setNewRoomAssignment({
        building_name: "",
        floor: "",
        room_number: "",
        room_type: "2인실",
        team: "",
        name: "",
        university: "",
        major: "",
        phone: "",
      });
      fetchRoomAssignments();
    } catch (error: any) {
      console.error("Error adding room assignment:", error);
      toast.error("방배정 추가에 실패했습니다: " + error.message);
    }
  };

  const handleUpdateRoomAssignment = async () => {
    if (!isAdmin || !selectedRoom) {
      toast.error("관리자 권한이 필요합니다.");
      return;
    }

    if (!newRoomAssignment.name) {
      toast.error("성명을 입력해주세요.");
      return;
    }

    try {
      const { error } = await supabaseTable("room_assignments")
        .update({
          building_name: newRoomAssignment.building_name || null,
          floor: newRoomAssignment.floor || null,
          room_number: newRoomAssignment.room_number || null,
          room_type: newRoomAssignment.room_type || null,
          team: newRoomAssignment.team || null,
          name: newRoomAssignment.name,
          university: newRoomAssignment.university || null,
          major: newRoomAssignment.major || null,
          phone: newRoomAssignment.phone || null,
        })
        .eq("id", selectedRoom.id);

      if (error) throw error;

      toast.success("방배정이 수정되었습니다.");
      setRoomDialogOpen(false);
      setSelectedRoom(null);
      setNewRoomAssignment({
        building_name: "",
        floor: "",
        room_number: "",
        room_type: "2인실",
        team: "",
        name: "",
        university: "",
        major: "",
        phone: "",
      });
      fetchRoomAssignments();
    } catch (error: any) {
      console.error("Error updating room assignment:", error);
      toast.error("방배정 수정에 실패했습니다: " + error.message);
    }
  };

  const handleDeleteRoomAssignment = async (id: string) => {
    if (!isAdmin) {
      toast.error("관리자 권한이 필요합니다.");
      return;
    }

    if (!confirm("정말 이 방배정을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const { error } = await supabaseTable("room_assignments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("방배정이 삭제되었습니다.");
      fetchRoomAssignments();
    } catch (error: any) {
      console.error("Error deleting room assignment:", error);
      toast.error("방배정 삭제에 실패했습니다: " + error.message);
    }
  };

  const handleEditRoomAssignment = (assignment: RoomAssignment) => {
    setSelectedRoom(assignment);
    setNewRoomAssignment({
      building_name: assignment.building_name || "",
      floor: assignment.floor || "",
      room_number: assignment.room_number || "",
      room_type: assignment.room_type || "2인실",
      team: assignment.team || "",
      name: assignment.name,
      university: assignment.university || "",
      major: assignment.major || "",
      phone: assignment.phone || "",
    });
    setRoomDialogOpen(true);
  };

  const handleNewRoomAssignment = () => {
    setSelectedRoom(null);
    setNewRoomAssignment({
      building_name: "",
      floor: "",
      room_number: "",
      room_type: "2인실",
      team: "",
      name: "",
      university: "",
      major: "",
      phone: "",
    });
    setRoomDialogOpen(true);
  };

  const handleAddBus = async () => {
    if (!isAdmin) {
      toast.error("관리자 권한이 필요합니다.");
      return;
    }

    try {
      const { error } = await supabase
        .from("buses")
        .insert([newBus]);

      if (error) throw error;

      toast.success("버스가 추가되었습니다.");
      setBusDialogOpen(false);
      setNewBus({
        bus_number: "",
        bus_type: "출발",
        departure: "서울역",
        departure_time: "13:00",
        meeting_point: "",
        capacity: 45,
      });
      fetchBuses();
    } catch (error: any) {
      console.error("Error adding bus:", error);
      toast.error("버스 추가에 실패했습니다: " + error.message);
    }
  };

  const handleDeleteBus = async (busId: string) => {
    if (!isAdmin) {
      toast.error("관리자 권한이 필요합니다.");
      return;
    }

    try {
      const { error } = await supabase
        .from("buses")
        .delete()
        .eq("id", busId);

      if (error) throw error;

      toast.success("버스가 삭제되었습니다.");
      fetchBuses();
    } catch (error: any) {
      console.error("Error deleting bus:", error);
      toast.error("버스 삭제에 실패했습니다: " + error.message);
    }
  };

  const handleAddPassenger = async () => {
    if (!isAdmin) {
      toast.error("관리자 권한이 필요합니다.");
      return;
    }

    try {
      const { error } = await supabase
        .from("bus_passengers")
        .insert([{
          ...newPassenger,
          university: newPassenger.university || null,
        }]);

      if (error) throw error;

      toast.success("승객이 추가되었습니다.");
      setPassengerDialogOpen(false);
      setNewPassenger({ name: "", university: "", is_mentor: false, bus_id: "" });
      fetchBuses();
    } catch (error: any) {
      console.error("Error adding passenger:", error);
      toast.error("승객 추가에 실패했습니다: " + error.message);
    }
  };

  const handleDeletePassenger = async (passengerId: string) => {
    if (!isAdmin) {
      toast.error("관리자 권한이 필요합니다.");
      return;
    }

    try {
      const { error } = await supabase
        .from("bus_passengers")
        .delete()
        .eq("id", passengerId);

      if (error) throw error;

      toast.success("승객이 삭제되었습니다.");
      fetchBuses();
    } catch (error: any) {
      console.error("Error deleting passenger:", error);
      toast.error("승객 삭제에 실패했습니다: " + error.message);
    }
  };

  // 탑승 여부 토글 (관리자)
  const handleToggleBoarded = async (passenger: BusPassenger): Promise<void> => {
    if (!isAdmin) {
      toast.error("관리자 권한이 필요합니다.");
      return;
    }

    try {
      setBoardingUpdateIds((prev) => ({ ...prev, [passenger.id]: true }));
      const nextBoarded = !passenger.boarded;

      const { error } = await supabase
        .from("bus_passengers")
        .update({ boarded: nextBoarded })
        .eq("id", passenger.id);

      if (error) throw error;

      toast.success(nextBoarded ? "탑승 처리되었습니다." : "미탑승으로 변경되었습니다.");
      fetchBuses();
    } catch (error) {
      console.error("Error updating boarded status:", error);
      toast.error("탑승 여부 변경에 실패했습니다.");
    } finally {
      setBoardingUpdateIds((prev) => ({ ...prev, [passenger.id]: false }));
    }
  };

  // 버스 단위 탑승 상태 일괄 변경
  const handleBulkBoardedUpdate = async (busId: string, boarded: boolean): Promise<void> => {
    if (!isAdmin) {
      toast.error("관리자 권한이 필요합니다.");
      return;
    }

    try {
      const { error } = await supabase
        .from("bus_passengers")
        .update({ boarded })
        .eq("bus_id", busId);

      if (error) throw error;

      toast.success(boarded ? "전체 탑승 처리되었습니다." : "전체 미탑승 처리되었습니다.");
      fetchBuses();
    } catch (error) {
      console.error("Error bulk updating boarded status:", error);
      toast.error("일괄 변경에 실패했습니다.");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };


  const getBusPassengers = (busId: string) => {
    return busPassengers.filter(p => p.bus_id === busId);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                관리자 대시보드
              </h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Badge variant="default" className="bg-primary">관리자</Badge>
            )}
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!isAdmin && (
          <Card className="mb-6 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="pt-6">
              <p className="text-amber-700 dark:text-amber-300">
                ⚠️ 관리자 권한이 없습니다. 데이터 조회만 가능하며, 수정/삭제는 불가능합니다.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Building2 className="w-8 h-8 mx-auto mb-2 text-primary" />
              <div className="text-3xl font-bold">{roomAssignments.length}</div>
              <p className="text-sm text-muted-foreground">방배정 인원</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <div className="text-3xl font-bold">{roomAssignments.length}</div>
              <p className="text-sm text-muted-foreground">숙소 배정 인원</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Bus className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <div className="text-3xl font-bold">{busPassengers.length}</div>
              <p className="text-sm text-muted-foreground">버스 배정 인원</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Megaphone className="w-8 h-8 mx-auto mb-2 text-amber-500" />
              <div className="text-3xl font-bold">{announcements.length}</div>
              <p className="text-sm text-muted-foreground">공지사항</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <HelpCircle className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <div className="text-3xl font-bold">{faqs.length}</div>
              <p className="text-sm text-muted-foreground">FAQ</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="rooms" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="rooms" className="flex items-center gap-2">
              <BedDouble className="w-4 h-4" />
              숙소 배정
            </TabsTrigger>
            <TabsTrigger value="participants" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              참가자 관리
            </TabsTrigger>
            <TabsTrigger value="buses" className="flex items-center gap-2">
              <Bus className="w-4 h-4" />
              버스 배정
            </TabsTrigger>
            <TabsTrigger value="schedules" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              일정표
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              공지사항
            </TabsTrigger>
            <TabsTrigger value="faqs" className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              FAQ
            </TabsTrigger>
          </TabsList>

          {/* Rooms Tab */}
          <TabsContent value="rooms">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>방배정 관리</CardTitle>
                    <CardDescription>방배정 정보를 관리합니다</CardDescription>
                  </div>
                  {isAdmin && (
                    <Button onClick={handleNewRoomAssignment}>
                      <Plus className="w-4 h-4 mr-2" />
                      방배정 추가
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingRooms ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : roomAssignments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    등록된 방배정이 없습니다. {isAdmin && "방배정을 추가해주세요."}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>건물명</TableHead>
                          <TableHead>층</TableHead>
                          <TableHead>호실</TableHead>
                          <TableHead>구분</TableHead>
                          <TableHead>조</TableHead>
                          <TableHead>성명</TableHead>
                          <TableHead>학교</TableHead>
                          <TableHead>전공</TableHead>
                          <TableHead>연락처</TableHead>
                          {isAdmin && <TableHead className="text-right">작업</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {roomAssignments.map((assignment) => (
                          <TableRow key={assignment.id}>
                            <TableCell>{assignment.building_name || "-"}</TableCell>
                            <TableCell>{assignment.floor || "-"}</TableCell>
                            <TableCell>{assignment.room_number || "-"}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{assignment.room_type || "-"}</Badge>
                            </TableCell>
                            <TableCell>{assignment.team || "-"}</TableCell>
                            <TableCell className="font-medium">{assignment.name}</TableCell>
                            <TableCell>{assignment.university || "-"}</TableCell>
                            <TableCell>{assignment.major || "-"}</TableCell>
                            <TableCell>{assignment.phone || "-"}</TableCell>
                            {isAdmin && (
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditRoomAssignment(assignment)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteRoomAssignment(assignment.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 웹사이트 숙소 배정 (rooms + room_members) - Supabase 동일 데이터 */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  웹사이트 숙소 배정 (rooms · room_members)
                </CardTitle>
                <CardDescription>
                  웹사이트 「숙소배정」 메뉴에 표시되는 데이터입니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={selectedRoomGroup}
                  onValueChange={setSelectedRoomGroup}
                  className="w-full mb-4"
                >
                  <TabsList className="grid w-full grid-cols-4 md:grid-cols-6">
                    <TabsTrigger value="all">전체</TabsTrigger>
                    {sortedRoomGroupKeys.map((key) => (
                      <TabsTrigger key={key} value={key}>
                        {key}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                {isLoadingRoomsWithMembers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : roomsWithMembers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    등록된 객실이 없습니다.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>건물명</TableHead>
                          <TableHead>호실</TableHead>
                          <TableHead>층</TableHead>
                          <TableHead>구분</TableHead>
                          <TableHead>성별</TableHead>
                          <TableHead>정원</TableHead>
                          <TableHead>입실자</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {roomsWithMembers
                          .filter((room) => {
                            if (selectedRoomGroup === "all") return true;
                            const groupKey = `${room.building_name || "미정"} · ${room.floor || "미정"}`;
                            return groupKey === selectedRoomGroup;
                          })
                          .map((room) => (
                            <TableRow key={room.id}>
                              <TableCell>{room.building_name || "-"}</TableCell>
                              <TableCell className="font-medium">{room.room_number}</TableCell>
                              <TableCell>{room.floor}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{room.room_type}</Badge>
                              </TableCell>
                              <TableCell>{room.gender}</TableCell>
                              <TableCell>{room.capacity}</TableCell>
                              <TableCell>
                                {(room.room_members || []).map((m) => (
                                  <div key={m.id} className="text-sm">
                                    {m.name}
                                    {m.university && ` · ${m.university}`}
                                    {m.phone && ` · ${m.phone}`}
                                  </div>
                                ))}
                                {(room.room_members?.length ?? 0) === 0 && (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Room Assignment Dialog */}
            <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {selectedRoom ? "방배정 수정" : "새 방배정 추가"}
                  </DialogTitle>
                  <DialogDescription>
                    방배정 정보를 입력하세요
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="building_name">건물명</Label>
                    <Input
                      id="building_name"
                      placeholder="예: 본관, 신관"
                      value={newRoomAssignment.building_name}
                      onChange={(e) => setNewRoomAssignment({ ...newRoomAssignment, building_name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="floor">층</Label>
                    <Input
                      id="floor"
                      placeholder="예: 1층, 2층"
                      value={newRoomAssignment.floor}
                      onChange={(e) => setNewRoomAssignment({ ...newRoomAssignment, floor: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="room_number">호실</Label>
                    <Input
                      id="room_number"
                      placeholder="예: 101, 201"
                      value={newRoomAssignment.room_number}
                      onChange={(e) => setNewRoomAssignment({ ...newRoomAssignment, room_number: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>구분</Label>
                    <Select
                      value={newRoomAssignment.room_type}
                      onValueChange={(value) => setNewRoomAssignment({ ...newRoomAssignment, room_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2인실">2인실</SelectItem>
                        <SelectItem value="3인실">3인실</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="team">조</Label>
                    <Input
                      id="team"
                      placeholder="예: 1조, 2조"
                      value={newRoomAssignment.team}
                      onChange={(e) => setNewRoomAssignment({ ...newRoomAssignment, team: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="name">성명 <span className="text-destructive">*</span></Label>
                    <Input
                      id="name"
                      placeholder="홍길동"
                      value={newRoomAssignment.name}
                      onChange={(e) => setNewRoomAssignment({ ...newRoomAssignment, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="university">학교</Label>
                    <Input
                      id="university"
                      placeholder="예: 서울대학교"
                      value={newRoomAssignment.university}
                      onChange={(e) => setNewRoomAssignment({ ...newRoomAssignment, university: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="major">전공</Label>
                    <Input
                      id="major"
                      placeholder="예: 컴퓨터공학과"
                      value={newRoomAssignment.major}
                      onChange={(e) => setNewRoomAssignment({ ...newRoomAssignment, major: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">연락처</Label>
                    <Input
                      id="phone"
                      placeholder="010-1234-5678"
                      value={newRoomAssignment.phone}
                      onChange={(e) => setNewRoomAssignment({ ...newRoomAssignment, phone: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRoomDialogOpen(false);
                      setSelectedRoom(null);
                      setNewRoomAssignment({
                        building_name: "",
                        floor: "",
                        room_number: "",
                        room_type: "2인실",
                        team: "",
                        name: "",
                        university: "",
                        major: "",
                        phone: "",
                      });
                    }}
                  >
                    취소
                  </Button>
                  <Button
                    onClick={selectedRoom ? handleUpdateRoomAssignment : handleAddRoomAssignment}
                  >
                    {selectedRoom ? "수정" : "추가"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Participants Tab */}
          <TabsContent value="participants">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>참가자 관리</CardTitle>
                    <CardDescription>이름과 연락처를 등록합니다</CardDescription>
                  </div>
                  {isAdmin && (
                    <Dialog open={participantDialogOpen} onOpenChange={setParticipantDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          참가자 추가
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>새 참가자 추가</DialogTitle>
                          <DialogDescription>이름과 연락처를 입력하세요</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="participant_name">이름</Label>
                            <Input
                              id="participant_name"
                              placeholder="홍길동"
                              value={newParticipant.name}
                              onChange={(e) =>
                                setNewParticipant({ ...newParticipant, name: e.target.value })
                              }
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="participant_phone">연락처</Label>
                            <Input
                              id="participant_phone"
                              placeholder="010-1234-5678"
                              value={newParticipant.phone}
                              onChange={(e) =>
                                setNewParticipant({ ...newParticipant, phone: e.target.value })
                              }
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleAddParticipant}>등록</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* 참가자 검색 */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="이름 또는 연락처로 검색..."
                    value={participantSearchQuery}
                    onChange={(e) => setParticipantSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {isLoadingParticipants ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : participants.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    등록된 참가자가 없습니다. {isAdmin && "참가자를 추가해주세요."}
                  </div>
                ) : filteredParticipants.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    검색 결과가 없습니다.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>이름</TableHead>
                          <TableHead>연락처</TableHead>
                          <TableHead>기수</TableHead>
                          <TableHead>학교</TableHead>
                          <TableHead>전공</TableHead>
                          <TableHead>재학여부</TableHead>
                          {isAdmin && <TableHead className="text-right">작업</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredParticipants.map((participant) => (
                          <TableRow key={participant.id}>
                            <TableCell className="font-medium">{participant.name}</TableCell>
                            <TableCell>{formatPhoneForDisplay(participant.phone)}</TableCell>
                            <TableCell>{participant.cohort || "-"}</TableCell>
                            <TableCell>{participant.university || "-"}</TableCell>
                            <TableCell>{participant.major || "-"}</TableCell>
                            <TableCell>{participant.enrollment_status || "-"}</TableCell>
                            {isAdmin && (
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewParticipantProfile(participant.id)}
                                  >
                                    자기소개 보기
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditParticipant(participant)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteParticipant(participant.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 참가자 수정 다이얼로그 */}
            <Dialog open={participantEditDialogOpen} onOpenChange={setParticipantEditDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>참가자 수정</DialogTitle>
                  <DialogDescription>이름과 연락처를 수정하세요</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="participant_edit_name">이름</Label>
                    <Input
                      id="participant_edit_name"
                      placeholder="홍길동"
                      value={editParticipant.name}
                      onChange={(e) =>
                        setEditParticipant({ ...editParticipant, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="participant_edit_phone">연락처</Label>
                    <Input
                      id="participant_edit_phone"
                      placeholder="010-1234-5678"
                      value={editParticipant.phone}
                      onChange={(e) =>
                        setEditParticipant({ ...editParticipant, phone: e.target.value })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleUpdateParticipant}>저장</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* 참가자 자기소개 보기 */}
            <Dialog open={participantProfileDialogOpen} onOpenChange={setParticipantProfileDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>자기소개</DialogTitle>
                  <DialogDescription>참가자 자기소개 정보를 확인하세요</DialogDescription>
                </DialogHeader>
                {participantProfileDetail ? (
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground">이름:</span>{" "}
                      {participantProfileDetail.name}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">학교/전공:</span>{" "}
                      {[participantProfileDetail.university, participantProfileDetail.major]
                        .filter(Boolean)
                        .join(" · ") || "-"}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">MBTI:</span>{" "}
                      {participantProfileDetail.mbti || "-"}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">키워드:</span>{" "}
                      {(participantProfileDetail.keywords || []).filter(Boolean).join(", ") || "-"}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">특기:</span>{" "}
                      {participantProfileDetail.specialty || "-"}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">2026 목표:</span>{" "}
                      {participantProfileDetail.goals_2026 || "-"}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">재단 활동:</span>{" "}
                      {participantProfileDetail.foundation_activities || "-"}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    등록된 자기소개가 없습니다.
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Buses Tab */}
          <TabsContent value="buses">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>버스 배정 관리</CardTitle>
                    <CardDescription>버스와 탑승객을 관리합니다</CardDescription>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Dialog open={busDialogOpen} onOpenChange={setBusDialogOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            버스 추가
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>새 버스 추가</DialogTitle>
                            <DialogDescription>새로운 버스 정보를 입력하세요</DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label>구분</Label>
                              <Select
                                value={newBus.bus_type}
                                onValueChange={(value) =>
                                  setNewBus({ ...newBus, bus_type: getSafeBusType(value) })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {BUS_TYPE_OPTIONS.map((busType) => (
                                    <SelectItem key={busType} value={busType}>
                                      {busType}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="bus_number">버스 번호</Label>
                              <Input
                                id="bus_number"
                                placeholder="1호차"
                                value={newBus.bus_number}
                                onChange={(e) => setNewBus({ ...newBus, bus_number: e.target.value })}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>출발지</Label>
                              <Select
                                value={newBus.departure}
                                onValueChange={(value) => setNewBus({ ...newBus, departure: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="서울역">서울역</SelectItem>
                                  <SelectItem value="강남역">강남역</SelectItem>
                                  <SelectItem value="수원역">수원역</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="departure_time">출발 시간</Label>
                              <Input
                                id="departure_time"
                                placeholder="13:00"
                                value={newBus.departure_time}
                                onChange={(e) => setNewBus({ ...newBus, departure_time: e.target.value })}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="meeting_point">집합 장소</Label>
                              <Input
                                id="meeting_point"
                                placeholder="1번 출구 앞"
                                value={newBus.meeting_point}
                                onChange={(e) => setNewBus({ ...newBus, meeting_point: e.target.value })}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="bus_capacity">정원</Label>
                              <Input
                                id="bus_capacity"
                                type="number"
                                value={newBus.capacity}
                                onChange={(e) => setNewBus({ ...newBus, capacity: parseInt(e.target.value) || 45 })}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleAddBus}>추가</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={passengerDialogOpen} onOpenChange={setPassengerDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <UserPlus className="w-4 h-4 mr-2" />
                            승객 추가
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>승객 추가</DialogTitle>
                            <DialogDescription>버스에 배정할 승객 정보를 입력하세요</DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label>버스 선택</Label>
                              <Select
                                value={newPassenger.bus_id}
                                onValueChange={(value) => setNewPassenger({ ...newPassenger, bus_id: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="버스를 선택하세요" />
                                </SelectTrigger>
                                <SelectContent>
                                  {buses.map((bus) => (
                                    <SelectItem key={bus.id} value={bus.id}>
                                      {bus.bus_number} ({getSafeBusType(bus.bus_type)} · {bus.departure})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="passenger_name">이름</Label>
                              <Input
                                id="passenger_name"
                                placeholder="홍길동"
                                value={newPassenger.name}
                                onChange={(e) => setNewPassenger({ ...newPassenger, name: e.target.value })}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="passenger_university">소속/학교</Label>
                              <Input
                                id="passenger_university"
                                placeholder="서울대학교"
                                value={newPassenger.university}
                                onChange={(e) => setNewPassenger({ ...newPassenger, university: e.target.value })}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="is_mentor"
                                checked={newPassenger.is_mentor}
                                onChange={(e) => setNewPassenger({ ...newPassenger, is_mentor: e.target.checked })}
                              />
                              <Label htmlFor="is_mentor">멘토</Label>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleAddPassenger}>추가</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={selectedBusType}
                  onValueChange={(value) => setSelectedBusType(getSafeBusType(value))}
                  className="w-full mb-6"
                >
                  <TabsList className="grid w-full grid-cols-3">
                    {BUS_TYPE_OPTIONS.map((busType) => (
                      <TabsTrigger key={busType} value={busType}>
                        {busType}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                {isLoadingBuses ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : buses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    등록된 버스가 없습니다. {isAdmin && "버스를 추가해주세요."}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {buses
                      .filter((bus) => getSafeBusType(bus.bus_type) === selectedBusType)
                      .map((bus) => {
                        const passengers = sortPassengersByName(getBusPassengers(bus.id));
                        const boardedCount = passengers.filter((p) => p.boarded).length;

                        return (
                          <Card key={bus.id} className="overflow-hidden">
                            <div className={`px-4 py-3 flex items-center justify-between ${
                              bus.departure === "서울역" ? "bg-blue-500/10 border-b border-blue-500/20" :
                              bus.departure === "강남역" ? "bg-green-500/10 border-b border-green-500/20" :
                              "bg-purple-500/10 border-b border-purple-500/20"
                            }`}>
                              <div className="flex items-center gap-3">
                                <Badge variant="secondary">{bus.bus_number}</Badge>
                                {isIndividualMoveBus(bus) && (
                                  <Badge variant="outline">개별이동</Badge>
                                )}
                                <span className="text-sm text-muted-foreground">
                                  {bus.departure} · {bus.departure_time} {getSafeBusType(bus.bus_type) === "귀가" ? "귀가" : "출발"}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm">
                                  탑승 {boardedCount}명 · 전체 {passengers.length}명
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  / 정원 {bus.capacity}명
                                </span>
                                {isAdmin && (
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleBulkBoardedUpdate(bus.id, true)}
                                    >
                                      전체 탑승
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleBulkBoardedUpdate(bus.id, false)}
                                    >
                                      전체 미탑승
                                    </Button>
                                  </div>
                                )}
                                {isAdmin && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteBus(bus.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <CardContent className="pt-4">
                              <p className="text-sm text-muted-foreground mb-3">
                                📍 집합 장소: {bus.meeting_point}
                              </p>
                              {passengers.length === 0 ? (
                                <p className="text-sm text-muted-foreground">배정된 승객이 없습니다</p>
                              ) : (
                                <div className="space-y-2">
                                  {passengers.map((passenger) => (
                                    <div key={passenger.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{passenger.name}</span>
                                        {passenger.university && (
                                          <span className="text-sm text-muted-foreground">({passenger.university})</span>
                                        )}
                                        {passenger.is_mentor && (
                                          <Badge variant="outline" className="text-amber-600 border-amber-600">멘토</Badge>
                                        )}
                                        <Badge variant={passenger.boarded ? "default" : "secondary"}>
                                          {passenger.boarded ? "탑승" : "미탑승"}
                                        </Badge>
                                      </div>
                                      {isAdmin && (
                                        <div className="flex items-center gap-2">
                                          <Button
                                            variant={passenger.boarded ? "outline" : "default"}
                                            size="sm"
                                            onClick={() => handleToggleBoarded(passenger)}
                                            disabled={boardingUpdateIds[passenger.id]}
                                          >
                                            {passenger.boarded ? "미탑승" : "탑승"}
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() => handleDeletePassenger(passenger.id)}
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="schedules">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>일정표 관리</CardTitle>
                    <CardDescription>행사 일정을 추가, 수정, 삭제할 수 있습니다</CardDescription>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      {scheduleDateKeys.length > 0 && (
                        <Select
                          value={selectedDate}
                          onValueChange={setSelectedDate}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="날짜 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {scheduleDateKeys.map((d) => (
                              <SelectItem key={d} value={d}>
                                {formatScheduleDateLabel(d)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Button onClick={handleNewSchedule}>
                        <Plus className="w-4 h-4 mr-2" />
                        일정 추가
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingSchedules ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : scheduleDateKeys.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    등록된 일정이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {scheduleDateKeys.map((dateKey) => {
                      const daySchedules = schedules
                        .filter(s => s.scheduled_date === dateKey)
                        .sort((a, b) => a.display_order - b.display_order);

                      return (
                        <Card key={dateKey}>
                          <CardHeader>
                            <CardTitle className="text-lg">
                              {formatScheduleDateLabel(dateKey)}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {daySchedules.length === 0 ? (
                              <div className="text-center py-4 text-muted-foreground text-sm">
                                등록된 일정이 없습니다.
                              </div>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-20">순서</TableHead>
                                    <TableHead className="w-24">시간</TableHead>
                                    <TableHead>제목</TableHead>
                                    <TableHead>장소</TableHead>
                                    <TableHead className="w-24">유형</TableHead>
                                    <TableHead className="w-20">아이콘</TableHead>
                                    {isAdmin && <TableHead className="w-32">작업</TableHead>}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {daySchedules.map((schedule) => (
                                    <TableRow key={schedule.id}>
                                      <TableCell>{schedule.display_order + 1}</TableCell>
                                      <TableCell className="font-medium">{schedule.time}</TableCell>
                                      <TableCell>{schedule.title}</TableCell>
                                      <TableCell className="text-muted-foreground">{schedule.location}</TableCell>
                                      <TableCell>
                                        <Badge variant="secondary">{schedule.type}</Badge>
                                      </TableCell>
                                      <TableCell className="text-sm text-muted-foreground">{schedule.icon_name}</TableCell>
                                      {isAdmin && (
                                        <TableCell>
                                          <div className="flex gap-2">
                                            <Button
                                              variant="outline"
                                              size="icon"
                                              onClick={() => handleEditSchedule(schedule)}
                                            >
                                              <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="icon"
                                              onClick={() => handleDeleteSchedule(schedule.id)}
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        </TableCell>
                                      )}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 일정 추가/수정 다이얼로그 */}
            <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {selectedSchedule ? "일정 수정" : "새 일정 추가"}
                  </DialogTitle>
                  <DialogDescription>
                    일정 정보를 입력하세요
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="schedule_date">날짜</Label>
                    <Input
                      id="schedule_date"
                      type="date"
                      value={newSchedule.scheduled_date}
                      onChange={(e) => setNewSchedule({ ...newSchedule, scheduled_date: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="schedule_time">시간</Label>
                      <Input
                        id="schedule_time"
                        placeholder="13:00"
                        value={newSchedule.time}
                        onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="schedule_display_order">표시 순서</Label>
                      <Input
                        id="schedule_display_order"
                        type="number"
                        value={newSchedule.display_order}
                        onChange={(e) => setNewSchedule({ ...newSchedule, display_order: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="schedule_title">제목</Label>
                    <Input
                      id="schedule_title"
                      placeholder="오리엔테이션"
                      value={newSchedule.title}
                      onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="schedule_location">장소</Label>
                    <Input
                      id="schedule_location"
                      placeholder="대강당"
                      value={newSchedule.location}
                      onChange={(e) => setNewSchedule({ ...newSchedule, location: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>유형</Label>
                      <Select
                        value={newSchedule.type}
                        onValueChange={(value) => setNewSchedule({ ...newSchedule, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="main">주요 일정</SelectItem>
                          <SelectItem value="activity">활동</SelectItem>
                          <SelectItem value="meal">식사</SelectItem>
                          <SelectItem value="break">휴식</SelectItem>
                          <SelectItem value="info">안내</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>아이콘</Label>
                      <Select
                        value={newSchedule.icon_name}
                        onValueChange={(value) => setNewSchedule({ ...newSchedule, icon_name: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MapPin">MapPin</SelectItem>
                          <SelectItem value="Users">Users</SelectItem>
                          <SelectItem value="Coffee">Coffee</SelectItem>
                          <SelectItem value="Utensils">Utensils</SelectItem>
                          <SelectItem value="Music">Music</SelectItem>
                          <SelectItem value="Presentation">Presentation</SelectItem>
                          <SelectItem value="MessageSquare">MessageSquare</SelectItem>
                          <SelectItem value="Moon">Moon</SelectItem>
                          <SelectItem value="Clock">Clock</SelectItem>
                          <SelectItem value="Bus">Bus</SelectItem>
                          <SelectItem value="Route">Route (투어)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
                    취소
                  </Button>
                  <Button onClick={selectedSchedule ? handleUpdateSchedule : handleAddSchedule}>
                    {selectedSchedule ? "수정" : "추가"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="announcements">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>공지사항 관리</CardTitle>
                    <CardDescription>공지사항을 작성, 수정, 삭제할 수 있습니다</CardDescription>
                  </div>
                  {isAdmin && (
                    <Button onClick={handleNewAnnouncement}>
                      <Plus className="w-4 h-4 mr-2" />
                      공지사항 작성
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingAnnouncements ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : announcements.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    등록된 공지사항이 없습니다. {isAdmin && "공지사항을 작성해주세요."}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {announcements.map((announcement) => (
                      <Card key={announcement.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <CardTitle className="mb-2">{announcement.title}</CardTitle>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>작성자: {announcement.author}</span>
                                <span>
                                  작성일: {new Date(announcement.created_at).toLocaleDateString("ko-KR")}
                                </span>
                              </div>
                            </div>
                            {isAdmin && (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleEditAnnouncement(announcement)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteAnnouncement(announcement.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground whitespace-pre-wrap">
                            {announcement.content}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQs Tab */}
          <TabsContent value="faqs">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>FAQ 관리</CardTitle>
                    <CardDescription>자주 묻는 질문을 추가, 수정, 삭제할 수 있습니다</CardDescription>
                  </div>
                  {isAdmin && (
                    <Button onClick={handleNewFAQ}>
                      <Plus className="w-4 h-4 mr-2" />
                      FAQ 추가
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingFAQs ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : faqs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    등록된 FAQ가 없습니다. {isAdmin && "FAQ를 추가해주세요."}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {["행사 기본정보", "교통 안내", "숙소 안내", "식사 및 기타", "참가 및 등록", "기타 문의"].map((category) => {
                      const categoryFAQs = faqs
                        .filter(f => f.category === category)
                        .sort((a, b) => a.display_order - b.display_order);

                      if (categoryFAQs.length === 0) return null;

                      return (
                        <Card key={category}>
                          <CardHeader>
                            <CardTitle className="text-lg">{category}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-20">순서</TableHead>
                                  <TableHead>질문</TableHead>
                                  <TableHead>답변</TableHead>
                                  <TableHead className="w-24">아이콘</TableHead>
                                  {isAdmin && <TableHead className="w-32">작업</TableHead>}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {categoryFAQs.map((faq) => (
                                  <TableRow key={faq.id}>
                                    <TableCell>{faq.display_order + 1}</TableCell>
                                    <TableCell className="font-medium">{faq.question}</TableCell>
                                    <TableCell className="text-muted-foreground line-clamp-2">{faq.answer}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{faq.icon_name}</TableCell>
                                    {isAdmin && (
                                      <TableCell>
                                        <div className="flex gap-2">
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleEditFAQ(faq)}
                                          >
                                            <Edit className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleDeleteFAQ(faq.id)}
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    )}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* FAQ 추가/수정 다이얼로그 */}
            <Dialog open={faqDialogOpen} onOpenChange={setFaqDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {selectedFAQ ? "FAQ 수정" : "새 FAQ 추가"}
                  </DialogTitle>
                  <DialogDescription>
                    FAQ 정보를 입력하세요
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>카테고리</Label>
                    <Select
                      value={newFAQ.category}
                      onValueChange={(value) => setNewFAQ({ ...newFAQ, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="행사 기본정보">행사 기본정보</SelectItem>
                        <SelectItem value="교통 안내">교통 안내</SelectItem>
                        <SelectItem value="숙소 안내">숙소 안내</SelectItem>
                        <SelectItem value="식사 및 기타">식사 및 기타</SelectItem>
                        <SelectItem value="참가 및 등록">참가 및 등록</SelectItem>
                        <SelectItem value="기타 문의">기타 문의</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="faq_question">질문</Label>
                    <Input
                      id="faq_question"
                      placeholder="질문을 입력하세요"
                      value={newFAQ.question}
                      onChange={(e) => setNewFAQ({ ...newFAQ, question: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="faq_answer">답변</Label>
                    <Textarea
                      id="faq_answer"
                      className="min-h-[150px]"
                      placeholder="답변을 입력하세요"
                      value={newFAQ.answer}
                      onChange={(e) => setNewFAQ({ ...newFAQ, answer: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>아이콘</Label>
                      <Select
                        value={newFAQ.icon_name}
                        onValueChange={(value) => setNewFAQ({ ...newFAQ, icon_name: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MapPin">MapPin</SelectItem>
                          <SelectItem value="Bus">Bus</SelectItem>
                          <SelectItem value="BedDouble">BedDouble</SelectItem>
                          <SelectItem value="Utensils">Utensils</SelectItem>
                          <SelectItem value="FileText">FileText</SelectItem>
                          <SelectItem value="HelpCircle">HelpCircle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="faq_display_order">표시 순서</Label>
                      <Input
                        id="faq_display_order"
                        type="number"
                        value={newFAQ.display_order}
                        onChange={(e) => setNewFAQ({ ...newFAQ, display_order: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setFaqDialogOpen(false)}>
                    취소
                  </Button>
                  <Button onClick={selectedFAQ ? handleUpdateFAQ : handleAddFAQ}>
                    {selectedFAQ ? "수정" : "추가"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>

        {/* Announcement Dialog */}
        <Dialog open={announcementDialogOpen} onOpenChange={setAnnouncementDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedAnnouncement ? "공지사항 수정" : "새 공지사항 작성"}
              </DialogTitle>
              <DialogDescription>
                공지사항 정보를 입력하세요
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="announcement_title">제목</Label>
                <Input
                  id="announcement_title"
                  placeholder="공지사항 제목을 입력하세요"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="announcement_author">작성자</Label>
                <Input
                  id="announcement_author"
                  placeholder="작성자 이름을 입력하세요"
                  value={newAnnouncement.author}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, author: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="announcement_content">내용</Label>
                <Textarea
                  id="announcement_content"
                  className="min-h-[200px]"
                  placeholder="공지사항 내용을 입력하세요"
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAnnouncementDialogOpen(false);
                  setSelectedAnnouncement(null);
                  setNewAnnouncement({ title: "", author: "", content: "" });
                }}
              >
                취소
              </Button>
              <Button
                onClick={selectedAnnouncement ? handleUpdateAnnouncement : handleAddAnnouncement}
              >
                {selectedAnnouncement ? "수정" : "작성"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Admin;
