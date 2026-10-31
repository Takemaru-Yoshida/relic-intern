import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/misc";
import { Logo } from "@/components/shared";

// TODO: supabase.auth.signInWithPassword / signUp / signInWithOAuth({ provider: "google" })
export default function Auth({ mode }: { mode: "login" | "signup" }) {
  const nav = useNavigate();
  const signup = mode === "signup";
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/40 p-4">
      <Logo />
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{signup ? "アカウント作成" : "ログイン"}</CardTitle>
          <CardDescription>{signup ? "大学のメールアドレスで登録できます" : "おかえりなさい"}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => (e.preventDefault(), nav("/app"))}>
            {signup && <div className="space-y-2"><Label htmlFor="name">氏名</Label><Input id="name" placeholder="山田 太郎" /></div>}
            <div className="space-y-2"><Label htmlFor="email">メールアドレス</Label><Input id="email" type="email" placeholder="you@univ.ac.jp" required /></div>
            <div className="space-y-2"><Label htmlFor="pw">パスワード</Label><Input id="pw" type="password" required /></div>
            <Button className="w-full">{signup ? "登録する" : "ログイン"}</Button>
            <Button type="button" variant="outline" className="w-full" onClick={() => nav("/app")}>Google で続ける</Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {signup ? "すでにアカウントをお持ちですか？" : "アカウントをお持ちでないですか？"}
            <Link to={signup ? "/login" : "/signup"} className="ml-1 text-primary hover:underline">{signup ? "ログイン" : "新規登録"}</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
