// Quick test to verify Supabase connection
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://chbkzfwzpmxlbefzvkoj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoYmt6Znd6cG14bGJlZnp2a29qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExODY5NDksImV4cCI6MjA5Njc2Mjk0OX0.bcABf6Clj7by5jHqmpTawNq4nocqGVDhxMLOFK2sWe4';

async function testConnection() {
  try {
    console.log('🔗 Initializing Supabase client...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    console.log('🔐 Testing sign-in with admin credentials...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'cyrilsofdev@gmail.com',
      password: 'Clemson123'
    });

    if (error) {
      console.error('❌ Auth failed:', error.message);
      return;
    }

    console.log('✅ Auth successful!');
    console.log('   User ID:', data.user.id);
    console.log('   Email:', data.user.email);

    console.log('\n📊 Testing database read from "interiors" table...');
    const { data: interiors, error: dbError } = await supabase
      .from('interiors')
      .select('*')
      .limit(5);

    if (dbError) {
      console.error('❌ Database query failed:', dbError.message);
      return;
    }

    console.log('✅ Database connected!');
    console.log('   Records found:', interiors ? interiors.length : 0);
    if (interiors && interiors.length > 0) {
      console.log('   Sample:', interiors[0]);
    }

    console.log('\n📦 Testing storage bucket access...');
    const { data: files, error: storageError } = await supabase.storage
      .from('interiors')
      .list('', { limit: 5 });

    if (storageError) {
      console.error('❌ Storage access failed:', storageError.message);
      return;
    }

    console.log('✅ Storage connected!');
    console.log('   Files in bucket:', files ? files.length : 0);

    console.log('\n✨ All systems connected successfully!');
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

testConnection();
