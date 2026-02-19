import { Heart } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-foreground py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">OK</span>
            </div>
            <div>
              <p className="font-bold text-background text-sm">OK배정장학재단</p>
              <p className="text-xs text-background/60">2026 상반기 워크숍</p>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center">
            <p className="text-sm text-background/60">
              © 2026 OK배정장학재단. All rights reserved.
            </p>
            <p className="text-xs text-background/40 mt-1 flex items-center justify-center gap-1">
              Made with <Heart className="h-3 w-3 text-accent fill-accent" /> for our scholars
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
