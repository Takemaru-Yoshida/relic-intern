import * as React from "react";
import * as P from "@radix-ui/react-progress";
import * as S from "@radix-ui/react-switch";
import * as L from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

export const Progress = ({ value = 0, className, indicatorClassName }: { value?: number; className?: string; indicatorClassName?: string }) => (
  <P.Root className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)} value={value}>
    <P.Indicator className={cn("h-full bg-primary transition-all", indicatorClassName)} style={{ width: `${value}%` }} />
  </P.Root>
);

export const Switch = ({ className, ...p }: React.ComponentProps<typeof S.Root>) => (
  <S.Root className={cn("peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent bg-input transition-colors data-[state=checked]:bg-primary", className)} {...p}>
    <S.Thumb className="block size-5 rounded-full bg-background shadow transition-transform data-[state=checked]:translate-x-5" />
  </S.Root>
);

export const Label = ({ className, ...p }: React.ComponentProps<typeof L.Root>) => <L.Root className={cn("text-sm font-medium", className)} {...p} />;

export const Separator = ({ className }: { className?: string }) => <div role="separator" className={cn("h-px w-full bg-border", className)} />;
