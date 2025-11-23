"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, Gamepad2, Target, Lightbulb, Calendar } from "lucide-react";

interface HelpDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon-sm">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle>How to Play</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-base">
          <p className="leading-relaxed">
            Guess the mystery color of the day from over 30,000 color names!
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Gamepad2 className="h-5 w-5 flex-shrink-0 text-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold mb-1.5">How to play:</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Type any color name and select from suggestions</li>
                  <li>• Each guess shows similarity as a percentage</li>
                  <li>• After 3 guesses, unlock a color hint</li>
                  <li>• Find the exact color to win!</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 flex-shrink-0 text-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold mb-1.5">Similarity guide:</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• <strong className="text-foreground">95-100%</strong> - Nearly identical</li>
                  <li>• <strong className="text-foreground">80-94%</strong> - Very close</li>
                  <li>• <strong className="text-foreground">60-79%</strong> - Getting warmer</li>
                  <li>• <strong className="text-foreground">Below 60%</strong> - Keep searching</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 flex-shrink-0 text-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold mb-1.5">Tips:</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Start with primary colors to narrow the hue</li>
                  <li>• Use the hint to focus your search area</li>
                  <li>• Guesses are sorted by similarity</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
            <Calendar className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              A new color is available each day. Your stats and streaks are tracked automatically.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
