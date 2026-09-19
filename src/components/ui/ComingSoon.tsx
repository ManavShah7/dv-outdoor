import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function ComingSoon({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[26px] font-semibold tracking-tight text-foreground">{title}</h1>
      <Card className="flex flex-col items-center gap-3 p-12 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-foreground/[0.04] text-muted">
          <Icon className="size-5" strokeWidth={1.75} />
        </div>
        <p className="max-w-sm text-sm tracking-tight text-muted">{description}</p>
      </Card>
    </div>
  );
}
