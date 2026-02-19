import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Home, Calendar, Users, Phone, Bus, Shield, LogIn, LogOut, User, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParticipantAuth } from "@/hooks/useParticipantAuth";
import logoOK from "@/assets/logo-ok-foundation.png";

// Public nav items (visible to everyone)
const publicNavItems: Array<{
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isLink?: boolean;
}> = [
  { label: "홈", href: "#home", icon: Home },
  { label: "공지사항", href: "/announcements", icon: Megaphone, isLink: true },
  { label: "일정표", href: "#schedule", icon: Calendar },
  { label: "FAQ", href: "#faq", icon: Phone },
];

// Protected nav items (only visible after login) - Supabase 테이블 연동 페이지
const protectedNavItems: Array<{
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isLink?: boolean;
}> = [
  { label: "참석자", href: "#participants", icon: Users },
  { label: "버스배정", href: "/bus-assignment", icon: Bus, isLink: true },
];

// 마이페이지 메뉴 (맨 우측 배치)
const myPageNavItem = { label: "마이페이지", href: "/profile", icon: User, isLink: true };

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoggedIn, participantName, logout } = useParticipantAuth();

  const navItems = isLoggedIn
    ? [...publicNavItems, ...protectedNavItems]
    : publicNavItems;

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="glass-card border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo: 다른 페이지에서도 클릭 시 메인(/)으로 이동 */}
            <Link to="/#home" className="flex items-center gap-3">
              <img 
                src={logoOK} 
                alt="OK배정장학재단" 
                className="h-8 sm:h-10 w-auto"
              />
              <div className="hidden sm:block">
                <p className="text-xs text-muted-foreground font-medium">2026 상반기 워크숍</p>
              </div>
            </Link>

            {/* Desktop Navigation: 해시(#) 링크는 메인(/)으로 이동 후 앵커 적용 */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isHashLink = item.href.startsWith("#");
                const to = isHashLink ? `/${item.href}` : item.href;
                return (
                  <Link
                    key={item.href}
                    to={to}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                  >
                    {item.label}
                  </Link>
                );
              })}

              {isLoggedIn && (
                <Link
                  to={myPageNavItem.href}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                >
                  {myPageNavItem.label}
                </Link>
              )}
              
              {isLoggedIn ? (
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-sm text-foreground font-medium flex items-center gap-1 px-3 py-1.5 bg-accent/20 rounded-lg">
                    <User className="w-4 h-4" />
                    {participantName}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={logout}
                    className="flex items-center gap-1"
                  >
                    <LogOut className="w-4 h-4" />
                    로그아웃
                  </Button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="ml-2 px-4 py-2 text-sm font-medium text-accent-foreground bg-gradient-accent hover:opacity-90 rounded-lg transition-all flex items-center gap-1"
                >
                  <LogIn className="w-4 h-4" />
                  로그인
                </Link>
              )}
              
              <Link
                to="/admin"
                className="ml-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors flex items-center gap-1"
              >
                <Shield className="w-4 h-4" />
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden glass-card border-b border-border/50"
          >
            <nav className="container mx-auto px-4 py-4">
              {/* User Status */}
              {isLoggedIn && (
                <div className="flex items-center justify-between mb-4 p-3 bg-accent/10 rounded-xl">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    {participantName}님
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="text-muted-foreground"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    로그아웃
                  </Button>
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isHashLink = item.href.startsWith("#");
                  const to = isHashLink ? `/${item.href}` : item.href;
                  return (
                    <Link
                      key={item.href}
                      to={to}
                      onClick={() => setIsOpen(false)}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-secondary transition-colors"
                    >
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </Link>
                  );
                })}

                {isLoggedIn && (() => {
                  const Icon = myPageNavItem.icon;
                  return (
                    <Link
                      to={myPageNavItem.href}
                      onClick={() => setIsOpen(false)}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-secondary transition-colors"
                    >
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="text-xs font-medium">{myPageNavItem.label}</span>
                    </Link>
                  );
                })()}
                
                {!isLoggedIn && (
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-accent/10 hover:bg-accent/20 transition-colors"
                  >
                    <LogIn className="h-5 w-5 text-accent" />
                    <span className="text-xs font-medium text-accent">로그인</span>
                  </Link>
                )}
                
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-secondary transition-colors"
                >
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">관리자</span>
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
