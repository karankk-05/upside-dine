// ==========================================
// UPSIDE DINE - Core Application JavaScript
// ==========================================

// ========== STATE MANAGEMENT ==========
const AppState = {
  user: null,
  cart: [],
  orders: [],
  bookings: [],
  
  // Initialize from localStorage
  init() {
    this.user = JSON.parse(localStorage.getItem('upsidedine_user')) || null;
    this.cart = JSON.parse(localStorage.getItem('upsidedine_cart')) || [];
    this.orders = JSON.parse(localStorage.getItem('upsidedine_orders')) || [];
    this.bookings = JSON.parse(localStorage.getItem('upsidedine_bookings')) || [];
  },
  
  // Save to localStorage
  save() {
    localStorage.setItem('upsidedine_user', JSON.stringify(this.user));
    localStorage.setItem('upsidedine_cart', JSON.stringify(this.cart));
    localStorage.setItem('upsidedine_orders', JSON.stringify(this.orders));
    localStorage.setItem('upsidedine_bookings', JSON.stringify(this.bookings));
  },
  
  // User methods
  login(email, role) {
    this.user = { email, role, name: this.extractName(email) };
    this.save();
  },
  
  logout() {
    this.user = null;
    this.cart = [];
    this.save();
  },
  
  extractName(email) {
    // Extract name from email (before @)
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  },
  
  // Cart methods
  addToCart(item) {
    const existing = this.cart.find(i => i.id === item.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.cart.push({ ...item, quantity: 1 });
    }
    this.save();
  },
  
  removeFromCart(itemId) {
    this.cart = this.cart.filter(i => i.id !== itemId);
    this.save();
  },
  
  updateCartQuantity(itemId, quantity) {
    const item = this.cart.find(i => i.id === itemId);
    if (item) {
      item.quantity = quantity;
      if (item.quantity <= 0) {
        this.removeFromCart(itemId);
      }
    }
    this.save();
  },
  
  clearCart() {
    this.cart = [];
    this.save();
  },
  
  getCartTotal() {
    return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },
  
  getCartCount() {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  },
  
  // Order methods
  createOrder(canteen, orderType) {
    const order = {
      id: 'ORD' + Date.now(),
      canteen,
      orderType,
      items: [...this.cart],
      total: this.getCartTotal(),
      status: 'received',
      timestamp: new Date().toISOString()
    };
    this.orders.push(order);
    this.clearCart();
    this.save();
    return order;
  },
  
  updateOrderStatus(orderId, status) {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      this.save();
    }
  },
  
  // Booking methods
  createBooking(meal, items) {
    const booking = {
      id: 'BKG' + Date.now(),
      meal,
      items,
      date: new Date().toISOString(),
      used: false
    };
    this.bookings.push(booking);
    this.save();
    return booking;
  },
  
  markBookingUsed(bookingId) {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (booking) {
      booking.used = true;
      this.save();
    }
  }
};

// Initialize state on page load
AppState.init();

// ========== NAVIGATION ==========
const Navigation = {
  goTo(page) {
    window.location.href = page;
  },
  
  goBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.goTo('dashboard.html');
    }
  },
  
  requireAuth() {
    if (!AppState.user) {
      this.goTo('login.html');
      return false;
    }
    return true;
  },
  
  requireRole(role) {
    if (!this.requireAuth()) return false;
    if (AppState.user.role !== role) {
      this.goTo('login.html');
      return false;
    }
    return true;
  }
};

// ========== UTILITIES ==========
const Utils = {
  formatPrice(price) {
    return '₹' + price;
  },
  
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  },
  
  formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  },
  
  getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  },
  
  generateQRData(booking) {
    return JSON.stringify({
      id: booking.id,
      meal: booking.meal,
      date: booking.date
    });
  },
  
  validateQRData(qrData) {
    try {
      const data = JSON.parse(qrData);
      const booking = AppState.bookings.find(b => b.id === data.id);
      return booking && !booking.used;
    } catch {
      return false;
    }
  },
  
  simulateCrowdLevel() {
    // Random crowd percentage between 20 and 90
    return Math.floor(Math.random() * 70) + 20;
  },
  
  getCrowdLabel(percentage) {
    if (percentage < 40) return 'Low';
    if (percentage < 70) return 'Medium';
    return 'High';
  }
};

// ========== MOCK DATA ==========
const MockData = {
  canteens: [
    {
      id: 'mess-hall12',
      name: 'Hall 12 Mess',
      icon: '🍽️',
      type: 'mess',
      badge: 'Your Mess',
      status: 'Open Now • 15 min wait',
      isOpen: true
    },
    {
      id: 'mama-mio',
      name: 'Mama Mio',
      icon: '🍕',
      type: 'canteen',
      status: 'Open Now',
      isOpen: true,
      rating: 4.5,
      orders: 2300
    },
    {
      id: 'hall10-canteen',
      name: 'Hall 10 Canteen',
      icon: '🍔',
      type: 'canteen',
      status: 'Open Now',
      isOpen: true,
      rating: 4.2,
      orders: 1800
    },
    {
      id: 'mt-canteen',
      name: 'MT Canteen',
      icon: '🥡',
      type: 'canteen',
      status: 'Open Now',
      isOpen: true,
      rating: 4.3,
      orders: 2100
    },
    {
      id: 'kc-canteen',
      name: 'KC Canteen',
      icon: '☕',
      type: 'canteen',
      status: 'Open Now',
      isOpen: true,
      rating: 4.4,
      orders: 1500
    },
    {
      id: 'nescafe',
      name: 'Nescafe',
      icon: '☕',
      type: 'canteen',
      status: 'Closes at 8 PM',
      isOpen: true,
      rating: 4.1,
      orders: 1200
    }
  ],
  
  menuItems: {
    'hall10-canteen': [
      { id: 'h10-1', name: 'Samosa (2 pcs)', desc: 'Crispy with tamarind chutney', price: 20 },
      { id: 'h10-2', name: 'Chai', desc: 'Hot masala tea', price: 10 },
      { id: 'h10-3', name: 'Maggi', desc: 'Classic masala noodles', price: 30 },
      { id: 'h10-4', name: 'Bread Omelette', desc: 'Double egg with toast', price: 40 },
      { id: 'h10-5', name: 'Paratha (Aloo)', desc: 'Stuffed with curd', price: 35 },
      { id: 'h10-6', name: 'Cold Drink', desc: 'Pepsi / Coca Cola / Sprite', price: 40 }
    ],
    'mama-mio': [
      { id: 'mm-1', name: 'Margherita Pizza', desc: 'Classic cheese pizza', price: 150 },
      { id: 'mm-2', name: 'Pepperoni Pizza', desc: 'With extra cheese', price: 180 },
      { id: 'mm-3', name: 'Pasta Alfredo', desc: 'Creamy white sauce', price: 120 },
      { id: 'mm-4', name: 'Garlic Bread', desc: 'With cheese dip', price: 60 }
    ],
    'mt-canteen': [
      { id: 'mt-1', name: 'Hakka Noodles', desc: 'Veg or chicken', price: 80 },
      { id: 'mt-2', name: 'Fried Rice', desc: 'With manchurian', price: 90 },
      { id: 'mt-3', name: 'Spring Rolls', desc: '4 pieces', price: 50 },
      { id: 'mt-4', name: 'Chowmein', desc: 'Spicy street style', price: 70 }
    ]
  },
  
  messSchedule: {
    breakfast: {
      time: '7:30 AM - 9:30 AM',
      items: [
        { name: 'Poha', available: true },
        { name: 'Idli Sambhar', available: true },
        { name: 'Bread & Butter', available: true },
        { name: 'Tea/Coffee', available: true }
      ]
    },
    lunch: {
      time: '12:30 PM - 2:30 PM',
      items: [
        { name: 'Dal Fry', available: true },
        { name: 'Paneer Curry', available: true },
        { name: 'Rice', available: true },
        { name: 'Roti (4 pcs)', available: true },
        { name: 'Salad', available: true }
      ]
    },
    dinner: {
      time: '7:30 PM - 9:30 PM',
      items: [
        { name: 'Dal Tadka', available: true },
        { name: 'Mix Veg', available: true },
        { name: 'Rice', available: true },
        { name: 'Roti (4 pcs)', available: true },
        { name: 'Curd', available: true }
      ]
    }
  },
  
  orderStatuses: ['received', 'preparing', 'ready', 'out_for_delivery', 'delivered'],
  
  getStatusLabel(status) {
    const labels = {
      'received': 'Order Received',
      'preparing': 'Being Prepared',
      'ready': 'Ready for Pickup',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered'
    };
    return labels[status] || status;
  }
};

// ========== UI HELPERS ==========
const UI = {
  showLoading(element) {
    if (element) {
      element.innerHTML = '<div class="loading"></div>';
    }
  },
  
  showError(message) {
    alert(message); // Simple alert for now
  },
  
  showSuccess(message) {
    alert(message); // Simple alert for now
  },
  
  updateCartBadge() {
    const badge = document.querySelector('.cart-badge');
    const count = AppState.getCartCount();
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  }
};

// Export to window for global access
window.AppState = AppState;
window.Navigation = Navigation;
window.Utils = Utils;
window.MockData = MockData;
window.UI = UI;
