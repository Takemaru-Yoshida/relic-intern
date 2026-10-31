import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Library from "@/pages/Library";
import DocumentView from "@/pages/DocumentView";
import SearchPage from "@/pages/SearchPage";
import FactCheck from "@/pages/FactCheck";
import Graph from "@/pages/Graph";
import Settings from "@/pages/Settings";

const NotFound = () => (
  <div className="grid min-h-[60vh] place-items-center text-center">
    <div className="space-y-3"><p className="text-5xl font-bold">404</p><p className="text-muted-foreground">ページが見つかりません</p><Button asChild><Link to="/app">ダッシュボードへ</Link></Button></div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/signup" element={<Auth mode="signup" />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="library" element={<Library />} />
          <Route path="library/:id" element={<DocumentView />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="factcheck" element={<FactCheck />} />
          <Route path="graph" element={<Graph />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
