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
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        <Icon className="size-6 text-muted" />
        <p className="text-sm text-muted">{description}</p>
      </Card>
    </div>
  );
}
