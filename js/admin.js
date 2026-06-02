// Admin dashboard script
const ADMIN_USERNAME = 'Admin123@gmail.com';
const ADMIN_PASSWORD = 'Admin1234';

const adminState = {
  categories: ['Living Room','Office','Bedroom'],
  products: []
};

function readAdminState(){
  try {
    const cats = JSON.parse(localStorage.getItem('adminCategories'));
    const prods = JSON.parse(localStorage.getItem('adminProducts'));
    if (Array.isArray(cats)) adminState.categories = cats;
    if (Array.isArray(prods)) {
      adminState.products = prods.map(p => {
        const images = Array.isArray(p.images)
          ? p.images
          : (p.image ? [p.image] : ['img/placeholder.jpg']);
        return {
          ...p,
          images,
          image: Array.isArray(images) && images.length ? images[0] : 'img/placeholder.jpg'
        };
      });
    }
  } catch (err) {
    console.warn('Could not parse admin state from localStorage', err);
  }
}

function saveAdminState(){
  localStorage.setItem('adminCategories', JSON.stringify(adminState.categories));
  localStorage.setItem('adminProducts', JSON.stringify(adminState.products));
}

function $(sel){return document.querySelector(sel)}

let dashboardInitialized = false;

function initDashboardHandlers(){
  if (dashboardInitialized) return;
  dashboardInitialized = true;

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
    const files = Array.from($('#pImages').files || []);

    const images = files.length
      ? await Promise.all(files.map(fileToDataUrl))
      : ['img/placeholder.jpg'];

    if (!name) { showToast('Name is required','error'); return; }
    if (!price || price <= 0) { showToast('Enter a valid price','error'); return; }

    const product = {
      id: Date.now(),
      name,
      price,
      category,
      description: desc,
      images,
      image: images[0],
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

  // Export/Import handlers
  const exportBtn = $('#exportData');
  const importBtn = $('#importBtn');
  const importFile = $('#importFile');
  if (exportBtn) exportBtn.addEventListener('click', exportAdminData);
  if (importBtn && importFile) importBtn.addEventListener('click', ()=> importFile.click());
  if (importFile) importFile.addEventListener('change', (e)=>{
    const f = e.target.files[0];
    if (f) handleImportFile(f);
  });
}

function exportAdminData(){
  const data = { categories: adminState.categories, products: adminState.products };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'admin-data.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast('Exported admin data','success');
}

function handleImportFile(file){
  const reader = new FileReader();
  reader.onload = (e)=>{
    try{
      const parsed = JSON.parse(e.target.result);
      if (Array.isArray(parsed.categories) && Array.isArray(parsed.products)){
        adminState.categories = parsed.categories;
        adminState.products = parsed.products;
        saveAdminState();
        mountDashboard();
        showToast('Imported admin data','success');
      } else {
        showToast('Invalid import file','error');
      }
    } catch(err){
      showToast('Error importing file','error');
    }
  };
  reader.readAsText(file);
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = $('#adminLoginForm');
  const loginCard = $('#loginCard');
  const dashboard = $('#dashboard');

  readAdminState();

  // logout button
  $('#logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('adminAuth');
    window.location.href = 'index.html';
  });

  // if already authenticated
  if (localStorage.getItem('adminAuth') === 'true') {
    loginCard.classList.add('hidden');
    dashboard.classList.remove('hidden');
    initDashboardHandlers();
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
      initDashboardHandlers();
      mountDashboard();
    } else {
      showToast('Invalid credentials', 'error');
    }
  });
});

function mountDashboard(){
  const sel = $('#pCategory');
  if (sel) sel.innerHTML = adminState.categories.map(c=>`<option value="${c}">${c}</option>`).join('');
  renderCategories();
  renderProducts();
}

function fileToDataUrl(file){
  return new Promise((res,rej)=>{
    const reader = new FileReader();
    reader.onload = ()=>{
      const img = new Image();
      img.onload = ()=>{
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round(height * MAX_WIDTH / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round(width * MAX_HEIGHT / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        res(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = rej;
      img.src = reader.result;
    };
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
  grid.innerHTML = adminState.products.length ? adminState.products.map(p=>{
    const imageSrc = Array.isArray(p.images) && p.images.length ? p.images[0] : (p.image || 'img/placeholder.jpg');
    return `
      <div class="border rounded p-3 bg-white">
        <img src="${imageSrc}" alt="${p.name}" class="h-40 w-full object-cover mb-2 rounded">
        <h4 class="font-semibold">${p.name}</h4>
        <p class="text-sm text-gray-600">${p.category}</p>
        <p class="mt-2 text-amber-700 font-bold">₦${p.price.toLocaleString()}</p>
        <p class="text-sm mt-2">${p.description||''}</p>
        <div class="flex gap-2 mt-3">
          <button class="px-3 py-1 bg-amber-700 text-white rounded" onclick="showEditModal(${p.id})">Edit</button>
          <button class="px-3 py-1 bg-gray-200 rounded" onclick="deleteProduct(${p.id})">Delete</button>
        </div>
      </div>
    `;
  }).join('') : '<p class="text-gray-500">No products yet.</p>';
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

// preview for edit images
document.addEventListener('change', (e)=>{
  if (e.target && e.target.id === 'eImages'){
    const files = Array.from(e.target.files || []);
    const preview = document.getElementById('ePreview');
    if (!preview) return;
    if (!files.length) {
      preview.innerHTML = '';
      return;
    }
    Promise.all(files.map(fileToDataUrl)).then(urls => {
      preview.innerHTML = urls.map(url => `<img src="${url}" class="h-24 w-24 object-cover rounded">`).join('');
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

  const existingImages = Array.isArray(p.images) ? p.images : (p.image ? [p.image] : ['img/placeholder.jpg']);
  $('#ePreview').innerHTML = existingImages.map(img => `<img src="${img}" class="h-24 w-24 object-cover rounded">`).join('');

  const editForm = $('#editForm');
  const onSave = async (e)=>{
    e.preventDefault();
    const name = $('#eName').value.trim();
    const price = Number($('#ePrice').value);
    const category = $('#eCategory').value;
    const desc = $('#eDesc').value.trim();
    const files = Array.from($('#eImages').files || []);

    let images = existingImages;
    if (files.length) {
      images = await Promise.all(files.map(fileToDataUrl));
    }

    if (!name) { showToast('Name required','error'); return; }
    if (!price || price <= 0) { showToast('Invalid price','error'); return; }

    p.name = name;
    p.price = price;
    p.category = category;
    p.description = desc;
    p.images = images;
    p.image = images.length ? images[0] : 'img/placeholder.jpg';
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
window.showEditModal = showEditModal;
