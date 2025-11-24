"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Color, loadColors } from "@/lib/colors";
import { getReadableTextColor } from "@/lib/color-utils";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { Check, X, Loader2 } from "lucide-react";
import { LoadingLogo } from "@/components/LoadingLogo";

// Popular preset colors for quick selection
const PRESET_COLORS = [
  { name: "Red", hex: "#EF4444" },
  { name: "Orange", hex: "#F97316" },
  { name: "Amber", hex: "#F59E0B" },
  { name: "Emerald", hex: "#10B981" },
  { name: "Teal", hex: "#14B8A6" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Indigo", hex: "#6366F1" },
  { name: "Violet", hex: "#8B5CF6" },
  { name: "Purple", hex: "#A855F7" },
  { name: "Pink", hex: "#EC4899" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);
  const [colors, setColors] = useState<Color[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [filteredColors, setFilteredColors] = useState<Color[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();
  const completeOnboarding = trpc.auth.completeOnboarding.useMutation();
  const submitScoreMutation = trpc.game.submitScore.useMutation();
  const utils = trpc.useUtils();

  // Use enabled:false and manually fetch to control when query runs
  const { data: currentUser, refetch } = trpc.auth.getCurrentUser.useQuery(undefined, {
    enabled: false,
  });

  // Debounce username for checking availability
  const debouncedUsername = useDebounce(username, 300);

  // Check username availability
  const { data: usernameCheck, isLoading: isCheckingUsername } =
    trpc.auth.checkUsernameAvailability.useQuery(
      {
        username: debouncedUsername,
        currentUserId: currentUser?.id,
      },
      {
        enabled: debouncedUsername.length >= 3,
      }
    );

  useEffect(() => {
    async function init() {
      // Load colors
      const loadedColors = await loadColors();
      setColors(loadedColors);

      // Check if user is authenticated and create/fetch user record
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
      } else {
        // Fetch/create user record
        const result = await refetch();

        // Redirect if already completed onboarding
        if (result.data?.onboardingComplete) {
          router.push("/");
        } else {
          setIsLoading(false);
        }
      }
    }

    init();
  }, [router, supabase.auth, refetch]);

  // Filter colors based on search
  useEffect(() => {
    if (!searchInput.trim()) {
      setFilteredColors([]);
      return;
    }

    const searchTerm = searchInput.toLowerCase();
    const startsWithResults = colors.filter((color) =>
      color.name.toLowerCase().startsWith(searchTerm)
    );
    const containsResults = colors.filter(
      (color) =>
        color.name.toLowerCase().includes(searchTerm) &&
        !color.name.toLowerCase().startsWith(searchTerm)
    );

    setFilteredColors([...startsWithResults, ...containsResults].slice(0, 20));
  }, [searchInput, colors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (username.length > 20) {
      setError("Username must be at most 20 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username can only contain letters, numbers, and underscores");
      return;
    }

    if (!selectedColor) {
      setError("Please select a profile color");
      return;
    }

    setIsSubmitting(true);

    try {
      await completeOnboarding.mutateAsync({
        username,
        profileColor: selectedColor.hex,
      });

      // Invalidate the getCurrentUser query to refresh user data
      await utils.auth.getCurrentUser.invalidate();

      // Check for pre-auth game state and sync to backend
      const preAuthGameState = localStorage.getItem("pre-auth-game-state");
      if (preAuthGameState) {
        try {
          const savedState = JSON.parse(preAuthGameState);

          // Submit the saved game state to backend
          await submitScoreMutation.mutateAsync({
            gameDate: savedState.gameDate,
            colorName: savedState.targetColor.name,
            colorHex: savedState.targetColor.hex,
            attempts: savedState.attempts,
            won: savedState.won,
            gaveUp: savedState.gaveUp,
            guesses: savedState.guesses.map((g: any) => ({
              colorName: g.color.name,
              colorHex: g.color.hex,
              similarity: g.similarity,
              timestamp: g.timestamp,
            })),
          });

          // Clear the pre-auth game state
          localStorage.removeItem("pre-auth-game-state");
        } catch (syncErr) {
          console.error("Failed to sync pre-auth game state:", syncErr);
          // Don't block onboarding if sync fails
        }
      }

      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to complete onboarding");
      setIsSubmitting(false);
    }
  };

  const handleColorSelect = (color: Color) => {
    setSelectedColor(color);
    setSearchInput("");
    setFilteredColors([]);
  };

  const handlePresetSelect = (preset: { name: string; hex: string }) => {
    setSelectedColor({
      name: preset.name,
      hex: preset.hex,
      goodName: true, // Preset colors always have good names
    });
    setSearchInput("");
    setFilteredColors([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-8">
            <LoadingLogo />
          </div>
          <p className="text-lg font-semibold">Setting up your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="border border-border bg-card p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Welcome to Colordle!</h1>
            <p className="text-muted-foreground">
              Let's set up your profile to get started.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-bold block">
                Choose a Username
              </label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="colormaster123"
                  disabled={isSubmitting}
                  className="w-full pr-10"
                  autoComplete="off"
                />
                {username.length >= 3 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isCheckingUsername ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : usernameCheck?.available ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                )}
              </div>
              {username.length >= 3 && usernameCheck && !isCheckingUsername && (
                <p
                  className={`text-xs ${
                    usernameCheck.available
                      ? "text-green-600 dark:text-green-500"
                      : "text-red-600 dark:text-red-500"
                  }`}
                >
                  {usernameCheck.message}
                </p>
              )}
              {username.length < 3 && (
                <p className="text-xs text-muted-foreground">
                  3-20 characters, letters, numbers, and underscores only
                </p>
              )}
            </div>

            {/* Profile Color */}
            <div className="space-y-3">
              <label htmlFor="color-search" className="text-sm font-bold block">
                Pick Your Profile Color
              </label>

              {/* Selected Color Display */}
              {selectedColor && (
                <div className="p-4 border border-border bg-muted">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 border border-border flex-shrink-0"
                      style={{ backgroundColor: selectedColor.hex }}
                    />
                    <div>
                      <p className="font-bold text-base">{selectedColor.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {selectedColor.hex}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedColor(null)}
                      className="ml-auto text-sm text-muted-foreground hover:text-foreground"
                      disabled={isSubmitting}
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}

              {/* Preset Colors & Search */}
              {!selectedColor && (
                <div className="space-y-4">
                  {/* Color Search */}
                  <div className="relative">
                    <Input
                      id="color-search"
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search colors... (e.g., blue, sunset, forest)"
                      disabled={isSubmitting}
                      className="w-full"
                      autoComplete="off"
                    />

                    {/* Search Results - Compact for Onboarding */}
                    {filteredColors.length > 0 && (
                      <div className="absolute z-50 w-full mb-2 bottom-full bg-card border border-border overflow-hidden">
                        <div className="max-h-48 overflow-y-auto">
                          <div className="grid grid-cols-1 gap-1 p-2">
                            {filteredColors.slice(0, 10).map((color) => (
                              <button
                                key={`${color.name}-${color.hex}`}
                                type="button"
                                onClick={() => handleColorSelect(color)}
                                className="text-left p-2 bg-background border border-border hover:border-foreground/30 transition-all"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-8 h-8 border border-border flex-shrink-0"
                                    style={{ backgroundColor: color.hex }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold">{color.name}</p>
                                    <p className="text-xs text-muted-foreground font-mono">
                                      {color.hex}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="p-2 bg-muted border-t border-border text-xs font-bold">
                          {filteredColors.length} color
                          {filteredColors.length !== 1 ? "s" : ""} found
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-2">
                      Search from {colors.length.toLocaleString()} available colors
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-card px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Or Quick Pick
                      </span>
                    </div>
                  </div>

                  {/* Preset Colors Grid */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                      Popular Colors
                    </p>
                    <div className="grid grid-cols-5 gap-2">
                      {PRESET_COLORS.map((preset) => (
                        <button
                          key={preset.hex}
                          type="button"
                          onClick={() => handlePresetSelect(preset)}
                          className="h-16 border border-border hover:border-foreground/30 transition-all group relative"
                          style={{ backgroundColor: preset.hex }}
                          disabled={isSubmitting}
                          title={preset.name}
                        >
                          <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 text-white text-xs font-bold transition-opacity">
                            {preset.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !username || !selectedColor}
              style={
                selectedColor
                  ? {
                      backgroundColor: selectedColor.hex,
                      color: getReadableTextColor(selectedColor.hex),
                    }
                  : undefined
              }
            >
              {isSubmitting ? "Saving..." : "Continue to Game"}
            </Button>
            {selectedColor && (
              <p className="text-xs text-muted-foreground text-center -mt-3">
                This will be your button color throughout the app!
              </p>
            )}
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          You can change these settings later in your profile
        </p>
      </div>
    </main>
  );
}
