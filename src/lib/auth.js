// src/lib/auth.js
import { supabase } from "./supabaseClient";

// GitHub Pages 서브패스(/reject-analyzer/) 유지용 redirectTo 계산
function getRedirectTo() {
  const origin = window.location.origin;
  let path = window.location.pathname || "/";

  // pathname이 "/reject-analyzer" 처럼 끝 슬래시가 없을 수도 있으니 보정
  if (!path.endsWith("/")) path += "/";

  // query/hash는 로그인 복귀 후 원래 앱이 처리하게 두는 게 안전
  return origin + path;
}

export async function signInWithGoogle() {
  const redirectTo = getRedirectTo();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  // signInWithOAuth는 보통 redirect로 앱을 떠나므로
  // 여기서는 error만 처리하고 나머지는 세션 동기화에서 잡습니다.
  if (error) throw error;

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data?.session || null;
}

export function onAuthStateChange(callback) {
  // callback(event, session)
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback?.(event, session || null);
  });
  return data?.subscription || null;
}