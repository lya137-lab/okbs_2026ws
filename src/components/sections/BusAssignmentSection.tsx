import { useState, useEffect } from "react";
import { Bus, MapPin, Clock, Users, Search, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

interface BusData {
  id: string;
  busNumber: string;
  busType: string;
  departure: string;
  departureTime: string;
  meetingPoint: string;
  capacity: number;
  passengers: { name: string; university: string | null; is_mentor: boolean | null }[];
}

// 버스 운행 구분 옵션 (출발/행사중/귀가)
const BUS_TYPE_OPTIONS = ["출발", "행사중", "귀가"] as const;

// 버스 운행 구분 타입
type BusType = (typeof BUS_TYPE_OPTIONS)[number];

const departureColors: Record<string, string> = {
  서울역: "bg-red-500",
  강남역: "bg-green-500",
  수원역: "bg-blue-500",
};

const departureBgColors: Record<string, string> = {
  서울역: "bg-red-500/10 border-red-500/20",
  강남역: "bg-green-500/10 border-green-500/20",
  수원역: "bg-blue-500/10 border-blue-500/20",
};

// 잘못된 버스 구분을 기본값으로 보정
const getSafeBusType = (busType?: string | null): BusType => {
  if (BUS_TYPE_OPTIONS.includes(busType as BusType)) {
    return busType as BusType;
  }
  return "출발";
};

// 출발지별 색상 안전 처리
const getDepartureColor = (departure: string): string =>
  departureColors[departure] ?? "bg-slate-500";

// 출발지별 배경색 안전 처리
const getDepartureBgColor = (departure: string): string =>
  departureBgColors[departure] ?? "bg-slate-500/10 border-slate-500/20";

// 개별이동 버스 표시
const isIndividualMoveBus = (busNumber: string, departure: string): boolean => {
  return departure === "개별이동" || busNumber.includes("개별");
};

// 이름을 가나다순으로 정렬
const sortPassengersByName = <T extends { name: string }>(passengers: T[]): T[] => {
  return [...passengers].sort((a, b) => a.name.localeCompare(b.name, "ko"));
};

export const BusAssignmentSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBusType, setSelectedBusType] = useState<BusType>("출발");
  const [busAssignments, setBusAssignments] = useState<BusData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBusData();
  }, []);

  const fetchBusData = async () => {
    try {
      setIsLoading(true);
      // Fetch buses
      const { data: busesData, error: busesError } = await supabase
        .from("buses")
        .select("*")
        .order("bus_number", { ascending: true });

      if (busesError) throw busesError;

      // Fetch passengers
      const { data: passengersData, error: passengersError } = await supabase
        .from("bus_passengers")
        .select("*");

      if (passengersError) throw passengersError;

      // Combine data
      const busesWithPassengers: BusData[] = (busesData || []).map((bus) => ({
        id: bus.id,
        busNumber: bus.bus_number,
        busType: getSafeBusType(bus.bus_type),
        departure: bus.departure,
        departureTime: bus.departure_time,
        meetingPoint: bus.meeting_point,
        capacity: bus.capacity,
        passengers: (passengersData || [])
          .filter((p) => p.bus_id === bus.id)
          .map((p) => ({
            name: p.name,
            university: p.university,
            is_mentor: p.is_mentor,
          })),
      }));

      setBusAssignments(busesWithPassengers);
    } catch (error) {
      console.error("Error fetching bus data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBuses = busAssignments.filter((bus) => {
    const matchesSearch =
      searchQuery === "" ||
      bus.busNumber.includes(searchQuery) ||
      bus.busType.includes(searchQuery) ||
      bus.departure.includes(searchQuery) ||
      bus.passengers.some(
        (p) =>
          p.name.includes(searchQuery) ||
          (p.university && p.university.includes(searchQuery))
      );
    const matchesBusType = bus.busType === selectedBusType;
    return matchesSearch && matchesBusType;
  });

  // 총 탑승자: 귀가 버스 전체 탑승 인원
  const totalPassengers = busAssignments
    .filter((bus) => bus.busType === "귀가")
    .reduce((acc, bus) => acc + bus.passengers.length, 0);

  return (
    <section id="bus" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Bus className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            버스 배정
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            운행 구분별 버스 배정과 탑승 장소를 확인하세요
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-4 pb-4 text-center">
              <Bus className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-primary">3</div>
              <p className="text-xs text-muted-foreground">운행 버스</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-secondary/50 to-secondary/30 border-secondary/20">
            <CardContent className="pt-4 pb-4 text-center">
              <Users className="w-6 h-6 text-foreground mx-auto mb-2" />
              <div className="text-2xl font-bold">{totalPassengers}</div>
              <p className="text-xs text-muted-foreground">총 탑승자</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <MapPin className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <div className="text-2xl font-bold">{BUS_TYPE_OPTIONS.length}</div>
              <p className="text-xs text-muted-foreground">운행 구분</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="이름, 학교, 버스 구분, 출발지로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Bus Type Tabs */}
        <Tabs
          value={selectedBusType}
          onValueChange={(value) => setSelectedBusType(getSafeBusType(value))}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-6">
            {BUS_TYPE_OPTIONS.map((busType) => (
              <TabsTrigger key={busType} value={busType}>
                {busType}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedBusType} className="mt-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredBuses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery ? "검색 결과가 없습니다." : "등록된 버스가 없습니다."}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredBuses.map((bus) => (
                <Card
                  key={bus.busNumber}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Bus Header */}
                  <div
                    className={`px-4 py-4 border-b ${
                      getDepartureBgColor(bus.departure)
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${
                            getDepartureColor(bus.departure)
                          }`}
                        >
                          <Bus className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{bus.busNumber}</h3>
                          <p className="text-sm text-muted-foreground">
                            {bus.departure} {bus.busType === "귀가" ? "귀가" : "출발"}
                          </p>
                        </div>
                      </div>
                      {isIndividualMoveBus(bus.busNumber, bus.departure) && (
                        <Badge variant="outline" className="text-sm">
                          개별이동
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-sm">
                        {bus.passengers.length}명 탑승
                      </Badge>
                    </div>

                    {/* Bus Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 bg-background/50 rounded-lg px-3 py-2">
                        <Bus className="w-4 h-4 text-primary" />
                        <span className="text-muted-foreground">구분:</span>
                        <span className="font-semibold">{bus.busType}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-background/50 rounded-lg px-3 py-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-muted-foreground">출발시간:</span>
                        <span className="font-semibold">
                          {bus.departureTime}
                        </span>
                      </div>
                      <div className="flex items-start gap-2 bg-background/50 rounded-lg px-3 py-2">
                        <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-muted-foreground">
                            탑승장소:
                          </span>
                          <span className="font-semibold ml-1">
                            {bus.meetingPoint}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Passenger List */}
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      탑승자 명단
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {sortPassengersByName(bus.passengers).map((passenger, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                            {passenger.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">
                              {passenger.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {passenger.university || ""}
                            </p>
                          </div>
                          {passenger.is_mentor && (
                            <Badge variant="default" className="text-xs">
                              멘토
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Notice */}
        <div className="mt-6 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <p className="text-sm text-muted-foreground text-center">
            ⚠️ 버스 출발 10분 전까지 탑승장소에 도착해주세요. 지연 시 운영팀에
            연락 바랍니다.
          </p>
        </div>
      </div>
    </section>
  );
};
