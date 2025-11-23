"use client";

import {
  Dialog,
  DialogBody,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Modal, ModalOverlay } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

export function HelpDialog() {
  return (
    <ModalOverlay>
      <Modal>
        <Dialog>
          {({ close }) => (
            <>
              <DialogHeader
                title="How to Play Colordle"
                description="Guess the daily color from 30,000+ color names!"
              />
              <DialogBody className="space-y-4 text-sm">
                <section>
                  <h3 className="font-semibold mb-2">Objective</h3>
                  <p>
                    Guess the mystery color of the day. Each guess will show you
                    how close you are to the target color as a percentage.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">How to Guess</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Type any color name in the input field</li>
                    <li>Select from the autocomplete suggestions</li>
                    <li>Press Enter or click Guess to submit</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">Similarity Scoring</h3>
                  <p className="mb-2">
                    Your guess is scored based on RGB color distance:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>
                      <strong>95-100%</strong> - Extremely close, almost
                      identical
                    </li>
                    <li>
                      <strong>80-94%</strong> - Very similar, getting warm
                    </li>
                    <li>
                      <strong>60-79%</strong> - Somewhat similar
                    </li>
                    <li>
                      <strong>Below 60%</strong> - Keep exploring
                    </li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">Hints & Help</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>
                      <strong>Color Wheel:</strong> After 3 guesses, a hint
                      marker appears showing the general hue area
                    </li>
                    <li>
                      <strong>Guess History:</strong> Your guesses are
                      automatically sorted by similarity to help you strategize
                    </li>
                    <li>
                      <strong>Color Preview:</strong> See the actual target
                      color after winning or giving up
                    </li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">Strategy Tips</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Start with primary colors to narrow down the hue</li>
                    <li>Use the color wheel hint to focus your search</li>
                    <li>Pay attention to your highest similarity scores</li>
                    <li>
                      Think about color families (blues, reds, greens, etc.)
                    </li>
                    <li>Use the autocomplete to discover color names</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">Daily Challenge</h3>
                  <p>
                    A new color is selected each day. Come back tomorrow for a
                    new challenge! Your stats and streaks are tracked
                    automatically.
                  </p>
                </section>
              </DialogBody>
            </>
          )}
        </Dialog>
      </Modal>
      <DialogTrigger>
        <Button variant="outline" size="icon-sm">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
    </ModalOverlay>
  );
}
