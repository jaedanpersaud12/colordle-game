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
import { ArrowLeft, Check, X, Loader2 } from "lucide-react";
import Link from "next/link";

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

export default function SettingsPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);
  const [colors, setColors] = useState<Color[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [filteredColors, setFilteredColors] = useState<Color[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();
  const updateProfile = trpc.auth.updateProfile.useMutation();
  const utils = trpc.useUtils();

  const { data: currentUser, refetch } = trpc.auth.getCurrentUser.useQuery();

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
        enabled: debouncedUsername.length >= 3 && debouncedUsername !== currentUser?.username,
      }
    );

  useEffect(() => {
    async function init() {
      // Load colors
      const loadedColors = await loadColors();
      setColors(loadedColors);

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
      } else {
        // Fetch user record
        const result = await refetch();

        if (result.data) {
          setUsername(result.data.username || "");
          if (result.data.profileColor) {
            // Find the color in our colors list or create a temporary one
            const existingColor = loadedColors.find(
              c => c.hex.toLowerCase() === result.data!.profileColor!.toLowerCase()
            );
            if (existingColor) {
              setSelectedColor(existingColor);
            } else {
              // Create a temporary color object for the saved color
              setSelectedColor({
                name: "Custom Color",
                hex: result.data.profileColor,
                goodName: true,
              });
            }
          }
        }

        setIsLoading(false);
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
    setSuccess("");

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
      await updateProfile.mutateAsync({
        username,
        profileColor: selectedColor.hex,
      });

      // Invalidate the getCurrentUser query to refresh user data
      await utils.auth.getCurrentUser.invalidate();

      setSuccess("Settings saved successfully!");
      setIsSubmitting(false);
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
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
      goodName: true,
    });
    setSearchInput("");
    setFilteredColors([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Game
        </Link>

        <div className="border border-border bg-card p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Settings</h1>
            <p className="text-muted-foreground">
              Update your username and profile color.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-bold block">
                Username
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
                {username.length >= 3 && username !== currentUser?.username && (
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
              {username.length >= 3 && username !== currentUser?.username && usernameCheck && !isCheckingUsername && (
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
              {(username.length < 3 || username === currentUser?.username) && (
                <p className="text-xs text-muted-foreground">
                  3-20 characters, letters, numbers, and underscores only
                </p>
              )}
            </div>

            {/* Profile Color */}
            <div className="space-y-3">
              <label htmlFor="color-search" className="text-sm font-bold block">
                Profile Color
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

                    {/* Search Results */}
                    {filteredColors.length > 0 && (
                      <div className="absolute z-50 w-full mb-2 bottom-full bg-card border border-border shadow-2xl overflow-hidden">
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

            {/* Error/Success Messages */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-400 text-sm">
                {success}
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
              {isSubmitting ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
