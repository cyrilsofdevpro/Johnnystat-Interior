// ================================================
// MOVÉ - Premium Interior & Furniture Website
// JavaScript - Interactive Features & Functionality
// ================================================

// STATE MANAGEMENT
const state = {
  cart: [],
  cartCount: 0,
  favorites: [],
  isMenuOpen: false,
  currentPage: 'home',
};

const adminState = {
  categories: [],
  products: []
};

const homepageFeaturedDefaults = [
  {
    id: 1,
    name: 'Modern Comfort Sofa',
    price: 2499,
    image: 'img/img 1.jpg',
    description: 'Premium upholstered sofa with deep seating and elegant design',
    rating: 4.8,
    reviews: 245,
    badge: 'Best Seller'
  },
  {
    id: 2,
    name: 'Luxury Lounge Chair',
    price: 1299,
    image: 'img/img 2.jpg',
    description: 'Mid-century modern lounge chair with premium leather',
    rating: 4.9,
    reviews: 312,
    badge: 'Trending'
  },
  {
    id: 3,
    name: 'Executive Desk',
    price: 899,
    image: 'img/img 3.jpg',
    description: 'Solid oak executive desk with storage',
    rating: 4.7,
    reviews: 189,
    badge: '-20%'
  },
  {
    id: 4,
    name: 'Marble Coffee Table',
    price: 599,
    image: 'img/img 4.jpg',
    description: 'Elegant marble and walnut coffee table',
    rating: 4.6,
    reviews: 78,
    badge: 'New'
  }
];

// Admin moved to separate admin.html / js/admin.js

// CART MANAGEMENT
class Cart {
  constructor() {
    this.items = JSON.parse(localStorage.getItem('moveCart')) || [];
    this.updateCartCount();
  }

  addItem(product) {
    const existingItem = this.items.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.items.push({ ...product, quantity: 1 });
    }
    
    this.save();
    this.updateCartCount();
    this.showNotification(`${product.name} added to cart!`);
  }

  removeItem(productId) {
    this.items = this.items.filter(item => item.id !== productId);
    this.save();
    this.updateCartCount();
  }

  updateQuantity(productId, quantity) {
    const item = this.items.find(item => item.id === productId);
    if (item) {
      item.quantity = Math.max(1, quantity);
      this.save();
      this.updateCartCount();
    }
  }

  save() {
    localStorage.setItem('moveCart', JSON.stringify(this.items));
  }

  updateCartCount() {
    state.cartCount = this.items.reduce((total, item) => total + item.quantity, 0);
    this.updateCartBadge();
  }

  updateCartBadge() {
    const badge = document.querySelector('.cart-badge');
    if (badge) {
      badge.textContent = state.cartCount;
      badge.style.display = state.cartCount > 0 ? 'flex' : 'none';
    }
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

  getTotal() {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
}

// INITIALIZE CART
const cart = new Cart();

// EVENT LISTENERS
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  addAnimationsToElements();
  loadSampleProducts();
  renderHomeNewPicks();
  renderAdminLists();
  ensureAdminVisibility();
});

function initializeEventListeners() {
  // Add to cart buttons
  document.addEventListener('click', (e) => {
    if (e.target.textContent.includes('Add →')) {
      const productCard = e.target.closest('.group, .product-card');
      if (productCard) {
        const productName = productCard.querySelector('h3')?.textContent || 'Product';
        const productPrice = parseFloat(productCard.querySelector('.text-amber-700')?.textContent.replace(/[^0-9.-]/g, '') || 0);
        
        const product = {
          id: Date.now(),
          name: productName,
          price: productPrice,
          image: 'img/hero.jpg'
        };
        
        cart.addItem(product);
        
        // Add animation
        const button = e.target;
        button.textContent = '✓ Added';
        button.style.background = '#16a34a';
        setTimeout(() => {
          button.textContent = 'Add →';
          button.style.background = '';
        }, 2000);
      }
    }

    // Category/Collection navigation
    if (e.target.closest('.category-arrow, .collection-link')) {
      console.log('Navigate to category/collection');
    }
  });

  // Admin form submissions
  document.addEventListener('submit', handleAdminFormSubmit);

  // Search functionality
  const searchIcon = document.querySelector('span:has-text("🔍")');
  if (searchIcon) {
    searchIcon.addEventListener('click', () => {
      openSearchModal();
    });
  }

  // Cart icon click
  const cartIcon = document.querySelector('span:has-text("🛒")');
  if (cartIcon) {
    cartIcon.addEventListener('click', () => {
      openCartModal();
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Navigation hover effects
  const navLinks = document.querySelectorAll('nav ul li');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      navLinks.forEach(l => l.style.color = 'inherit');
      e.target.style.color = '#b45309';
    });
  });
}

// ADD ANIMATIONS TO ELEMENTS
function addAnimationsToElements() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'fadeIn 0.8s ease-in forwards';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  // Observe cards and sections
  document.querySelectorAll('.card, .product-card, .testimonial-card, .category-card').forEach((el) => {
    el.style.opacity = '0';
    observer.observe(el);
  });
}

// LOAD SAMPLE PRODUCTS
function loadSampleProducts() {
  const storedProducts = JSON.parse(localStorage.getItem('adminProducts')) || [];
  adminState.products = Array.isArray(storedProducts) ? storedProducts : [];
  window.products = [...adminState.products];
}

// Listen for admin updates coming from other tabs/windows (storage events)
window.addEventListener('storage', (e) => {
  if (e.key === 'adminProducts' || e.key === 'adminCategories') {
    try {
      const storedProducts = JSON.parse(localStorage.getItem('adminProducts') || '[]');
      adminState.products = Array.isArray(storedProducts) ? storedProducts : [];
      window.products = adminState.products.slice();

      const storedCats = JSON.parse(localStorage.getItem('adminCategories') || '[]');
      if (Array.isArray(storedCats)) adminState.categories = storedCats;

      // Re-render UI parts that depend on admin data
      renderHomeNewPicks();
      renderAdminLists();
    } catch (err) {
      console.warn('Error handling storage event in main.js', err);
    }
  }
});

function normalizeHomeProduct(product) {
  return {
    id: product.id,
    name: product.name || 'New Arrival',
    price: Number(product.price) || 0,
    image: product.image || 'img/hero.jpg',
    description: product.description || 'New product from admin',
    rating: Number(product.rating) || 4.5,
    reviews: Number(product.reviews) || 0,
    badge: product.badge || 'New'
  };
}

function renderHomeNewPicks() {
  const grid = document.getElementById('homeNewPicksGrid');
  if (!grid) return;

  const storedProducts = adminState.products.map(normalizeHomeProduct);
  const productsToShow = [...storedProducts, ...homepageFeaturedDefaults].slice(0, 4);

  grid.innerHTML = productsToShow.map(product => `
    <div class="group rounded-2xl overflow-hidden shadow-lg hover:shadow-xl smooth-transition bg-white">
      <div class="relative h-72 overflow-hidden bg-gradient-to-br from-stone-100 to-amber-50">
        <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover group-hover:scale-105 smooth-transition" onerror="this.src='img/hero.jpg'">
        <div class="absolute top-4 right-4 bg-amber-600 text-white px-3 py-1 rounded-full text-xs font-semibold">${product.badge}</div>
      </div>
      <div class="p-6">
        <h3 class="serif text-xl font-bold text-stone-900 mb-2">${product.name}</h3>
        <p class="text-sm text-gray-600 mb-4">${product.description}</p>
        <div class="flex items-center justify-between">
          <span class="text-amber-700 font-bold text-lg">₦${product.price.toLocaleString()}</span>
          <button onclick="window.location.href='shop.html'" class="text-amber-700 text-sm font-semibold hover:text-amber-800 smooth-transition">Shop now →</button>
        </div>
      </div>
    </div>
  `).join('');
}

function ensureAdminVisibility() {
  // No admin dashboard interactions on the public homepage.
}

function saveAdminData() {
  localStorage.setItem('adminCategories', JSON.stringify(adminState.categories));
  localStorage.setItem('adminProducts', JSON.stringify(adminState.products));
}

function renderAdminLists() {
  const categoriesList = document.getElementById('admin-categories-list');
  const productsList = document.getElementById('admin-products-list');
  const categorySelect = document.getElementById('admin-product-category');

  if (categorySelect) {
    categorySelect.innerHTML = adminState.categories.map(category => `
      <option value="${category}">${category}</option>
    `).join('');
  }

  if (categoriesList) {
    categoriesList.innerHTML = adminState.categories.length > 0 ? adminState.categories.map(category => `
      <div class="flex justify-between items-center gap-4 rounded-2xl border border-stone-200 p-4">
        <span>${category}</span>
        <button type="button" onclick="removeAdminCategory('${category}')" class="text-sm text-red-600 hover:text-red-800">Remove</button>
      </div>
    `).join('') : '<p class="text-gray-500">No categories yet.</p>';
  }

  if (productsList) {
    productsList.innerHTML = adminState.products.length > 0 ? adminState.products.map(product => `
      <div class="rounded-2xl border border-stone-200 p-4 bg-white">
        <div class="flex justify-between items-start gap-4">
          <div>
            <h4 class="font-semibold">${product.name}</h4>
            <p class="text-sm text-gray-600">${product.category}</p>
            <p class="mt-2 font-semibold text-amber-700">₦${product.price.toLocaleString()}</p>
          </div>
          <button type="button" onclick="removeAdminProduct(${product.id})" class="text-red-600 hover:text-red-800 text-sm">Remove</button>
        </div>
      </div>
    `).join('') : '<p class="text-gray-500">No products yet.</p>';
  }
}

function addAdminCategory(name) {
  const cleaned = name.trim();
  if (!cleaned) {
    cart.showNotification('Please enter a category name.');
    return;
  }

  if (adminState.categories.includes(cleaned)) {
    cart.showNotification('Category already exists.');
    return;
  }

  adminState.categories.push(cleaned);
  saveAdminData();
  renderAdminLists();
  cart.showNotification(`Category "${cleaned}" added.`);
}

function addAdminProduct(name, price, category, image) {
  const cleanedName = name.trim();
  const cleanedCategory = category.trim();
  const productPrice = Number(price);

  if (!cleanedName || !cleanedCategory || !productPrice || productPrice <= 0) {
    cart.showNotification('Please enter valid product details.');
    return;
  }

  const newProduct = {
    id: Date.now(),
    name: cleanedName,
    price: productPrice,
    category: cleanedCategory,
    image: image.trim() || 'img/hero.jpg',
  };

  adminState.products.push(newProduct);
  saveAdminData();
  window.products = adminState.products.slice();
  renderAdminLists();
  cart.showNotification(`Product "${cleanedName}" added.`);
}

function removeAdminCategory(categoryName) {
  adminState.categories = adminState.categories.filter(c => c !== categoryName);
  saveAdminData();
  renderAdminLists();
  cart.showNotification(`Category "${categoryName}" removed.`);
}

function removeAdminProduct(productId) {
  adminState.products = adminState.products.filter(product => product.id !== productId);
  saveAdminData();
  window.products = adminState.products.slice();
  renderAdminLists();
  cart.showNotification('Product removed.');
}

// Handle admin forms
function handleAdminFormSubmit(event) {
  event.preventDefault();

  if (event.target.id === 'admin-category-form') {
    const categoryInput = document.getElementById('admin-category-name');
    addAdminCategory(categoryInput.value);
    categoryInput.value = '';
  }

  if (event.target.id === 'admin-product-form') {
    const nameInput = document.getElementById('admin-product-name');
    const priceInput = document.getElementById('admin-product-price');
    const categorySelect = document.getElementById('admin-product-category');
    const imageInput = document.getElementById('admin-product-image');

    addAdminProduct(nameInput.value, priceInput.value, categorySelect.value, imageInput.value);
    nameInput.value = '';
    priceInput.value = '';
    imageInput.value = '';
  }
}

// SEARCH MODAL
function openSearchModal() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content search-modal">
      <button class="modal-close">✕</button>
      <input type="text" placeholder="Search products, collections..." class="search-input" autofocus>
      <div class="search-results"></div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.style.display = 'flex';
  
  const closeBtn = modal.querySelector('.modal-close');
  closeBtn.addEventListener('click', () => {
    modal.remove();
  });

  const input = modal.querySelector('.search-input');
  const results = modal.querySelector('.search-results');

  input.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    if (query.length > 0) {
      const filtered = window.products.filter(p => p.name.toLowerCase().includes(query));
      results.innerHTML = filtered.map(p => `
        <div class="search-result-item" onclick="cart.addItem({id: ${p.id}, name: '${p.name}', price: ${p.price}}); document.querySelector('.modal')?.remove();">
          <strong>${p.name}</strong>
          <span>₦${p.price.toLocaleString()}</span>
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

// CART MODAL
function openCartModal() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  
  const cartHTML = cart.items.length > 0 ? `
    <div class="cart-items">
      ${cart.items.map(item => `
        <div class="cart-item">
          <div class="cart-item-info">
            <strong>${item.name}</strong>
            <span>₦${item.price.toLocaleString()}</span>
          </div>
          <div class="cart-item-quantity">
            <button onclick="cart.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
            <span>${item.quantity}</span>
            <button onclick="cart.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
          </div>
          <button class="cart-item-remove" onclick="cart.removeItem(${item.id})">✕</button>
        </div>
      `).join('')}
    </div>
    <div class="cart-total">
      <strong>Total: ₦${cart.getTotal().toFixed(2)}</strong>
    </div>
    <button class="btn btn-primary" style="width: 100%;">Proceed to Checkout →</button>
  ` : '<p style="text-align: center; padding: 2rem;">Your cart is empty</p>';

  modal.innerHTML = `
    <div class="modal-content cart-modal">
      <button class="modal-close">✕</button>
      <h3 style="margin-bottom: 1.5rem;">Shopping Cart</h3>
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

// SMOOTH HOVER EFFECTS
document.addEventListener('mouseover', (e) => {
  if (e.target.classList.contains('product-card')) {
    e.target.style.transform = 'scale(1.02)';
  }
});

document.addEventListener('mouseout', (e) => {
  if (e.target.classList.contains('product-card')) {
    e.target.style.transform = 'scale(1)';
  }
});

// KEYBOARD SHORTCUTS
document.addEventListener('keydown', (e) => {
  // Press 'C' to open cart
  if (e.key === 'c' && e.ctrlKey) {
    e.preventDefault();
    openCartModal();
  }
  
  // Press 'S' to open search
  if (e.key === 's' && e.ctrlKey) {
    e.preventDefault();
    openSearchModal();
  }

  // Press 'Esc' to close modals
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal').forEach(m => m.remove());
  }
});

// SCROLL EFFECTS
window.addEventListener('scroll', () => {
  const nav = document.querySelector('nav');
  if (window.scrollY > 100) {
    nav.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
  } else {
    nav.style.boxShadow = 'none';
  }
});

// ADD CSS FOR MODALS AND NOTIFICATIONS
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
  }

  .modal-content {
    background: white;
    border-radius: 1.5rem;
    padding: 2rem;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
    animation: slideUp 0.3s ease;
    position: relative;
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
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    color: #78716b;
    transition: color 0.2s;
  }

  .modal-close:hover {
    color: #292524;
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
    justify-content: space-between;
    align-items: center;
  }

  .search-result-item:hover {
    background: #f5efe6;
  }

  .cart-items {
    max-height: 400px;
    overflow-y: auto;
    margin-bottom: 1rem;
  }

  .cart-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #e7e5e4;
    gap: 1rem;
  }

  .cart-item-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
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
    padding: 0.25rem 0.5rem;
    border: none;
    background: none;
    cursor: pointer;
    color: #b45309;
  }

  .cart-item-remove {
    background: none;
    border: none;
    color: #dc2626;
    cursor: pointer;
    font-size: 1.25rem;
    padding: 0;
  }

  .cart-total {
    border-top: 2px solid #e7e5e4;
    padding-top: 1rem;
    margin-bottom: 1rem;
    text-align: right;
    font-size: 1.125rem;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 50px;
    border: none;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .btn-primary {
    background: #b45309;
    color: white;
  }

  .btn-primary:hover {
    background: #78350f;
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
  const html = document.documentElement;
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
window.cart = cart;
window.openSearchModal = openSearchModal;
window.openCartModal = openCartModal;
window.toggleTheme = toggleTheme;
window.initializeTheme = initializeTheme;

// Initialize theme when DOM is ready
document.addEventListener('DOMContentLoaded', initializeTheme);

console.log('MOVÉ - Premium Interior & Furniture Website Loaded ✓');
