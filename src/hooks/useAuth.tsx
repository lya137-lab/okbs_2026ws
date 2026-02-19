import { useState, useEffect, createContext, useContext, ReactNode } from "react";

// 관리자 고정 계정 정보
const ADMIN_CREDENTIALS = {
  id: "ADMIN001",
  password: "admin",
};

interface AuthContextType {
  user: { id: string } | null;
  session: { isAuthenticated: boolean } | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (id: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [session, setSession] = useState<{ isAuthenticated: boolean } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 초기 로드 시 저장된 인증 상태 확인
  useEffect(() => {
    const stored = localStorage.getItem("admin_auth");
    if (stored === "true") {
      setUser({ id: ADMIN_CREDENTIALS.id });
      setSession({ isAuthenticated: true });
      setIsAdmin(true);
    }
    setIsLoading(false);
  }, []);

  const signIn = async (id: string, password: string): Promise<{ error: Error | null }> => {
    // 고정 계정 정보와 비교 (대소문자 구분)
    if (id === ADMIN_CREDENTIALS.id && password === ADMIN_CREDENTIALS.password) {
      // 로그인 성공
      setUser({ id: ADMIN_CREDENTIALS.id });
      setSession({ isAuthenticated: true });
      setIsAdmin(true);
      localStorage.setItem("admin_auth", "true");
      return { error: null };
    } else {
      // 로그인 실패
      return { error: new Error("ID 또는 비밀번호가 올바르지 않습니다.") };
    }
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    localStorage.removeItem("admin_auth");
  };

  return (
    <AuthContext.Provider
      value={{ user, session, isAdmin, isLoading, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
