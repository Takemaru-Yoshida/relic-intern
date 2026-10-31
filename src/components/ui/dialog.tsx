import * as React from "react";
import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

const Overlay = () => <D.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />;
const CloseX = () => (
  <D.Close className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100">
    <X className="size-4" />
    <span className="sr-only">閉じる</span>
  </D.Close>
);

export const DialogContent = ({ className, children, ...p }: React.ComponentProps<typeof D.Content>) => (
  <D.Portal>
    <Overlay />
    <D.Content className={cn("fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-background p-6 shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95", className)} {...p}>
      {children}
      <CloseX />
    </D.Content>
  </D.Portal>
);

export const SheetContent = ({ className, side = "left", children, ...p }: React.ComponentProps<typeof D.Content> & { side?: "left" | "right" }) => (
  <D.Portal>
    <Overlay />
    <D.Content className={cn("fixed inset-y-0 z-50 flex w-72 max-w-[85vw] flex-col bg-background shadow-lg data-[state=open]:animate-in data-[state=open]:duration-300", side === "left" ? "left-0 data-[state=open]:slide-in-from-left" : "right-0 w-96 data-[state=open]:slide-in-from-right", className)} {...p}>
      {children}
      <CloseX />
    </D.Content>
  </D.Portal>
);

export const DialogTitle = ({ className, ...p }: React.ComponentProps<typeof D.Title>) => <D.Title className={cn("text-lg font-semibold", className)} {...p} />;
export const DialogDescription = ({ className, ...p }: React.ComponentProps<typeof D.Description>) => <D.Description className={cn("text-sm text-muted-foreground", className)} {...p} />;
