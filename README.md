# 🛍️ Blackmarket - Full-Stack E-Commerce Platform

A modern, feature-rich marketplace application built with Go (Gin) backend and React (TypeScript) frontend. Experience seamless online shopping with advanced features like Google authentication, real-time cart management, order tracking, and multi-device accessibility.

![Blackmarket Banner](https://via.placeholder.com/1200x400/1a1a1a/ffffff?text=Blackmarket+E-Commerce+Platform)

## 🌟 Features

### 🔐 Authentication & User Management
- **Google OAuth Integration** - Quick login with Google accounts
- **Email/Password Authentication** - Traditional login system
- **Profile Management** - Complete user profile CRUD operations
- **Avatar Upload** - Custom profile pictures with validation
- **Address Management** - Multiple delivery addresses support

### 🛒 Shopping Experience
- **Product Catalog** - Browse products with detailed information
- **Advanced Search** - Search by product name or seller
- **Shopping Cart** - Real-time cart management
- **Wishlist** - Save favorite items for later
- **Categories** - Organized product categorization

### 💰 Commerce Features
- **Secure Checkout** - Complete order processing
- **Order History** - Track all past orders
- **Order Details** - Detailed order information and status
- **Payment Integration** - Secure payment processing
- **Seller Dashboard** - Manage products and sales

### 🌐 Network & Deployment
- **Local Network Access** - Access from multiple devices on LAN
- **Responsive Design** - Optimized for desktop and mobile
- **Real-time Updates** - Live cart and profile synchronization

## 🛠️ Tech Stack

### Backend
- **Go** - High-performance server language
- **Gin** - Fast HTTP web framework
- **GORM** - Object-relational mapping
- **SQLite** - Lightweight database
- **JWT** - Secure authentication tokens
- **Firebase Admin SDK** - Google authentication

### Frontend
- **React** - Modern UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful component library
- **React Hook Form** - Form handling
- **Zod** - Schema validation

## 🚀 Quick Start

### Prerequisites
- **Go 1.19+** - [Download Go](https://golang.org/dl/)
- **Node.js 18+** - [Download Node.js](https://nodejs.org/)
- **Firebase Project** - [Firebase Console](https://console.firebase.google.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mpaman/Blackmartket.git
   cd Blackmartket
   ```

2. **Setup Backend**
   ```bash
   cd backend
   go mod tidy
   go run main.go
   ```
   The backend server will start on `http://localhost:8000`

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The frontend server will start on `http://localhost:5173`

### 🔑 Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Google Authentication
3. Download your Firebase config and service account key
4. Place the service account key in the backend directory
5. Update the Firebase configuration in the frontend

## 🌐 Network Access Setup

To access the application from other devices on your local network:

### Automatic Setup (Windows)
1. Run the firewall setup script as Administrator:
   ```cmd
   setup-firewall.bat
   ```

### Manual Setup
1. **Configure Backend** - Already configured to listen on `0.0.0.0:8000`
2. **Configure Frontend** - Already configured with `host: true` in Vite
3. **Setup Firewall Rules**:
   ```cmd
   netsh advfirewall firewall add rule name="Go Backend Server" dir=in action=allow protocol=TCP localport=8000
   netsh advfirewall firewall add rule name="Vite Frontend Server" dir=in action=allow protocol=TCP localport=5173
   ```

### Access from Other Devices
Replace `YOUR_IP_ADDRESS` with your computer's IP address:
- **Frontend**: `http://YOUR_IP_ADDRESS:5173`
- **Backend API**: `http://YOUR_IP_ADDRESS:8000`

Example:
- `http://192.168.140.212:5173`
- `http://192.168.140.212:8000`

## 📱 Usage

### For Customers
1. **Browse Products** - Explore the product catalog
2. **Search & Filter** - Find products by name or seller
3. **Authentication** - Sign up/in with email or Google
4. **Shopping Cart** - Add items and manage quantities
5. **Checkout** - Complete orders with address selection
6. **Order Tracking** - View order history and status

### For Sellers
1. **Seller Dashboard** - Access seller management tools
2. **Product Management** - Add, edit, and delete products
3. **Order Management** - Process customer orders
4. **Profile Setup** - Configure seller profile and details

## 🔧 API Endpoints

### Public Endpoints
- `GET /products` - Get all products
- `GET /products/:id` - Get product by ID
- `GET /categories` - Get all categories
- `POST /signup` - User registration
- `POST /signin` - User login

### Protected Endpoints (Require Authentication)
- `GET /api/current-user` - Get current user info
- `PUT /api/update-profile` - Update user profile
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `GET /api/orders` - Get user's orders
- `POST /api/checkout` - Process checkout
- `GET /api/addresses` - Get user addresses

## 📂 Project Structure

```
Blackmartket/
├── backend/                 # Go backend application
│   ├── main.go             # Application entry point
│   ├── config/             # Database and app configuration
│   ├── controllers/        # HTTP request handlers
│   ├── middlewares/        # Authentication middleware
│   ├── models/            # Database models
│   └── services/          # Business logic services
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API communication
│   │   ├── types/         # TypeScript type definitions
│   │   ├── hooks/         # Custom React hooks
│   │   └── contexts/      # React contexts
│   ├── public/           # Static assets
│   └── package.json      # Frontend dependencies
└── setup-firewall.bat   # Windows firewall configuration
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📋 Development Roadmap

- [ ] **Payment Gateway Integration** - Stripe/PayPal support
- [ ] **Real-time Notifications** - WebSocket implementation
- [ ] **Mobile App** - React Native version
- [ ] **Admin Panel** - Advanced administration features
- [ ] **Analytics Dashboard** - Sales and user analytics
- [ ] **Multi-language Support** - Internationalization
- [ ] **Advanced Search** - Elasticsearch integration
- [ ] **Product Reviews** - Rating and review system

## 🐛 Troubleshooting

### Common Issues

**Backend not accessible from network:**
- Check Windows Firewall settings
- Ensure backend is running on `0.0.0.0:8000`
- Verify IP addresses with `ipconfig`

**Frontend build errors:**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version compatibility

**Database issues:**
- Delete `Blackbaket.db` and restart backend to recreate
- Check file permissions in backend directory

### Getting Help
- Create an issue on GitHub
- Check existing issues for solutions
- Review the troubleshooting section above

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Gin Web Framework](https://gin-gonic.com/) - Fast HTTP web framework for Go
- [React](https://reactjs.org/) - JavaScript library for building user interfaces
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful and accessible component library
- [Firebase](https://firebase.google.com/) - Authentication and backend services

## 👨‍💻 Author

**mpaman** - [GitHub Profile](https://github.com/mpaman)

---

⭐ **Star this repository if you found it helpful!**

🔗 **Live Demo**: [Coming Soon]
