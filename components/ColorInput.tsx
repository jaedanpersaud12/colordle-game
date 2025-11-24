"use client";

import {
  useState,
  useMemo,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { Color } from "@/lib/colors";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
interface ColorInputProps {
  colors: Color[];
  onGuess: (color: Color) => void;
  disabled: boolean;
  guessedColors: Color[];
}

export function ColorInput({ colors, onGuess, disabled, guessedColors }: ColorInputProps) {
  const [input, setInput] = useState("");
  const [debouncedInput, setDebouncedInput] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Debounce the input to wait for user to finish typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedInput(input);
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [input]);

  // Create a set of guessed color hex values for fast lookup
  const guessedHexes = useMemo(
    () => new Set(guessedColors.map((c) => c.hex.toLowerCase())),
    [guessedColors]
  );

  const filteredColors = useMemo(() => {
    if (!debouncedInput.trim()) return [];
    const searchTerm = debouncedInput.toLowerCase();

    // Filter out already guessed colors
    const availableColors = colors.filter(
      (color) => !guessedHexes.has(color.hex.toLowerCase())
    );

    // Fast path: check if search starts with the term (most common case)
    const startsWithResults = availableColors.filter((color) =>
      color.name.toLowerCase().startsWith(searchTerm)
    );

    // Otherwise, include colors that contain the term
    const containsResults = availableColors.filter(
      (color) =>
        color.name.toLowerCase().includes(searchTerm) &&
        !color.name.toLowerCase().startsWith(searchTerm)
    );

    return [...startsWithResults, ...containsResults];
  }, [debouncedInput, colors, guessedHexes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredColors.length > 0) {
      const indexToUse = selectedIndex >= 0 ? selectedIndex : 0;
      onGuess(filteredColors[indexToUse]);
      setInput("");
      setSelectedIndex(-1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < 0 ? 0 : Math.min(prev + 1, filteredColors.length - 1)
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Update input immediately for responsive typing
    setInput(value);
    setSelectedIndex(-1);
  };

  const handleColorClick = useCallback(
    (color: Color) => {
      onGuess(color);
      setInput("");
      setSelectedIndex(-1);
    },
    [onGuess]
  );

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <Input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a color name..."
          disabled={disabled}
          className="flex-1"
          autoComplete="off"
        />
        <Button
          type="submit"
          disabled={disabled || filteredColors.length === 0}
        >
          <ArrowRight className="w-4 h-4" />
        </Button>
      </form>

      {filteredColors.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-card border border-border overflow-hidden">
          <div className="p-3 bg-muted border-b border-border text-base font-bold">
            {filteredColors.length} color
            {filteredColors.length !== 1 ? "s" : ""} found
          </div>
          <div
            ref={scrollRef}
            className="max-h-96 overflow-y-auto overscroll-contain"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3">
              {filteredColors.map((color, index) => (
                <button
                  key={`${color.name}-${color.hex}`}
                  type="button"
                  onClick={() => handleColorClick(color)}
                  className={`text-left p-3 transition-all ${
                    index === selectedIndex
                      ? "bg-background border-2 border-foreground"
                      : "bg-background border border-border hover:border-foreground/30"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-12 h-12 sm:w-14 sm:h-14 border border-border flex-shrink-0"
                      style={{ backgroundColor: color.hex }}
                      title={color.hex}
                    />
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="text-sm font-bold leading-tight truncate">
                        {color.name}
                      </p>
                      <p
                        className={`text-xs font-mono mt-1 truncate ${
                          index === selectedIndex
                            ? "opacity-70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {color.hex}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground mt-2 font-medium">
        {colors.length.toLocaleString()} colors available
      </p>
    </div>
  );
}
