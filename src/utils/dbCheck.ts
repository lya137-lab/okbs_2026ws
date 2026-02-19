/**
 * 데이터베이스 연결 및 테이블 존재 여부 확인 유틸리티
 * 개발 환경에서 디버깅용으로 사용
 */

import { supabase } from "@/integrations/supabase/client";

export const checkDatabaseConnection = async () => {
  const results = {
    connection: false,
    participantsTable: false,
    participantProfilesTable: false,
    error: null as string | null,
    details: [] as string[],
  };

  try {
    // 1. Supabase 연결 테스트 (간단한 쿼리)
    try {
      const { error: testError } = await supabase.from("participants").select("id").limit(1);
      
      if (!testError) {
        results.connection = true;
        results.participantsTable = true;
        results.details.push("✅ participants 테이블 존재");
      } else if (testError.message?.includes("Could not find the table") || 
                 testError.message?.includes("relation") ||
                 testError.code === "PGRST116" ||
                 testError.message?.includes("schema cache")) {
        results.connection = true; // 연결은 되지만 테이블이 없음
        results.error = "participants 테이블이 존재하지 않거나 접근할 수 없습니다.";
        results.details.push("❌ participants 테이블 없음 또는 접근 불가");
        results.details.push("💡 해결: Supabase SQL Editor에서 'FINAL_FIX.sql' 실행 (권장)");
        results.details.push("   또는 'CREATE_TABLES_NOW.sql' 실행");
        results.details.push("   실행 후 브라우저를 완전히 새로고침하세요");
      } else {
        results.error = testError.message;
        results.details.push(`❌ 연결 오류: ${testError.message}`);
      }
    } catch (err: any) {
      results.error = err.message || "연결 실패";
      results.details.push(`❌ 예외 발생: ${err.message}`);
    }

    // 2. participant_profiles 테이블 확인
    if (results.connection) {
      try {
        const { error: profilesError } = await supabase
          .from("participant_profiles")
          .select("id")
          .limit(1);

        if (!profilesError) {
          results.participantProfilesTable = true;
          results.details.push("✅ participant_profiles 테이블 존재");
        } else if (profilesError.message?.includes("Could not find the table") ||
                   profilesError.message?.includes("relation") ||
                   profilesError.code === "PGRST116") {
          results.details.push("❌ participant_profiles 테이블 없음 - 마이그레이션 필요");
        } else {
          results.details.push(`⚠️ participant_profiles 확인 오류: ${profilesError.message}`);
        }
      } catch (err: any) {
        results.details.push(`❌ participant_profiles 확인 실패: ${err.message}`);
      }
    }

    return results;
  } catch (error: any) {
    results.error = error.message || "알 수 없는 오류";
    results.details.push(`❌ 전체 확인 실패: ${error.message}`);
    return results;
  }
};

export const logDatabaseStatus = async () => {
  const status = await checkDatabaseConnection();
  console.group("🔍 데이터베이스 상태 확인");
  console.log("연결 상태:", status.connection ? "✅ 연결됨" : "❌ 연결 실패");
  console.log("participants 테이블:", status.participantsTable ? "✅ 존재" : "❌ 없음");
  console.log("participant_profiles 테이블:", status.participantProfilesTable ? "✅ 존재" : "❌ 없음");
  
  if (status.details.length > 0) {
    console.log("\n상세 정보:");
    status.details.forEach(detail => console.log("  " + detail));
  }
  
  if (status.error) {
    console.error("\n❌ 에러:", status.error);
    console.error("\n💡 해결 방법:");
    console.error("1. Supabase 대시보드 > SQL Editor 접속");
    console.error("2. 'FINAL_FIX.sql' 파일 내용 복사하여 실행 (권장)");
    console.error("   또는 'CREATE_TABLES_NOW.sql' 실행");
    console.error("3. 실행 후 브라우저를 완전히 닫고 다시 열기 (Ctrl+Shift+R)");
    console.error("4. 개발 서버 재시작: npm run dev");
  }
  
  console.groupEnd();
  return status;
};
