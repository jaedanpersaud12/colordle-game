import { LoadingLogo } from "@/components/LoadingLogo";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-8">
          <LoadingLogo />
        </div>
        <p className="text-lg font-semibold">Loading Colordle...</p>
        <p className="text-sm text-muted-foreground mt-2">This should only take a moment</p>
      </div>
    </div>
  );
}
