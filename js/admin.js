// Admin dashboard script
const ADMIN_USERNAME = 'Admin123@gmail.com';
const ADMIN_PASSWORD = 'Admin1234';

const adminState = {
  categories: JSON.parse(localStorage.getItem('adminCategories')) || ['Living Room','Office','Bedroom'],
  products: JSON.parse(localStorage.getItem('adminProducts')) || []
};

function saveAdminState(){
  localStorage.setItem('adminCategories', JSON.stringify(adminState.categories));
  localStorage.setItem('adminProducts', JSON.stringify(adminState.products));
}

function $(sel){return document.querySelector(sel)}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = $('#adminLoginForm');
  const loginCard = $('#loginCard');
  const dashboard = $('#dashboard');

  // logout button
  $('#logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('adminAuth');
    window.location.href = 'index.html';
  });

  // if already authenticated
  if (localStorage.getItem('adminAuth') === 'true') {
    loginCard.classList.add('hidden');
    dashboard.classList.remove('hidden');
    mountDashboard();
  }

  loginForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const email = $('#loginEmail').value.trim();
    const password = $('#loginPassword').value.trim();
    if (email === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      localStorage.setItem('adminAuth','true');
      loginCard.classList.add('hidden');
      dashboard.classList.remove('hidden');
      mountDashboard();
    } else {
      showToast('Invalid credentials', 'error');
    }
  });
});

function mountDashboard(){
  // populate category select
  const sel = $('#pCategory');
  sel.innerHTML = adminState.categories.map(c=>`<option value="${c}">${c}</option>`).join('');

  // render category list
  renderCategories();
  renderProducts();

  // handlers
  $('#catForm').addEventListener('submit',(e)=>{
    e.preventDefault();
    const name = $('#catName').value.trim();
    if (!name) return;
    if (!adminState.categories.includes(name)) {
      adminState.categories.push(name);
      saveAdminState();
      $('#catName').value='';
      mountDashboard();
    }
  });

  $('#productForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const name = $('#pName').value.trim();
    const price = Number($('#pPrice').value);
    const category = $('#pCategory').value;
    const desc = $('#pDesc').value.trim();
    const file = $('#pImage').files[0];
    let image = '';
    if (file) {
      image = await fileToDataUrl(file);
    }

    // validation
    if (!name) { showToast('Name is required','error'); return; }
    if (!price || price <= 0) { showToast('Enter a valid price','error'); return; }

    const product = {
      id: Date.now(),
      name,
      price,
      category,
      description: desc,
      image: image || 'img/placeholder.jpg',
      inStock: true
    };

    adminState.products.push(product);
    saveAdminState();
    $('#productForm').reset();
    renderProducts();
    showToast('Product added','success');
  });

  $('#clearProducts').addEventListener('click', ()=>{
    if (!confirm('Clear all admin products?')) return;
    adminState.products = [];
    saveAdminState();
    renderProducts();
  });
}

function fileToDataUrl(file){
  return new Promise((res,rej)=>{
    const reader = new FileReader();
    reader.onload = ()=>res(reader.result);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

function renderCategories(){
  const container = $('#catList');
  container.innerHTML = adminState.categories.map(c=>`
    <div class="flex items-center justify-between border rounded px-3 py-2">
      <span>${c}</span>
      <button class="text-red-600" onclick="removeCategory('${c}')">Remove</button>
    </div>
  `).join('');
  // update select
  const sel = $('#pCategory');
  if (sel) sel.innerHTML = adminState.categories.map(c=>`<option value="${c}">${c}</option>`).join('');
}

function removeCategory(name){
  adminState.categories = adminState.categories.filter(c=>c!==name);
  saveAdminState();
  renderCategories();
}

function renderProducts(){
  const grid = $('#productsGrid');
  if (!grid) return;
  grid.innerHTML = adminState.products.length ? adminState.products.map(p=>`
    <div class="border rounded p-3 bg-white">
      <img src="${p.image}" alt="${p.name}" class="h-40 w-full object-cover mb-2 rounded">
      <h4 class="font-semibold">${p.name}</h4>
      <p class="text-sm text-gray-600">${p.category}</p>
      <p class="mt-2 text-amber-700 font-bold">$${p.price}</p>
      <p class="text-sm mt-2">${p.description||''}</p>
      <div class="flex gap-2 mt-3">
        <button class="px-3 py-1 bg-amber-700 text-white rounded" onclick="showEditModal(${p.id})">Edit</button>
        <button class="px-3 py-1 bg-gray-200 rounded" onclick="deleteProduct(${p.id})">Delete</button>
      </div>
    </div>
  `).join('') : '<p class="text-gray-500">No products yet.</p>';
}

// toast helper
function showToast(message, type='info'){
  const container = document.getElementById('adminToast');
  if (!container) { alert(message); return; }
  const el = document.createElement('div');
  el.className = 'px-4 py-2 rounded shadow';
  el.style.background = type === 'error' ? '#fecaca' : (type === 'success' ? '#bbf7d0' : '#e2e8f0');
  el.textContent = message;
  container.appendChild(el);
  setTimeout(()=>{ el.remove(); }, 3000);
}

// preview for edit image
document.addEventListener('change', (e)=>{
  if (e.target && e.target.id === 'eImage'){
    const file = e.target.files[0];
    if (!file) return;
    fileToDataUrl(file).then(url => {
      const preview = document.getElementById('ePreview');
      if (preview) preview.innerHTML = `<img src="${url}" class="h-40 object-cover rounded">`;
    });
  }
});

function deleteProduct(id){
  if (!confirm('Delete this product?')) return;
  adminState.products = adminState.products.filter(p=>p.id!==id);
  saveAdminState();
  renderProducts();
}

// Edit via modal
function showEditModal(id){
  const p = adminState.products.find(x=>x.id===id);
  if (!p) return;
  $('#editModal').classList.remove('hidden');
  $('#eName').value = p.name;
  $('#ePrice').value = p.price;
  $('#eCategory').innerHTML = adminState.categories.map(c=>`<option value="${c}">${c}</option>`).join('');
  $('#eCategory').value = p.category;
  $('#eDesc').value = p.description || '';
  $('#ePreview').innerHTML = `<img src="${p.image}" class="h-40 object-cover rounded">`;

  // attach submit handler
  const editForm = $('#editForm');
  const onSave = async (e)=>{
    e.preventDefault();
    const name = $('#eName').value.trim();
    const price = Number($('#ePrice').value);
    const category = $('#eCategory').value;
    const desc = $('#eDesc').value.trim();
    const file = $('#eImage').files[0];
    let image = p.image;
    if (file) image = await fileToDataUrl(file);

    if (!name) { showToast('Name required','error'); return; }
    if (!price || price <= 0) { showToast('Invalid price','error'); return; }

    p.name = name;
    p.price = price;
    p.category = category;
    p.description = desc;
    p.image = image;
    saveAdminState();
    renderProducts();
    showToast('Product updated','success');
    $('#editModal').classList.add('hidden');
    editForm.removeEventListener('submit', onSave);
  };

  editForm.addEventListener('submit', onSave);

  // cancel button
  $('#cancelEdit').onclick = ()=>{
    $('#editModal').classList.add('hidden');
    editForm.removeEventListener('submit', onSave);
  };
}

window.removeCategory = removeCategory;
window.deleteProduct = deleteProduct;
window.editProduct = editProduct;
