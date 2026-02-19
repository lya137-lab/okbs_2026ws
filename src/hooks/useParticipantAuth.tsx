import { useState, useEffect, createContext, useContext, ReactNode } from "react";

interface ParticipantAuthContextType {
  isLoggedIn: boolean;
  participantId: string | null;
  participantName: string | null;
  participantPhone: string | null;
  login: (participantId: string, name: string, phone: string) => void;
  logout: () => void;
}

const ParticipantAuthContext = createContext<ParticipantAuthContextType | undefined>(undefined);

const STORAGE_KEY_ID = "participant_id";
const STORAGE_KEY_NAME = "participant_name";
const STORAGE_KEY_PHONE = "participant_phone";

export const ParticipantAuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState<string | null>(null);
  const [participantPhone, setParticipantPhone] = useState<string | null>(null);

  useEffect(() => {
    const storedId = localStorage.getItem(STORAGE_KEY_ID);
    const storedName = localStorage.getItem(STORAGE_KEY_NAME);
    const storedPhone = localStorage.getItem(STORAGE_KEY_PHONE);

    if (storedId && storedName && storedPhone) {
      setIsLoggedIn(true);
      setParticipantId(storedId);
      setParticipantName(storedName);
      setParticipantPhone(storedPhone);
    }
  }, []);

  const login = (id: string, name: string, phone: string) => {
    localStorage.setItem(STORAGE_KEY_ID, id);
    localStorage.setItem(STORAGE_KEY_NAME, name);
    localStorage.setItem(STORAGE_KEY_PHONE, phone);
    setIsLoggedIn(true);
    setParticipantId(id);
    setParticipantName(name);
    setParticipantPhone(phone);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY_ID);
    localStorage.removeItem(STORAGE_KEY_NAME);
    localStorage.removeItem(STORAGE_KEY_PHONE);
    setIsLoggedIn(false);
    setParticipantId(null);
    setParticipantName(null);
    setParticipantPhone(null);
  };

  return (
    <ParticipantAuthContext.Provider
      value={{ isLoggedIn, participantId, participantName, participantPhone, login, logout }}
    >
      {children}
    </ParticipantAuthContext.Provider>
  );
};

export const useParticipantAuth = () => {
  const context = useContext(ParticipantAuthContext);
  if (context === undefined) {
    throw new Error("useParticipantAuth must be used within a ParticipantAuthProvider");
  }
  return context;
};
