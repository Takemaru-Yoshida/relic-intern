import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// 環境変数が未設定のあいだはモックで動作する（api.ts 参照）
export const supabase = url && key ? createClient(url, key) : null;
