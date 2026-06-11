// Public helper to fetch interiors from Supabase
async function fetchInteriorsPublic() {
  if (!window.supabaseClient) {
    console.warn('Supabase client not initialized (supabase-client.js missing)');
    return [];
  }
  const client = window.supabaseClient;
  const { data, error } = await client.from('interiors').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Failed to fetch interiors', error);
    return [];
  }
  return data || [];
}
