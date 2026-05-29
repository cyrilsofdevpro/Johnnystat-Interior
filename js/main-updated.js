// ================================================
// MOVÉ - Premium Interior & Furniture Website
// JavaScript - Interactive Features & Functionality
// ================================================

// PRODUCT DATABASE (SHARED)
const products = [
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

// CART CLASS
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
  }

  removeItem(productId) {
    this.items = this.items.filter(item => item.id !== productId);
    this.save();
    this.updateCartCount();
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

// INITIALIZE
document.addEventListener('DOMContentLoaded', () => {
  initializeCart();
  initializeEventListeners();
  addAnimationsToElements();
});

// INITIALIZE CART
function initializeCart() {
  cart = new Cart();
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
            <span class="text-amber-700 font-semibold">$${item.price.toLocaleString()}</span>
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
        <span>$${cart.getTotal().toFixed(2)}</span>
      </div>
      <div class="summary-row">
        <span>Shipping:</span>
        <span>$50.00</span>
      </div>
      <div class="summary-row font-bold text-lg border-t pt-2 mt-2">
        <span>Total:</span>
        <span class="text-amber-700">$${(cart.getTotal() + 50).toFixed(2)}</span>
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
      <button class="w-full py-3 bg-amber-700 text-white rounded-lg font-semibold hover:bg-amber-800 smooth-transition" onclick="window.location.href='shop.html'">
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
        <div class="search-result-item" onclick="cart.addItem(${p.id}); modal.remove();">
          <img src="${p.image}" alt="${p.name}" class="w-16 h-16 object-cover rounded">
          <div style="flex: 1;">
            <strong>${p.name}</strong>
            <p style="color: #78716b; font-size: 0.875rem;">${p.description}</p>
          </div>
          <span class="text-amber-700 font-bold">$${p.price.toLocaleString()}</span>
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

// EVENT LISTENERS
function initializeEventListeners() {
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal').forEach(m => m.remove());
    }
  });
}

// ADD ANIMATIONS
function addAnimationsToElements() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'fadeIn 0.8s ease-in forwards';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.card, .product-card, .testimonial-card, .category-card').forEach((el) => {
    el.style.opacity = '0';
    observer.observe(el);
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

    .notification {
      bottom: 1rem;
      right: 1rem;
    }
  }
`;

document.head.appendChild(styles);

// EXPORT FOR GLOBAL USE
window.cart = cart;
window.openSearchModal = openSearchModal;
window.openCartModal = openCartModal;
window.products = products;

console.log('MOVÉ - Premium Interior & Furniture Website Loaded ✓');
