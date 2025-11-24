"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { AuthModal } from "./AuthModal";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { getReadableTextColor } from "@/lib/color-utils";

interface UserMenuProps {
  onSignInClick?: () => void;
}

export function UserMenu({ onSignInClick }: UserMenuProps = {}) {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { data: dbUser } = trpc.auth.getCurrentUser.useQuery();

  const handleSignInClick = () => {
    onSignInClick?.();
    setShowAuthModal(true);
  };

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="w-16 h-9 bg-muted animate-pulse border border-border"></div>
    );
  }

  if (!user) {
    return (
      <>
        <Button onClick={handleSignInClick} variant="outline" size="sm">
          Sign In
        </Button>
        <AuthModal isOpen={showAuthModal} onOpenChange={setShowAuthModal} />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            style={
              dbUser?.profileColor
                ? {
                    backgroundColor: dbUser.profileColor,
                    borderColor: dbUser.profileColor,
                    color: getReadableTextColor(dbUser.profileColor),
                  }
                : undefined
            }
            className="font-bold gap-1"
          >
            @{dbUser?.username || "user"}
            <ChevronDown className="w-3.5 h-3.5 translate-y-[1.5px]" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 p-0">
          <div className="px-3 py-3 bg-muted/50">
            {dbUser?.username && (
              <p className="font-bold text-sm mb-0.5">@{dbUser.username}</p>
            )}
            <p className="text-muted-foreground truncate text-xs leading-relaxed">
              {user.email}
            </p>
          </div>
          <DropdownMenuSeparator className="my-0" />
          <div className="p-1">
            <DropdownMenuItem
              asChild
              className="cursor-pointer text-sm py-2 px-3 "
            >
              <a href="/settings" className="flex items-center">
                <Settings className="w-4 h-4 mr-3" />
                Settings
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer text-sm py-2 px-3  text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      <AuthModal isOpen={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
  );
}
