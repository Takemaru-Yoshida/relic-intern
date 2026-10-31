import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Dialog, DialogTitle, DialogTrigger, SheetContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared";
import EmbedStatus from "@/components/EmbedStatus";
import { cn } from "@/lib/utils";
import { BookOpen, LayoutDashboard, LogOut, Menu, Network, Search, Settings, ShieldCheck } from "lucide-react";

export const nav = [
  { to: "/app", label: "ダッシュボード", icon: LayoutDashboard, end: true },
  { to: "/app/library", label: "ライブラリ", icon: BookOpen },
  { to: "/app/search", label: "意味検索", icon: Search },
  { to: "/app/factcheck", label: "引用ファクトチェック", icon: ShieldCheck },
  { to: "/app/graph", label: "関連グラフ", icon: Network },
  { to: "/app/settings", label: "設定", icon: Settings },
];

const NavItems = () => (
  <nav className="flex flex-1 flex-col gap-1 p-3">
    {nav.map(({ to, label, icon: Icon, end }) => (
      <NavLink key={to} to={to} end={end} className={({ isActive }) => cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors", isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>
        <Icon className="size-4" />{label}
      </NavLink>
    ))}
    <div className="mt-auto flex items-center gap-3 rounded-md border bg-card p-3">
      <div className="grid size-8 place-items-center rounded-full bg-secondary text-xs font-bold text-primary">YT</div>
      <div className="min-w-0 flex-1 text-xs"><p className="truncate font-medium">吉田 研究室</p><p className="truncate text-muted-foreground">Free プラン</p></div>
      <Button variant="ghost" size="icon" className="size-8" asChild><NavLink to="/login" aria-label="ログアウト"><LogOut /></NavLink></Button>
    </div>
  </nav>
);

export default function AppLayout() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r bg-muted/40 lg:flex">
        <div className="flex h-16 items-center px-5"><Logo /></div>
        <NavItems />
      </aside>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/90 px-4 backdrop-blur lg:hidden">
        <Logo />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="ghost" size="icon" aria-label="メニュー"><Menu /></Button></DialogTrigger>
          <SheetContent>
            <DialogTitle className="sr-only">メニュー</DialogTitle>
            <div className="flex h-14 items-center px-5"><Logo /></div>
            <NavItems />
          </SheetContent>
        </Dialog>
      </header>
      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-8"><Outlet /></main>
      <EmbedStatus />
    </div>
  );
}
