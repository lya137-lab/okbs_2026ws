import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ParticipantAuthProvider } from "@/hooks/useParticipantAuth";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import ParticipantLogin from "./pages/ParticipantLogin";
import SelfIntroduction from "./pages/SelfIntroduction";
import Announcements from "./pages/Announcements";
import BusAssignment from "./pages/BusAssignment";
import Accommodation from "./pages/Accommodation";
import MyProfile from "./pages/MyProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ParticipantAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/login" element={<ParticipantLogin />} />
              <Route path="/self-introduction" element={<SelfIntroduction />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/bus-assignment" element={<BusAssignment />} />
              <Route path="/accommodation" element={<Accommodation />} />
              <Route path="/profile" element={<MyProfile />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ParticipantAuthProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
