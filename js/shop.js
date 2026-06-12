// ================================================
// MOVÉ - Shop Page JavaScript
// Product Management & Enhanced Cart System
// ================================================

// PRODUCT DATABASE
function normalizeCategory(category) {
  const value = String(category || '').trim().toLowerCase();
  if (value.includes('living')) return 'living';
  if (value.includes('office')) return 'office';
  if (value.includes('bedroom')) return 'bedroom';
  return value.replace(/\s+/g, '-');
}

function normalizeStoredProduct(product) {
  const images = Array.isArray(product.images)
    ? product.images
    : (product.image ? [product.image] : ['img/hero.jpg']);

  return {
    id: product.id,
    name: product.name || 'New Product',
    price: Number(product.price) || 0,
    image: images[0] || 'img/hero.jpg',
    images,
    category: normalizeCategory(product.category || ''),
    rating: Number(product.rating) || 4.5,
    reviews: Number(product.reviews) || 0,
    description: product.description || product.name || 'New product from admin',
    inStock: product.inStock !== false,
  };
}

const defaultProducts = [
  {
    id: 1,
    name: 'Modern Comfort Sofa',
    price: 2499,
    image: 'img/img 1.jpg',
    category: 'living',
    rating: 4.8,
    reviews: 245,
    description: 'Premium upholstered sofa with deep seating and elegant design',
    inStock: true
  },
  {
    id: 2,
    name: 'Luxury Lounge Chair',
    price: 1299,
    image: 'img/img 2.jpg',
    category: 'living',
    rating: 4.9,
    reviews: 312,
    description: 'Mid-century modern lounge chair with premium leather',
    inStock: true
  },
  {
    id: 3,
    name: 'Executive Desk',
    price: 899,
    image: 'img/img 3.jpg',
    category: 'office',
    rating: 4.7,
    reviews: 189,
    description: 'Solid oak executive desk with storage',
    inStock: true
  },
  {
    id: 4,
    name: 'Marble Coffee Table',
    price: 599,
    image: 'img/img 4.jpg',
    category: 'living',
    rating: 4.6,
    reviews: 78,
    description: 'Elegant marble and walnut coffee table',
    inStock: true
  },
  {
    id: 5,
    name: 'Premium Bed Frame',
    price: 1899,
    image: 'img/img 5.jpg',
    category: 'bedroom',
    rating: 4.9,
    reviews: 203,
    description: 'King-size premium bed frame with upholstered headboard',
    inStock: true
  },
  {
    id: 6,
    name: 'Designer Storage Cabinet',
    price: 749,
    image: 'img/img 6.jpg',
    category: 'office',
    rating: 4.5,
    reviews: 92,
    description: 'Modern storage cabinet with clean lines and ample space',
    inStock: true
  },
];

let products = [...defaultProducts];

async function loadProducts() {
  products = [...defaultProducts];
  // also fetch interiors from Supabase and include as products (display-only)
  try {
    const interiors = typeof fetchInteriorsPublic === 'function' ? await fetchInteriorsPublic() : [];
    console.log('Loaded interiors', interiors);
    if (Array.isArray(interiors) && interiors.length) {
      const mapped = interiors.map(i => ({
        id: `i-${i.id}`,
        name: i.title || 'Interior',
        price: i.price != null ? Number(i.price) : undefined,
        image: i.image_url,
        images: [i.image_url],
        category: 'interior',
        rating: 5,
        reviews: 0,
        description: i.description || i.title || '',
        inStock: true
      }));
      products = [...products, ...mapped];
    }
  } catch (e) {
    console.warn('Failed to fetch public interiors', e);
  }

  if (currentFilter && currentFilter !== 'all') {
    filteredProducts = products.filter(p => p.category === currentFilter);
  } else {
    filteredProducts = [...products];
  }

  if (currentSort) {
    sortProducts(currentSort);
  } else {
    displayProducts(filteredProducts);
  }
}

// PERIODIC SYNC: Refetch products every 30 seconds to catch admin deletions/updates
let syncInterval;
function startProductSync() {
  syncInterval = setInterval(async () => {
    try {
      const interiors = typeof fetchInteriorsPublic === 'function' ? await fetchInteriorsPublic() : [];
      if (Array.isArray(interiors)) {
        // Rebuild products with fresh interiors
        const mapped = interiors.map(i => ({
          id: `i-${i.id}`,
          name: i.title || 'Interior',
          price: i.price != null ? Number(i.price) : undefined,
          image: i.image_url,
          images: [i.image_url],
          category: 'interior',
          rating: 5,
          reviews: 0,
          description: i.description || i.title || '',
          inStock: true
        }));
        
        // Keep defaultProducts but replace interiors with fresh ones
        products = [...defaultProducts, ...mapped];
        
        // Re-apply current filter and sort
        if (currentFilter && currentFilter !== 'all') {
          filteredProducts = products.filter(p => p.category === currentFilter);
        } else {
          filteredProducts = [...products];
        }
        
        if (currentSort) {
          sortProducts(currentSort);
        } else {
          displayProducts(filteredProducts);
        }
      }
    } catch (e) {
      console.warn('Periodic sync failed', e);
    }
  }, 30000); // Refetch every 30 seconds
}

// STATE
let filteredProducts = [...products];
let currentFilter = 'all';
let currentSort = '';

// INITIALIZE
document.addEventListener('DOMContentLoaded', () => {
  initializeCart();
  displayProducts(products);
  loadProducts();
  startProductSync();
  setupEventListeners();
});

// DISPLAY PRODUCTS
function displayProducts(productsToDisplay) {
  const grid = document.getElementById('productsGrid');
  const noResults = document.getElementById('noResults');
  
  if (productsToDisplay.length === 0) {
    grid.innerHTML = '';
    noResults.classList.remove('hidden');
    return;
  }

  noResults.classList.add('hidden');
  
  grid.innerHTML = productsToDisplay.map(product => {
    const imageSrc = Array.isArray(product.images) && product.images.length ? product.images[0] : product.image;
    return `
      <div class="product-card group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl smooth-transition">
        <!-- Product Image -->
        <div class="relative h-80 overflow-hidden bg-gradient-to-br from-stone-100 to-amber-50">
          <img 
            src="${imageSrc}"
            alt="${product.name}" 
            class="w-full h-full object-cover group-hover:scale-105 smooth-transition"
            onerror="this.src='img/hero.jpg'"
          >
          <div class="absolute top-4 right-4 flex flex-col gap-2">
            ${product.rating >= 4.8 ? '<span class="bg-amber-600 text-white px-3 py-1 rounded-full text-xs font-semibold">Best Seller</span>' : ''}
            ${!product.inStock ? '<span class="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Out of Stock</span>' : ''}
          </div>
        </div>

        <!-- Product Info -->
        <div class="p-6">
          <h3 class="serif text-xl font-bold text-stone-900 mb-2">${product.name}</h3>
          <p class="text-sm text-gray-600 mb-4">${product.description}</p>
          
          <!-- Rating -->
          <div class="flex items-center gap-2 mb-4">
            <div class="flex gap-1">
              ${'⭐'.repeat(Math.floor(product.rating))}
            </div>
            <span class="text-xs text-gray-600">${product.rating} (${product.reviews} reviews)</span>
          </div>

          <!-- Price -->
          <div class="flex justify-between items-center mb-4">
            <span class="text-2xl font-bold text-amber-700">${product.price != null ? `₦${Number(product.price).toLocaleString()}` : 'No price set'}</span>
            <span class="text-xs font-semibold text-green-600">${product.inStock ? 'In Stock' : 'Coming Soon'}</span>
          </div>

          <!-- Add to Cart Button -->
          <button 
            onclick="addProductToCart('${product.id}')"
            ${product.inStock ? '' : 'disabled'}
            class="w-full py-3 bg-amber-700 text-white rounded-lg font-semibold hover:bg-amber-800 smooth-transition ${!product.inStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}"
          >
            ${product.inStock ? 'Add to Cart →' : 'Coming Soon'}
          </button>

          <!-- Quick View -->
          <button 
            onclick="openProductDetail('${product.id}')"
            class="w-full mt-2 py-2 border-2 border-amber-700 text-amber-700 rounded-lg font-medium hover:bg-amber-50 smooth-transition"
          >
            Quick View
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// FILTER PRODUCTS
function filterProducts(category, element) {
  currentFilter = category;
  
  // Update button styles
  document.querySelectorAll('button[onclick*="filterProducts"]').forEach(btn => {
    btn.classList.remove('bg-amber-700', 'text-white', 'border-amber-700');
    btn.classList.add('bg-white', 'border-2', 'border-amber-700', 'text-amber-700');
  });
  if (element) {
    element.classList.add('bg-amber-700', 'text-white');
    element.classList.remove('bg-white', 'border-2', 'border-amber-700', 'text-amber-700');
  }

  if (category === 'all') {
    filteredProducts = [...products];
  } else {
    filteredProducts = products.filter(p => p.category === category);
  }
  
  displayProducts(filteredProducts);
}

// SORT PRODUCTS
function sortProducts(sortType) {
  let sorted = [...filteredProducts];

  switch(sortType) {
    case 'price-low':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'newest':
      sorted.reverse();
      break;
    case 'popular':
      sorted.sort((a, b) => b.rating - a.rating);
      break;
  }

  currentSort = sortType;
  displayProducts(sorted);
}

// CART SYSTEM
class Cart {
  constructor() {
    this.items = JSON.parse(localStorage.getItem('moveCart')) || [];
    this.updateCartCount();
  }

  addItem(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = this.items.find(item => item.id === productId);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1
      });
    }
    
    this.save();
    this.updateCartCount();
    this.showNotification(`${product.name} added to cart!`);
    openCartModal();
  }

  removeItem(productId) {
    this.items = this.items.filter(item => item.id !== productId);
    this.save();
    this.updateCartCount();
    this.showNotification('Item removed from cart');
  }

  updateQuantity(productId, quantity) {
    const item = this.items.find(item => item.id === productId);
    if (item) {
      if (quantity <= 0) {
        this.removeItem(productId);
      } else {
        item.quantity = quantity;
        this.save();
        this.updateCartCount();
      }
    }
  }

  save() {
    localStorage.setItem('moveCart', JSON.stringify(this.items));
  }

  updateCartCount() {
    const count = this.items.reduce((total, item) => total + item.quantity, 0);
    const badge = document.querySelector('.cart-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  }

  getTotal() {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getItemCount() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${message}</span>
        <button class="notification-close">✕</button>
      </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    });

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

let cart;

// INITIALIZE CART
function initializeCart() {
  cart = new Cart();
}

// ADD PRODUCT TO CART
function addProductToCart(productId) {
  cart.addItem(productId);
}

// OPEN CART MODAL
function openCartModal() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'cartModal';
  
  const cartHTML = cart.items.length > 0 ? `
    <div class="cart-items">
      ${cart.items.map(item => `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.name}" class="w-20 h-20 object-cover rounded">
          <div class="cart-item-info">
            <strong>${item.name}</strong>
            <span class="text-amber-700 font-semibold">₦${item.price.toLocaleString()}</span>
          </div>
          <div class="cart-item-quantity">
            <button onclick="cart.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
            <span>${item.quantity}</span>
            <button onclick="cart.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
          </div>
          <button class="cart-item-remove" onclick="cart.removeItem(${item.id}); openCartModal();">✕</button>
        </div>
      `).join('')}
    </div>
    <div class="cart-summary">
      <div class="summary-row">
        <span>Subtotal:</span>
        <span>₦${cart.getTotal().toFixed(2)}</span>
      </div>
      <div class="summary-row">
        <span>Shipping:</span>
        <span>₦50.00</span>
      </div>
      <div class="summary-row font-bold text-lg border-t pt-2 mt-2">
        <span>Total:</span>
        <span class="text-amber-700">₦${(cart.getTotal() + 50).toFixed(2)}</span>
      </div>
    </div>
    <button class="w-full mt-4 py-3 bg-amber-700 text-white rounded-lg font-semibold hover:bg-amber-800 smooth-transition">
      Proceed to Checkout →
    </button>
    <button class="w-full mt-2 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 smooth-transition" onclick="document.getElementById('cartModal').remove()">
      Continue Shopping
    </button>
  ` : `
    <div style="text-align: center; padding: 3rem 0;">
      <p style="font-size: 3rem; margin-bottom: 1rem;">🛒</p>
      <p style="font-size: 1.25rem; color: #78716b; margin-bottom: 1.5rem;">Your cart is empty</p>
      <p style="color: #78716b; margin-bottom: 2rem;">Add some beautiful furniture to get started!</p>
      <button class="w-full py-3 bg-amber-700 text-white rounded-lg font-semibold hover:bg-amber-800 smooth-transition" onclick="document.getElementById('cartModal').remove()">
        Start Shopping →
      </button>
    </div>
  `;

  modal.innerHTML = `
    <div class="modal-content cart-modal">
      <button class="modal-close">✕</button>
      <h2 class="serif text-3xl font-bold mb-6">Shopping Cart</h2>
      <p class="text-sm text-gray-600 mb-4">${cart.items.length} item${cart.items.length !== 1 ? 's' : ''}</p>
      ${cartHTML}
    </div>
  `;

  document.body.appendChild(modal);
  modal.style.display = 'flex';

  const closeBtn = modal.querySelector('.modal-close');
  closeBtn.addEventListener('click', () => modal.remove());

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

// OPEN SEARCH MODAL
function openSearchModal() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content search-modal">
      <button class="modal-close">✕</button>
      <input type="text" placeholder="Search products..." class="search-input" autofocus>
      <div class="search-results"></div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.style.display = 'flex';
  
  const closeBtn = modal.querySelector('.modal-close');
  closeBtn.addEventListener('click', () => modal.remove());

  const input = modal.querySelector('.search-input');
  const results = modal.querySelector('.search-results');

  input.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    if (query.length > 0) {
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query)
      );
      results.innerHTML = filtered.map(p => `
        <div class="search-result-item" onclick="cart.addItem('${p.id}'); document.querySelector('.modal')?.remove();">
          <img src="${p.image}" alt="${p.name}" class="w-16 h-16 object-cover rounded">
          <div style="flex: 1;">
            <strong>${p.name}</strong>
            <p style="color: #78716b; font-size: 0.875rem;">${p.description}</p>
          </div>
          <span class="text-amber-700 font-bold">₦${p.price.toLocaleString()}</span>
        </div>
      `).join('');
    } else {
      results.innerHTML = '';
    }
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

// OPEN PRODUCT DETAIL
function openProductDetail(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const images = Array.isArray(product.images) && product.images.length ? product.images : [product.image];
  const gallery = images.length > 1 ? images.map((img, idx) => `
      <button type="button" class="product-thumb ${idx===0 ? 'active' : ''}" data-index="${idx}" data-src="${img}" onclick="switchProductDetailImage(this)">
        <img src="${img}" alt="${product.name} ${idx+1}" class="h-20 w-20 object-cover rounded-lg">
      </button>
    `).join('') : '';

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content product-detail" data-image-count="${images.length}">
      <button class="modal-close">✕</button>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 1rem;">
        <div class="product-detail-image-wrap">
          <img src="${images[0]}" alt="${product.name}" class="w-full rounded-2xl object-cover product-detail-main-image" style="aspect-ratio: 1;">
          <button class="detail-arrow detail-arrow-left" type="button">‹</button>
          <button class="detail-arrow detail-arrow-right" type="button">›</button>
          <p class="product-detail-caption">Image 1 of ${images.length}</p>
          ${gallery ? `<div class="mt-4 grid grid-cols-4 gap-2">${gallery}</div>` : ''}
        </div>
        <div>
          <h2 class="serif text-3xl font-bold mb-2">${product.name}</h2>
          <div class="flex items-center gap-2 mb-4">
            <div class="flex gap-1">
              ${'⭐'.repeat(Math.floor(product.rating))}
            </div>
            <span style="font-size: 0.875rem; color: #78716b;">${product.rating} (${product.reviews} reviews)</span>
          </div>
          <p style="font-size: 2.25rem; color: #b45309; font-weight: bold; margin-bottom: 1rem;">${product.price != null ? `₦${Number(product.price).toLocaleString()}` : 'No price set'}</p>
          <p style="color: #78716b; line-height: 1.7; margin-bottom: 2rem;">${product.description}</p>
          <button 
            onclick="cart.addItem(${product.id}); document.querySelector('.modal')?.remove();"
            class="w-full py-4 bg-amber-700 text-white rounded-lg font-semibold hover:bg-amber-800 smooth-transition mb-2"
          >
            Add to Cart →
          </button>
          <button 
            onclick="document.querySelector('.modal')?.remove();"
            class="w-full py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 smooth-transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.style.display = 'flex';

  const closeBtn = modal.querySelector('.modal-close');
  closeBtn.addEventListener('click', () => modal.remove());

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  const mainImage = modal.querySelector('.product-detail-main-image');
  let touchStartX = 0;
  let touchEndX = 0;

  mainImage.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, false);

  mainImage.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe(touchStartX, touchEndX, modal);
  }, false);

  const leftArrow = modal.querySelector('.detail-arrow-left');
  const rightArrow = modal.querySelector('.detail-arrow-right');
  if (leftArrow) leftArrow.addEventListener('click', () => changeProductDetailImage('prev', modal));
  if (rightArrow) rightArrow.addEventListener('click', () => changeProductDetailImage('next', modal));
}

function handleSwipe(startX, endX, modal) {
  const swipeThreshold = 50;
  const diff = startX - endX;

  if (Math.abs(diff) < swipeThreshold) return;
  const direction = diff > 0 ? 'next' : 'prev';
  changeProductDetailImage(direction, modal);
}

function changeProductDetailImage(direction, modal) {
  const thumbnails = Array.from(modal.querySelectorAll('.product-thumb'));
  if (!thumbnails.length) return;

  const activeIndex = thumbnails.findIndex(btn => btn.classList.contains('active'));
  const currentIndex = activeIndex >= 0 ? activeIndex : 0;
  const nextIndex = direction === 'next'
    ? (currentIndex + 1) % thumbnails.length
    : (currentIndex - 1 + thumbnails.length) % thumbnails.length;

  const nextButton = thumbnails[nextIndex];
  if (!nextButton) return;
  switchProductDetailImage(nextButton);
}

window.handleSwipe = handleSwipe;

function switchProductDetailImage(button) {
  const src = button.dataset.src;
  const modal = button.closest('.modal');
  if (!modal) return;
  modal.querySelector('.product-detail-main-image').src = src;
  modal.querySelectorAll('.product-thumb').forEach(btn => btn.classList.remove('active'));
  button.classList.add('active');

  const caption = modal.querySelector('.product-detail-caption');
  const index = Number(button.dataset.index || 0);
  if (caption) {
    caption.textContent = `Image ${index + 1} of ${modal.querySelectorAll('.product-thumb').length}`;
  }
}

window.switchProductDetailImage = switchProductDetailImage;

// EVENT LISTENERS
function setupEventListeners() {
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal').forEach(m => m.remove());
    }
  });
}

// ADD STYLES
const styles = document.createElement('style');
styles.textContent = `
  .modal {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
    padding: 1rem;
  }

  .modal-content {
    background: white;
    border-radius: 1.5rem;
    padding: 2rem;
    max-width: 600px;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
    animation: slideUp 0.3s ease;
    position: relative;
  }

  .product-detail {
    max-width: 1000px;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .modal-close {
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    background: none;
    border: none;
    font-size: 2rem;
    cursor: pointer;
    padding: 0;
    color: #78716b;
    transition: color 0.2s;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-close:hover {
    color: #292524;
  }

  .product-detail-image-wrap {
    position: relative;
  }

  .product-detail-main-image {
    touch-action: pan-y;
    user-select: none;
    cursor: grab;
    transition: opacity 0.2s ease;
  }

  .product-detail-main-image:active {
    cursor: grabbing;
  }

  .product-detail-caption {
    position: absolute;
    bottom: 0.75rem;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255,255,255,0.95);
    color: #292524;
    padding: 0.5rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 600;
    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
    z-index: 5;
  }

  .detail-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 9999px;
    background: rgba(255,255,255,0.9);
    border: none;
    color: #292524;
    font-size: 1.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 25px rgba(0,0,0,0.12);
    transition: transform 0.2s, background 0.2s;
    z-index: 5;
  }

  .detail-arrow:hover {
    transform: translateY(-50%) scale(1.05);
    background: #ffffff;
  }

  .detail-arrow-left {
    left: 0.75rem;
  }

  .detail-arrow-right {
    right: 0.75rem;
  }

  .product-thumb {
    border: 2px solid transparent;
    padding: 0.2rem;
    border-radius: 1rem;
    background: #f8f5f1;
    transition: border-color 0.2s, transform 0.2s;
  }

  .product-thumb.active {
    border-color: #f59e0b;
    transform: scale(1.02);
  }

  .product-thumb:hover {
    border-color: #f59e0b;
  }

  .search-input {
    width: 100%;
    padding: 1rem;
    border: 2px solid #e7e5e4;
    border-radius: 0.75rem;
    font-size: 1rem;
    margin-bottom: 1rem;
    transition: border-color 0.3s;
  }

  .search-input:focus {
    outline: none;
    border-color: #b45309;
  }

  .search-results {
    max-height: 400px;
    overflow-y: auto;
  }

  .search-result-item {
    padding: 1rem;
    border-bottom: 1px solid #e7e5e4;
    cursor: pointer;
    transition: background 0.2s;
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .search-result-item:hover {
    background: #f5efe6;
  }

  .cart-items {
    max-height: 400px;
    overflow-y: auto;
    margin-bottom: 1.5rem;
  }

  .cart-item {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    border-bottom: 1px solid #e7e5e4;
    align-items: center;
  }

  .cart-item-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .cart-item-info span {
    color: #b45309;
    font-weight: 600;
  }

  .cart-item-quantity {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border: 1px solid #e7e5e4;
    border-radius: 0.5rem;
    padding: 0.25rem;
  }

  .cart-item-quantity button {
    padding: 0.35rem 0.65rem;
    border: none;
    background: none;
    cursor: pointer;
    color: #b45309;
    font-weight: 600;
  }

  .cart-item-remove {
    background: none;
    border: none;
    color: #dc2626;
    cursor: pointer;
    font-size: 1.25rem;
    padding: 0;
  }

  .cart-summary {
    background: #f5efe6;
    padding: 1.5rem;
    border-radius: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }

  .notification {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background: #16a34a;
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 0.75rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 2000;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s ease;
  }

  .notification.show {
    opacity: 1;
    transform: translateY(0);
  }

  .notification-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .notification-close {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    font-size: 1.25rem;
    padding: 0;
  }

  @media (max-width: 768px) {
    .modal-content {
      max-width: 90%;
      max-height: 90vh;
    }

    .product-detail {
      display: block;
    }

    .notification {
      bottom: 1rem;
      right: 1rem;
    }
  }
`;

document.head.appendChild(styles);

// DARK MODE THEME TOGGLE
function toggleTheme() {
  const body = document.body;
  const themeToggle = document.getElementById('theme-toggle');
  
  // Toggle dark mode class
  body.classList.toggle('dark-mode');
  
  // Update toggle icon
  if (body.classList.contains('dark-mode')) {
    themeToggle.textContent = '🌙';
    localStorage.setItem('theme', 'dark');
  } else {
    themeToggle.textContent = '☀️';
    localStorage.setItem('theme', 'light');
  }
}

// Initialize theme on page load
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;
  
  if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    if (themeToggle) themeToggle.textContent = '🌙';
  } else {
    body.classList.remove('dark-mode');
    if (themeToggle) themeToggle.textContent = '☀️';
  }
}

// EXPORT FOR GLOBAL USE
window.toggleTheme = toggleTheme;
window.initializeTheme = initializeTheme;

// Initialize theme when DOM is ready
document.addEventListener('DOMContentLoaded', initializeTheme);

console.log('Shop Page Loaded ✓');
