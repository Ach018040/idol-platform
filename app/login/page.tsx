"use client";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage(){
  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google'
    });
  };

  return (
    <div className="p-10 flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold">Login</h1>
      <button onClick={login} className="px-6 py-3 bg-black text-white rounded">
        Continue with Google
      </button>
    </div>
  );
}
