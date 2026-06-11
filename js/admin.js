// Admin dashboard script
const adminState = {
  categories: ['Living Room','Office','Bedroom'],
  products: []
};

function getSupabaseClient() {
  if (!window.supabaseClient) throw new Error('Supabase client not initialized. Fill js/supabase-config.js and include js/supabase-client.js.');
  return window.supabaseClient;
}

async function uploadFileToSupabase(file) {
  const client = getSupabaseClient();
  const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
  const path = filename;
  const { data, error } = await client.storage.from(SUPABASE_BUCKET).upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;

  const { data: urlData, error: urlError } = client.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
  if (urlError) throw urlError;
  return urlData.publicUrl;
}

async function uploadFilesToSupabase(files) {
  if (!files.length) return [];
  return await Promise.all(files.map(uploadFileToSupabase));
}

function normalizeServerProduct(product){
  const images = Array.isArray(product.images)
    ? product.images
    : (product.image ? [product.image] : ['img/placeholder.jpg']);

  return {
    ...product,
    id: product.id || Date.now(),
    images,
    image: Array.isArray(images) && images.length ? images[0] : (product.image || 'img/placeholder.jpg')
  };
}

async function saveProductToSupabase(product) {
  const client = getSupabaseClient();
  const { data, error } = await client.from('interiors').insert([
    {
      title: product.name,
      image_url: product.image,
      price: Number(product.price)
    }
  ]);
  if (error) throw error;
  return data && data[0];
}

async function readAdminState(){
  try {
    const cats = JSON.parse(localStorage.getItem('adminCategories'));
    if (Array.isArray(cats)) adminState.categories = cats;
  } catch (err) {
    console.warn('Could not parse admin categories from localStorage', err);
  }

  try {
    const prods = JSON.parse(localStorage.getItem('adminProducts'));
    if (Array.isArray(prods)) {
      adminState.products = prods.map(normalizeServerProduct);
    }
  } catch (err) {
    console.warn('Could not load admin products from localStorage', err);
  }
}

function saveAdminState(){
  try {
    localStorage.setItem('adminCategories', JSON.stringify(adminState.categories));
    localStorage.setItem('adminProducts', JSON.stringify(adminState.products));
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      showToast('Storage full. Please delete old products and try again.', 'error');
    } else {
      showToast('Error saving data: ' + err.message, 'error');
    }
  }
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

    let images;
    try {
      images = files.length ? await uploadFilesToSupabase(files) : ['img/placeholder.jpg'];
    } catch (uploadErr) {
      console.error(uploadErr);
      showToast('Image upload failed. Please check Supabase configuration and try again.', 'error');
      return;
    }

    if (!name) { showToast('Name is required','error'); return; }
    if (!price || price <= 0) { showToast('Enter a valid price','error'); return; }

    const product = {
      name,
      price,
      category,
      description: desc,
      images,
      image: images[0],
      inStock: true
    };

    try {
      const savedRecord = await saveProductToSupabase(product);
      product.id = savedRecord && savedRecord.id ? savedRecord.id : Date.now();
      adminState.products.push(normalizeServerProduct(product));
      saveAdminState();
      $('#productForm').reset();
      renderProducts();
      showToast('Product added','success');
    } catch (err) {
      console.error(err);
      showToast('Unable to save product to Supabase','error');
    }
  });

  $('#clearProducts').addEventListener('click', ()=>{
    if (!confirm('Clear all admin products?')) return;
    adminState.products = [];
    saveAdminState();
    renderProducts();
    showToast('All products cleared','success');
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
  reader.onload = async (e)=>{
    try{
      const parsed = JSON.parse(e.target.result);
      if (Array.isArray(parsed.categories) && Array.isArray(parsed.products)){
        adminState.categories = parsed.categories;
        adminState.products = parsed.products.map(normalizeServerProduct);
        saveAdminState();
        mountDashboard();
        showToast('Imported admin data','success');
      } else {
        showToast('Invalid import file','error');
      }
    } catch(err){
      console.error(err);
      showToast('Error importing file','error');
    }
  };
  reader.readAsText(file);
}

document.addEventListener('DOMContentLoaded', async () => {
  await readAdminState();
  // initial render; actual auth (show/hide dashboard) handled by supabase-interiors.js
  renderCategories();
  renderProducts();
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
        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 500;
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
        res(canvas.toDataURL('image/jpeg', 0.5));
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

async function deleteProduct(id){
  if (!confirm('Delete this product?')) return;
  adminState.products = adminState.products.filter(p=>p.id!==id);
  saveAdminState();
  renderProducts();
  showToast('Product deleted','success');
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
      try {
        images = await uploadFilesToSupabase(files);
      } catch (uploadErr) {
        console.error(uploadErr);
        showToast('Image upload failed. Please check Supabase configuration and try again.', 'error');
        return;
      }
    }

    if (!name) { showToast('Name required','error'); return; }
    if (!price || price <= 0) { showToast('Invalid price','error'); return; }

    p.name = name;
    p.price = price;
    p.category = category;
    p.description = desc;
    p.images = images;
    p.image = images.length ? images[0] : 'img/placeholder.jpg';

    const normalized = normalizeServerProduct(p);
    const index = adminState.products.findIndex(item => item.id === normalized.id);
    if (index !== -1) {
      adminState.products[index] = normalized;
    }
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
