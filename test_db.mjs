import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from("sessions")
    .select(`
      id, title, description, status, category, tags, created_at, invite_code,
      created_by, organization_id,
      organizations(name),
      ideas(count),
      idea_votes:ideas(idea_votes(count))
    `)
    .order("created_at", { ascending: false });
    
  if (error) {
    console.error("EXACT QUERY FAILED:", error);
  } else {
    console.log("EXACT QUERY SUCCEEDED. Rows:", data?.length);
    console.log(data?.slice(0, 2));
  }
}
main();
