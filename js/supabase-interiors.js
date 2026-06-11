// Admin Supabase auth + interiors upload/list UI glue
// `ADMIN_EMAIL` is read from `js/supabase-config.js` (set during setup).

function showAdminDashboard() {
  document.getElementById('loginCard')?.classList.add('hidden');
  document.getElementById('dashboard')?.classList.remove('hidden');
}

function showLoginCard() {
  document.getElementById('loginCard')?.classList.remove('hidden');
  document.getElementById('dashboard')?.classList.add('hidden');
}

async function signInWithSupabase(email, password) {
  if (!window.supabaseClient) throw new Error('Supabase client not initialized');
  const resp = await window.supabaseClient.auth.signInWithPassword({ email, password });
  return resp;
}

async function signOutSupabase() {
  if (!window.supabaseClient) return;
  await window.supabaseClient.auth.signOut();
}

async function uploadInteriorFile(file) {
  const client = window.supabaseClient;
  const filename = `${Date.now()}-${file.name.replace(/\s+/g,'_')}`;
  const storagePath = `${filename}`;
  const { data, error } = await client.storage.from(SUPABASE_BUCKET).upload(storagePath, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data: urlData, error: urlErr } = client.storage.from(SUPABASE_BUCKET).getPublicUrl(storagePath);
  if (urlErr) throw urlErr;
  return { publicUrl: urlData.publicUrl, path: storagePath };
}

async function insertInteriorRecord(title, imageUrl) {
  const client = window.supabaseClient;
  const { data, error } = await client.from('interiors').insert([{ title, image_url: imageUrl }]);
  if (error) throw error;
  return data;
}

async function fetchInteriorsAdmin() {
  const client = window.supabaseClient;
  const { data, error } = await client.from('interiors').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function deleteInteriorRecord(id, imageUrl) {
  const client = window.supabaseClient;
  // try to remove storage object by extracting path after bucket
  try {
    const url = new URL(imageUrl);
    const idx = url.pathname.indexOf(`/${SUPABASE_BUCKET}/`);
    let path = '';
    if (idx !== -1) {
      path = url.pathname.slice(idx + SUPABASE_BUCKET.length + 2);
    } else {
      // fallback: try to find '/object/public/<bucket>/' pattern
      const parts = url.pathname.split('/');
      const bucketIndex = parts.indexOf(SUPABASE_BUCKET);
      if (bucketIndex !== -1) path = parts.slice(bucketIndex + 1).join('/');
    }
    if (path) {
      await client.storage.from(SUPABASE_BUCKET).remove([path]);
    }
  } catch (e) {
    console.warn('Could not derive storage path to remove object', e);
  }

  const { error } = await client.from('interiors').delete().eq('id', id);
  if (error) throw error;
}

function renderInteriorsAdmin(items) {
  const container = document.getElementById('interiorsGrid');
  if (!container) return;
  container.innerHTML = items.length ? items.map(i=>`
    <div class="border rounded p-3 bg-white">
      <img src="${i.image_url}" alt="${i.title}" class="h-40 w-full object-cover mb-2 rounded">
      <h4 class="font-semibold">${i.title}</h4>
      <p class="text-xs text-gray-500">${new Date(i.created_at).toLocaleString()}</p>
      <div class="flex gap-2 mt-3">
        <button class="px-3 py-1 bg-red-600 text-white rounded" onclick="handleDeleteInterior('${i.id}','${i.image_url}')">Delete</button>
      </div>
    </div>
  `).join('') : '<p class="text-gray-500">No interiors yet.</p>';
}

window.handleDeleteInterior = async function(id,image_url){
  if (!confirm('Delete this interior image?')) return;
  try {
    await deleteInteriorRecord(id,image_url);
    await loadAdminInteriors();
    alert('Deleted');
  } catch (e) {
    console.error(e);
    alert('Delete failed');
  }
}

async function loadAdminInteriors(){
  try {
    const items = await fetchInteriorsAdmin();
    renderInteriorsAdmin(items);
  } catch (e) {
    console.error(e);
    showToast('Failed to load interiors','error');
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  // login form
  const loginForm = document.getElementById('adminLoginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value.trim();
      try {
        const resp = await signInWithSupabase(email,password);
        const user = resp.data?.user || resp.user;
        if (user && user.email === ADMIN_EMAIL) {
          showAdminDashboard();
          // initialize admin UI
          initDashboardHandlers();
          mountDashboard();
        } else {
          showToast('Only admin allowed','error');
        }
      } catch (err) {
        console.error(err);
        showToast('Login failed','error');
      }
    });
  }

  // logout button override
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async ()=>{
      await signOutSupabase();
      showLoginCard();
    });
  }

  // check existing session
  (async ()=>{
    if (!window.supabaseClient) return;
    try {
      const { data } = await window.supabaseClient.auth.getUser();
      const user = data?.user;
      if (user && user.email === ADMIN_EMAIL) {
        showAdminDashboard();
        initDashboardHandlers();
        mountDashboard();
      } else {
        showLoginCard();
      }
    } catch (e) {
      console.warn('Auth check failed', e);
      showLoginCard();
    }
  })();
});
