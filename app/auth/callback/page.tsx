"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LoadingLogo } from "@/components/LoadingLogo";

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from the URL
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth callback error:", error);
          router.push("/");
          return;
        }

        if (session) {
          // User successfully authenticated
          // Middleware will handle redirect to onboarding or home
          router.push("/");
        } else {
          // No session, redirect to home
          router.push("/");
        }
      } catch (error) {
        console.error("Callback error:", error);
        router.push("/");
      }
    };

    handleCallback();
  }, [router, supabase.auth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-8">
          <LoadingLogo />
        </div>
        <p className="text-lg font-semibold">Completing sign in...</p>
        <p className="text-sm text-muted-foreground mt-2">Just a moment</p>
      </div>
    </div>
  );
}
