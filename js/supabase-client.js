// Initialize a shared Supabase client for browser pages.
if (typeof SUPABASE_URL === 'undefined' || typeof SUPABASE_ANON_KEY === 'undefined' || typeof SUPABASE_BUCKET === 'undefined') {
  console.warn('Fill js/supabase-config.js with SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_BUCKET');
}
(function(){
  if (!window.supabase) return;
  try {
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.error('Failed to create Supabase client', e);
  }
})();
