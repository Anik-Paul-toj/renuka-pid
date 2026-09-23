import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Read .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
let supabaseUrl = "https://pwhtvzvtpwexxfsgfrxf.supabase.co";
let supabaseKey = "sb_publishable_M99xxZ_T9Hh413smmntC_A_YwEl6Ypl";

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
      supabaseUrl = trimmed.split("=")[1].trim();
    } else if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY=") || trimmed.startsWith("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=")) {
      supabaseKey = trimmed.split("=")[1].trim();
    }
  }
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const email = "abc@gmail.com";
  const password = "admin123";

  console.log(`Attempting to register: ${email}...`);

  // 1. Try signUp
  const { data: signData, error: signError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signError) {
    console.log("SignUp note:", signError.message);
  } else {
    console.log("User registered in Supabase Auth. User ID:", signData.user?.id);
  }

  // 2. Try signIn to verify
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (loginError) {
    console.log("SignIn note:", loginError.message);
  } else {
    console.log("\n✅ Credentials valid in Supabase Auth!");
    console.log("User UUID:", loginData.user?.id);
  }
}

main().catch(console.error);
