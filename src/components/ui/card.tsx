import * as React from "react";
import { cn } from "@/lib/utils";

type P = React.HTMLAttributes<HTMLDivElement>;
export const Card = ({ className, ...p }: P) => <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...p} />;
export const CardHeader = ({ className, ...p }: P) => <div className={cn("flex flex-col gap-1.5 p-5", className)} {...p} />;
export const CardTitle = ({ className, ...p }: P) => <h3 className={cn("font-semibold leading-tight", className)} {...p} />;
export const CardDescription = ({ className, ...p }: P) => <p className={cn("text-sm text-muted-foreground", className)} {...p} />;
export const CardContent = ({ className, ...p }: P) => <div className={cn("p-5 pt-0", className)} {...p} />;
