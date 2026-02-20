import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Loader2, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useParticipantAuth } from "@/hooks/useParticipantAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import mascotGlasses from "@/assets/mascot-glasses.png";

const MBTI_TYPES = [
  "ISTJ", "ISFJ", "INFJ", "INTJ",
  "ISTP", "ISFP", "INFP", "INTP",
  "ESTP", "ESFP", "ENFP", "ENTP",
  "ESTJ", "ESFJ", "ENFJ", "ENTJ",
];

const ENROLLMENT_STATUSES = ["재학", "휴학", "교환학생", "졸업예정", "기타"];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const SelfIntroduction = () => {
  const navigate = useNavigate();
  const { participantName, isLoggedIn, participantPhone, participantId } = useParticipantAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 기본정보
  const [formData, setFormData] = useState({
    name: participantName || "",
    phone: participantPhone || "",
    cohort: "",
    university: "",
    major: "",
    birthDate: "" as string, // YYYY-MM-DD 형식의 문자열
    location: "",
    mbti: "",
    enrollmentStatus: "",
  });
  
  // 날짜 검증 및 에러 상태
  const [birthDateError, setBirthDateError] = useState<string>("");
  const [isLoadingData, setIsLoadingData] = useState(true);

  // 개인소개
  const [personalData, setPersonalData] = useState({
    keywords: ["", "", ""],
    specialty: "",
    goals2026: "",
    foundationActivities: "",
  });

  // Redirect to login if not logged in
  if (!isLoggedIn) {
    navigate("/login");
    return null;
  }

  // 화면 진입 시 참가자 기본정보 및 자기소개 정보 불러오기
  useEffect(() => {
    const loadUserData = async () => {
      if (!participantId || !participantPhone) {
        setIsLoadingData(false);
        return;
      }

      try {
        // 1. participant_id 기준으로 참가자 정보 조회
        const { data: participantData, error: participantError } = await supabase
          .from("participants")
          .select("id, university, major, cohort, enrollment_status")
          .eq("id", participantId)
          .maybeSingle();

        if (participantError) {
          console.error("Error loading participant data:", participantError);
          setIsLoadingData(false);
          return;
        }

        if (!participantData) {
          setIsLoadingData(false);
          return;
        }

        // 2. 자기소개 정보 불러오기 (우선순위 1)
        const { data: profileData, error: profileError } = await supabase
          .from("participant_profiles")
          .select("university, major, birth_date, location, mbti, keywords, specialty, goals_2026, foundation_activities")
          .eq("participant_id", participantData.id)
          .maybeSingle();

        if (profileError) {
          console.error("Error loading profile data:", profileError);
        }

        // 우선순위에 따라 값 설정
        // 1순위: 자기소개 정보, 2순위: 참가자 기본정보, 3순위: 빈 값
        
        // 자기소개 정보가 있으면 모든 필드 로드
        if (profileData) {
          setFormData({
            name: participantName || "",
            phone: participantPhone || "",
            cohort: participantData.cohort || "",
            university: profileData.university || participantData.university || "",
            major: profileData.major || participantData.major || "",
            birthDate: profileData.birth_date ? profileData.birth_date : "",
            location: profileData.location || "",
            mbti: profileData.mbti || "",
            enrollmentStatus: participantData.enrollment_status || "",
          });

          setPersonalData({
            keywords: profileData.keywords && profileData.keywords.length > 0 
              ? [...profileData.keywords, "", "", ""].slice(0, 3)
              : ["", "", ""],
            specialty: profileData.specialty || "",
            goals2026: profileData.goals_2026 || "",
            foundationActivities: profileData.foundation_activities || "",
          });
        } else {
          // 자기소개 정보가 없으면 참가자 기본정보만 반영
          setFormData(prev => ({
            ...prev,
            cohort: participantData.cohort || "",
            university: participantData.university || "",
            major: participantData.major || "",
            enrollmentStatus: participantData.enrollment_status || "",
          }));
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadUserData();
  }, [participantId, participantPhone, participantName]);

  const handleKeywordChange = (index: number, value: string) => {
    const newKeywords = [...personalData.keywords];
    newKeywords[index] = value;
    setPersonalData({ ...personalData, keywords: newKeywords });
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error("파일 크기는 10MB 이하여야 합니다.");
      return;
    }

    // Check if it's an image
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드 가능합니다.");
      return;
    }

    setPhotoFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 날짜 자동 포맷 (20260123 → 2026-01-23)
  const formatDateInput = (value: string): string => {
    // 숫자만 추출
    const numbers = value.replace(/\D/g, "");
    
    if (numbers.length === 0) return "";
    if (numbers.length <= 4) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
    return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)}`;
  };

  // 날짜 검증 (YYYY-MM-DD 형식 및 실제 존재하는 날짜인지 확인)
  const validateDate = (dateString: string): { isValid: boolean; error: string } => {
    if (!dateString) {
      return { isValid: false, error: "" };
    }

    // YYYY-MM-DD 형식 검증
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      return { isValid: false, error: "날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)" };
    }

    const [year, month, day] = dateString.split("-").map(Number);
    
    // 범위 검증
    if (year < 1980 || year > new Date().getFullYear()) {
      return { isValid: false, error: "연도는 1980년부터 현재까지 입력 가능합니다." };
    }
    if (month < 1 || month > 12) {
      return { isValid: false, error: "월은 1월부터 12월까지 입력 가능합니다." };
    }
    if (day < 1 || day > 31) {
      return { isValid: false, error: "일은 1일부터 31일까지 입력 가능합니다." };
    }

    // 실제 존재하는 날짜인지 확인 (시간은 00:00:00으로 고정)
    const date = new Date(year, month - 1, day, 0, 0, 0, 0);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return { isValid: false, error: "존재하지 않는 날짜입니다." };
    }

    // 미래 날짜 검증
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date > today) {
      return { isValid: false, error: "미래 날짜는 입력할 수 없습니다." };
    }

    return { isValid: true, error: "" };
  };

  // 문자열을 Date 객체로 변환 (시간은 00:00:00으로 고정)
  const stringToDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    const validation = validateDate(dateString);
    if (!validation.isValid) return null;
    
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  };

  // 날짜 입력 핸들러
  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatDateInput(value);
    
    setFormData({ ...formData, birthDate: formatted });
    
    // 실시간 검증
    if (formatted.length === 10) {
      const validation = validateDate(formatted);
      setBirthDateError(validation.error);
    } else {
      setBirthDateError("");
    }
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile) return null;

    const fileExt = photoFile.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage
      .from("profile-photos")
      .upload(fileName, photoFile);

    if (error) {
      console.error("Upload error:", error);
      console.warn("⚠️ 사진 업로드에 실패했습니다.");
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("profile-photos")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.cohort || !formData.university || !formData.major || !formData.birthDate || !formData.location || !formData.mbti || !formData.enrollmentStatus) {
      toast.error("기본정보를 모두 입력해주세요.");
      return;
    }

    // 날짜 검증 (제출 전 최종 검증)
    const dateValidation = validateDate(formData.birthDate);
    if (!dateValidation.isValid) {
      toast.error(dateValidation.error || "날짜를 올바르게 입력해주세요.");
      setBirthDateError(dateValidation.error);
      return;
    }
    
    // 날짜 검증 통과 시 에러 메시지 제거
    setBirthDateError("");

    const filledKeywords = personalData.keywords.filter(k => k.trim() !== "");
    if (filledKeywords.length < 3) {
      toast.error("나를 표현하는 키워드 3개를 모두 입력해주세요.");
      return;
    }

    if (!personalData.specialty || !personalData.goals2026 || !personalData.foundationActivities) {
      toast.error("개인소개를 모두 입력해주세요.");
      return;
    }

    setIsLoading(true);
    
    try {
      // Get participant ID from name and phone
      const { data: participantData, error: participantError } = await supabase
        .from("participants")
        .select("id")
        .eq("id", participantId)
        .maybeSingle();

      if (participantError) throw participantError;
      if (!participantData) {
        toast.error("참가자 정보를 찾을 수 없습니다. 다시 로그인해주세요.");
        navigate("/login");
        return;
      }

      // 참가자 기본정보 업데이트 (관리자 등록 후 추가 입력)
      const { error: participantUpdateError } = await supabase
        .from("participants")
        .update({
          cohort: formData.cohort || null,
          university: formData.university || null,
          major: formData.major || null,
          enrollment_status: formData.enrollmentStatus || null,
        })
        .eq("id", participantData.id);

      if (participantUpdateError) throw participantUpdateError;

      // Upload photo if exists
      let photoUrl = null;
      if (photoFile) {
        photoUrl = await uploadPhoto();
      }

      // Prepare data
      const filledKeywords = personalData.keywords.filter(k => k.trim() !== "");
      
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from("participant_profiles")
        .select("id")
        .eq("participant_id", participantData.id)
        .maybeSingle();

      const profileData = {
        participant_id: participantData.id,
        name: formData.name,
        university: formData.university || null,
        major: formData.major || null,
        birth_date: formData.birthDate || null, // 이미 YYYY-MM-DD 형식의 문자열
        location: formData.location || null,
        mbti: formData.mbti || null,
        keywords: filledKeywords,
        specialty: personalData.specialty || null,
        goals_2026: personalData.goals2026 || null,
        foundation_activities: personalData.foundationActivities || null,
        photo_url: photoUrl,
      };

      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from("participant_profiles")
          .update(profileData)
          .eq("id", existingProfile.id);

        if (updateError) throw updateError;
      } else {
        // Insert new profile
        const { error: insertError } = await supabase
          .from("participant_profiles")
          .insert([profileData]);

        if (insertError) throw insertError;
      }
      
      toast.success("자기소개가 등록되었습니다!");
      navigate("/");
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(error instanceof Error ? error.message : "등록에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with Mascot */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-6 mb-8"
        >
          <img
            src={mascotGlasses}
            alt="OK배정장학재단 캐릭터"
            className="w-24 h-auto drop-shadow-xl"
          />
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              자기소개 등록
            </h1>
            <p className="text-muted-foreground">
              안녕하세요, <span className="font-semibold text-primary">{participantName}</span>님!
            </p>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 프로필 사진 섹션 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card p-6 sm:p-8 rounded-3xl shadow-xl"
          >
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-sm">
                <Camera className="w-4 h-4" />
              </span>
              프로필 사진
            </h2>

            <div className="flex flex-col items-center gap-4">
              {/* Photo Preview */}
              <div className="relative">
                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="프로필 사진 미리보기"
                      className="w-40 h-40 rounded-full object-cover border-4 border-primary/20 shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-destructive/90 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-40 h-40 rounded-full bg-muted border-4 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <Camera className="w-10 h-10 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">사진 추가</span>
                  </div>
                )}
              </div>

              {/* File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />

              {/* Upload Button */}
              {!photoPreview && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  사진 업로드 (최대 10MB)
                </Button>
              )}

              <p className="text-xs text-muted-foreground text-center">
                JPG, PNG 파일만 업로드 가능합니다.
              </p>
            </div>
          </motion.div>

          {/* 기본정보 섹션 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 sm:p-8 rounded-3xl shadow-xl"
          >
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-sm">1</span>
              기본정보
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 이름 */}
              <div className="space-y-2">
                <Label htmlFor="name">이름 *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  disabled
                  className="h-12 rounded-xl bg-muted"
                />
              </div>

              {/* 연락처 */}
              <div className="space-y-2">
                <Label htmlFor="phone">연락처 *</Label>
                <Input
                  id="phone"
                  type="text"
                  value={formData.phone}
                  disabled
                  className="h-12 rounded-xl bg-muted"
                />
              </div>

              {/* 기수 */}
              <div className="space-y-2">
                <Label htmlFor="cohort">기수 *</Label>
                <Input
                  id="cohort"
                  type="text"
                  placeholder="예: 1기, 2기"
                  value={formData.cohort}
                  onChange={(e) => setFormData({ ...formData, cohort: e.target.value })}
                  className="h-12 rounded-xl"
                />
              </div>

              {/* 학교 */}
              <div className="space-y-2">
                <Label htmlFor="university">학교 *</Label>
                <Input
                  id="university"
                  type="text"
                  placeholder="예: 서울대학교"
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  className="h-12 rounded-xl"
                />
              </div>

              {/* 전공 */}
              <div className="space-y-2">
                <Label htmlFor="major">전공 *</Label>
                <Input
                  id="major"
                  type="text"
                  placeholder="예: 컴퓨터공학과"
                  value={formData.major}
                  onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                  className="h-12 rounded-xl"
                />
              </div>

              {/* 생년월일 */}
              <div className="space-y-2">
                <Label>생년월일 *</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="YYYY-MM-DD"
                  value={formData.birthDate}
                  onChange={handleBirthDateChange}
                  maxLength={10}
                  className={cn(
                    "h-12 rounded-xl",
                    birthDateError && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                {birthDateError && (
                  <p className="text-sm text-destructive">{birthDateError}</p>
                )}
              </div>

              {/* 사는 곳 */}
              <div className="space-y-2">
                <Label htmlFor="location">사는 곳 *</Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="예: 서울시 강남구"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="h-12 rounded-xl"
                />
              </div>

              {/* MBTI */}
              <div className="space-y-2">
                <Label>MBTI *</Label>
                <Select
                  value={formData.mbti}
                  onValueChange={(value) => setFormData({ ...formData, mbti: value })}
                >
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="MBTI를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent className="bg-card z-50">
                    {MBTI_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 재학여부 */}
              <div className="space-y-2">
                <Label>26년 1학기 재학여부 *</Label>
                <Select
                  value={formData.enrollmentStatus}
                  onValueChange={(value) => setFormData({ ...formData, enrollmentStatus: value })}
                >
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="재학여부를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent className="bg-card z-50">
                    {ENROLLMENT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          {/* 개인소개 섹션 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 sm:p-8 rounded-3xl shadow-xl"
          >
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-gradient-accent text-accent-foreground flex items-center justify-center text-sm">2</span>
              개인소개
            </h2>
            
            <div className="space-y-4">
              {/* 나를 표현하는 키워드 3개 */}
              <div className="space-y-2">
                <Label>나를 표현하는 키워드 3개 *</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((index) => (
                    <Input
                      key={index}
                      type="text"
                      placeholder={`키워드 ${index + 1}`}
                      value={personalData.keywords[index]}
                      onChange={(e) => handleKeywordChange(index, e.target.value)}
                      className="h-12 rounded-xl text-center"
                      maxLength={20}
                    />
                  ))}
                </div>
              </div>

              {/* 나만의 특기 */}
              <div className="space-y-2">
                <Label htmlFor="specialty">나만의 특기 *</Label>
                <Input
                  id="specialty"
                  type="text"
                  placeholder="예: 기타 연주, 요리, 프로그래밍 등"
                  value={personalData.specialty}
                  onChange={(e) => setPersonalData({ ...personalData, specialty: e.target.value })}
                  className="h-12 rounded-xl"
                />
              </div>

              {/* 2026년 목표 */}
              <div className="space-y-2">
                <Label htmlFor="goals2026">2026년 목표 *</Label>
                <Textarea
                  id="goals2026"
                  placeholder="올해 이루고 싶은 목표를 적어주세요"
                  value={personalData.goals2026}
                  onChange={(e) => setPersonalData({ ...personalData, goals2026: e.target.value })}
                  className="min-h-[100px] rounded-xl resize-none"
                />
              </div>

              {/* 장학재단에서 하고 싶은 활동 */}
              <div className="space-y-2">
                <Label htmlFor="foundationActivities">장학재단에서 하고 싶은 활동 *</Label>
                <Textarea
                  id="foundationActivities"
                  placeholder="장학재단에서 참여하고 싶은 활동이나 기대하는 점을 적어주세요"
                  value={personalData.foundationActivities}
                  onChange={(e) => setPersonalData({ ...personalData, foundationActivities: e.target.value })}
                  className="min-h-[100px] rounded-xl resize-none"
                />
              </div>
            </div>
          </motion.div>

          {/* Submit Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/")}
              className="flex-1 h-12 rounded-xl"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              메인으로 돌아가기
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 h-12 bg-gradient-accent hover:opacity-90 text-accent-foreground rounded-xl font-medium"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  등록하기
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default SelfIntroduction;
