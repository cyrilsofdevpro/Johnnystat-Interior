// Client-side authentication (localStorage). Not for production.
async function hashPassword(password){
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(password));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

function getUsers(){
  return JSON.parse(localStorage.getItem('siteUsers')||'[]');
}

function saveUsers(users){
  localStorage.setItem('siteUsers', JSON.stringify(users));
}

async function createUser(name, email, password){
  email = (email||'').trim().toLowerCase();
  if (!email || !password) throw 'Provide email and password';
  const users = getUsers();
  if (users.find(u=>u.email===email)) throw 'Email already registered';
  const pwHash = await hashPassword(password);
  const user = { id: Date.now(), name: name||email.split('@')[0], email, passwordHash: pwHash, createdAt: new Date().toISOString() };
  users.push(user);
  saveUsers(users);
  setCurrentUser(user);
  return user;
}

async function loginUser(email, password){
  email = (email||'').trim().toLowerCase();
  const users = getUsers();
  const user = users.find(u=>u.email===email);
  if (!user) throw 'No account for this email';
  const pwHash = await hashPassword(password);
  if (pwHash !== user.passwordHash) throw 'Invalid credentials';
  setCurrentUser(user);
  return user;
}

function setCurrentUser(user){
  if (!user) return localStorage.removeItem('currentUser');
  const safe = { id: user.id, name: user.name, email: user.email };
  localStorage.setItem('currentUser', JSON.stringify(safe));
  updateNavAuth();
}

function logoutUser(){
  localStorage.removeItem('currentUser');
  updateNavAuth();
}

function getCurrentUser(){
  try { return JSON.parse(localStorage.getItem('currentUser')||'null'); } catch(e){ return null; }
}

function showToastFallback(message, type){
  if (window.showToast) return window.showToast(message, type);
  if (window.cart && typeof window.cart.showNotification === 'function') return window.cart.showNotification(message);
  alert(message);
}

function updateNavAuth(){
  const u = getCurrentUser();
  const container = document.getElementById('authContainer');
  if (!container) return;
  if (u) {
    container.innerHTML = `<span class="mr-3 text-sm">Hi, ${u.name}</span><button id="signoutBtn" class="px-3 py-1 bg-white border border-amber-700 text-amber-700 rounded">Logout</button>`;
    const btn = document.getElementById('signoutBtn');
    if (btn) btn.addEventListener('click', ()=>{ logoutUser(); showToastFallback('Signed out','info'); });
  } else {
    container.innerHTML = `<button id="openAuthBtn" class="px-3 py-1 bg-amber-700 text-white rounded">Sign in</button>`;
    const btn = document.getElementById('openAuthBtn');
    if (btn) btn.addEventListener('click', openAuthModal);
  }
}

function openAuthModal(){
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', ()=>{
  updateNavAuth();
  const modal = document.getElementById('authModal');
  if (!modal) return;
  const close = modal.querySelector('#authClose');
  if (close) close.addEventListener('click', ()=> modal.classList.add('hidden'));

  // switch links
  const toSignup = modal.querySelector('#switchToSignup');
  const toLogin = modal.querySelector('#switchToLogin');
  if (toSignup) toSignup.addEventListener('click', ()=>{ modal.querySelector('#loginForm').classList.add('hidden'); modal.querySelector('#signupForm').classList.remove('hidden'); });
  if (toLogin) toLogin.addEventListener('click', ()=>{ modal.querySelector('#signupForm').classList.add('hidden'); modal.querySelector('#loginForm').classList.remove('hidden'); });

  // signup
  const signupForm = modal.querySelector('#signupForm');
  if (signupForm) signupForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const name = modal.querySelector('#suName').value.trim();
    const email = modal.querySelector('#suEmail').value.trim();
    const pw = modal.querySelector('#suPassword').value;
    try { await createUser(name, email, pw); modal.classList.add('hidden'); showToastFallback('Account created','success'); } catch(err){ showToastFallback(String(err),'error'); }
  });

  // login
  const loginForm = modal.querySelector('#loginForm');
  if (loginForm) loginForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const email = modal.querySelector('#liEmail').value.trim();
    const pw = modal.querySelector('#liPassword').value;
    try { await loginUser(email, pw); modal.classList.add('hidden'); showToastFallback('Signed in','success'); } catch(err){ showToastFallback(String(err),'error'); }
  });
});

window.openAuthModal = openAuthModal;
window.getCurrentUser = getCurrentUser;
window.logoutUser = logoutUser;
