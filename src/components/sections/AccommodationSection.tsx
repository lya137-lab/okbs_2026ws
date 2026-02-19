import { useState, useEffect } from "react";
import { BedDouble, Users, Search, Building2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

/** rooms 테이블 Row + room_members 목록 */
type RoomWithMembers = Tables<"rooms"> & {
  room_members: Tables<"room_members">[];
};

export const AccommodationSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("all");
  const [rooms, setRooms] = useState<RoomWithMembers[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRoomData();
  }, []);

  /**
   * Supabase rooms, room_members 테이블에서 숙소 배정 데이터 조회
   */
  const fetchRoomData = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("rooms")
        .select("*, room_members(*)")
        .order("floor", { ascending: true })
        .order("room_number", { ascending: true });

      if (error) throw error;
      setRooms((data as RoomWithMembers[]) || []);
    } catch (error) {
      console.error("Error fetching room data:", error);
      setRooms([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      searchQuery === "" ||
      (room.building_name && room.building_name.includes(searchQuery)) ||
      room.room_number.includes(searchQuery) ||
      room.floor.includes(searchQuery) ||
      room.room_type.includes(searchQuery) ||
      (room.room_members || []).some(
        (m) =>
          m.name.includes(searchQuery) ||
          (m.university && m.university.includes(searchQuery))
      );
    const matchesFloor =
      selectedFloor === "all" || room.floor === selectedFloor;
    return matchesSearch && matchesFloor;
  });

  const totalMembers = rooms.reduce(
    (acc, room) => acc + (room.room_members?.length ?? 0),
    0
  );

  /** 층 목록: 실제 데이터 기준 동적 생성 */
  const floors = Array.from(
    new Set(rooms.map((r) => r.floor).filter(Boolean))
  ).sort();
  const floorTabs = ["all", ...floors];

  return (
    <section id="accommodation" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <BedDouble className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            숙소 배정
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            방배정 정보를 확인하세요 (Supabase rooms · room_members 연동)
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-4 pb-4 text-center">
              <Building2 className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-primary">
                {rooms.length}
              </div>
              <p className="text-xs text-muted-foreground">총 객실</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-secondary/50 to-secondary/30 border-secondary/20">
            <CardContent className="pt-4 pb-4 text-center">
              <Users className="w-6 h-6 text-foreground mx-auto mb-2" />
              <div className="text-2xl font-bold">{totalMembers}</div>
              <p className="text-xs text-muted-foreground">총 인원</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {rooms.filter((r) => r.room_type === "2인실").length}
              </div>
              <p className="text-xs text-muted-foreground">2인실</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-2xl font-bold text-amber-600">
                {rooms.filter((r) => r.room_type === "3인실").length}
              </div>
              <p className="text-xs text-muted-foreground">3인실</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="이름, 학교, 건물명, 호실, 층으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Floor Tabs - 동적 */}
        <Tabs
          value={selectedFloor}
          onValueChange={setSelectedFloor}
          className="w-full"
        >
          <TabsList
            className={`grid w-full mb-6`}
            style={{
              gridTemplateColumns: `repeat(${Math.min(floorTabs.length, 5)}, minmax(0, 1fr))`,
            }}
          >
            <TabsTrigger value="all">전체</TabsTrigger>
            {floors.slice(0, 4).map((f) => (
              <TabsTrigger key={f} value={f}>
                {f}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedFloor} className="mt-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery
                  ? "검색 결과가 없습니다."
                  : "등록된 방배정이 없습니다. Supabase rooms, room_members 테이블에 데이터를 추가해주세요."}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredRooms.map((room) => (
                  <Card
                    key={room.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="px-4 py-3 flex items-center justify-between bg-primary/10 border-b border-primary/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white bg-primary">
                          {room.room_number.replace("호", "") || "-"}
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            {room.room_number || "미배정"}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {room.building_name ? `${room.building_name} · ` : ""}
                            {room.floor} · {room.room_type} · {room.gender}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {room.room_type}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        {(room.room_members || []).map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between py-2 border-b last:border-0"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                                {member.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">
                                  {member.name}
                                </p>
                                <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                                  {member.university && (
                                    <span>{member.university}</span>
                                  )}
                                  {member.role && (
                                    <span>· {member.role}</span>
                                  )}
                                  {member.phone && (
                                    <span>· {member.phone}</span>
                                  )}
                                </div>
                              </div>
                            </div>
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
        <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm text-muted-foreground text-center">
            💡 숙소 배정은 Supabase의 rooms, room_members 테이블과 연동됩니다.
            변경이 필요한 경우 운영팀에 문의해주세요.
          </p>
        </div>
      </div>
    </section>
  );
};
