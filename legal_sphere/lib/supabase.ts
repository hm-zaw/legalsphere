import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL as string | undefined;
const supabaseKey = process.env.SUPABASE_KEY as string | undefined;

declare global {
  // eslint-disable-next-line no-var
  var _supabaseClient: ReturnType<typeof createClient> | undefined;
}

export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SUPABASE_URL and SUPABASE_KEY must be set in environment.");
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._supabaseClient) {
      global._supabaseClient = createClient(supabaseUrl, supabaseKey);
    }
    return global._supabaseClient;
  }

  return createClient(supabaseUrl, supabaseKey);
}
