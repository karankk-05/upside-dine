# Upside Dine - Design Documentation

A mobile-first campus food ordering and mess management system with a **Stranger Things** theme.

## 🎨 Design Theme

- **Prominent Glow Effect**: Login and splash screens feature strong red neon glows reminiscent of Stranger Things
- **Subtle Theme**: Inside the app, glows are more subtle while maintaining consistent aesthetic
- **Mobile-First**: Optimized for mobile devices (max-width: 428px)
- **Dark Mode**: Full dark theme with red accent colors

## 📱 Pages Overview

### Student Workflow
1. **splash.html** - Animated splash screen with logo
2. **login.html** - Login page with student/admin role selector
3. **dashboard.html** - Main dashboard with top items and canteen list
4. **mess.html** - Mess features (booking, crowd monitor, account)
5. **mess-booking.html** - Menu and booking interface
6. **mess-qr.html** - QR code display after booking
7. **mess-crowd.html** - Live crowd monitoring with ML analysis
8. **canteen.html** - Canteen menu with pickup/delivery options
9. **order-status.html** - Real-time order tracking

### Admin Workflows
1. **admin-mess-manager.html** - Inventory and booking management
2. **admin-mess-worker.html** - QR code scanner for validation
3. **admin-canteen-manager.html** - Order and inventory management
4. **admin-delivery.html** - Delivery person dashboard

## 🚀 How to View

1. Open `index.html` in a browser for full navigation
2. Or directly open any individual page
3. Best viewed in mobile viewport (F12 → Device Toolbar in Chrome)

## 🎯 Key Features

- ✅ Dual authentication (Student & Admin)
- ✅ QR-based mess booking system
- ✅ Live crowd monitoring (ML integration placeholder)
- ✅ Real-time order status tracking
- ✅ Delivery management
- ✅ Inventory management for admins
- ✅ Monthly account system for mess payments
- ✅ Instant payment for canteen orders

## 🛠️ Tech Stack

- **HTML5** - Structure
- **CSS3** - Styling with custom Stranger Things theme
- **Vanilla JavaScript** - (Ready for future interactivity)

## 📝 Notes

- These are **static design mockups** for documentation purposes
- No backend functionality is implemented
- Logo (`logo.png`) is included and used on splash and login screens
- All pages are standalone and can be navigated independently

## 🎬 Theme Inspiration

The design takes inspiration from the Netflix series "Stranger Things" with:
- Red neon text effects
- Dark, mysterious backgrounds
- Glowing accents and borders
- Upside Down aesthetic (hence "Upside Dine")

## 📂 File Structure

```
cs253_design/
├── index.html                    # Main navigation hub
├── splash.html                   # Splash screen
├── login.html                    # Login page
├── dashboard.html                # Student dashboard
├── mess.html                     # Mess features
├── mess-booking.html             # Mess booking
├── mess-qr.html                  # QR code display
├── mess-crowd.html               # Crowd monitoring
├── canteen.html                  # Canteen menu
├── order-status.html             # Order tracking
├── admin-mess-manager.html       # Mess manager admin
├── admin-mess-worker.html        # Mess worker scanner
├── admin-canteen-manager.html    # Canteen manager admin
├── admin-delivery.html           # Delivery person
├── styles.css                    # Global styles
├── logo.png                      # App logo
└── README.md                     # This file
```

## 🎓 Academic Use

This design documentation is created for the CS253 course project submission.
