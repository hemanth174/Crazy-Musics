# Admin Dashboard - Crazy-Musics

A modern, secure admin panel for managing Crazy-Musics users with advanced UI/UX design.

## 🎯 Features

### Security Features
- ✅ **No Autocomplete**: Admin credentials are never saved by browsers or password managers
- ✅ **No Password Storage**: Uses multiple HTML attributes to prevent credential caching
- ✅ **Session-based Auth**: Admin tokens stored in `sessionStorage` (cleared on browser close)
- ✅ **Environment Variables**: Admin credentials stored securely in `.env` file
- ✅ **JWT Authentication**: Secure token-based authentication with 8-hour expiry

### User Management
- 📋 **View All Users**: Complete list of registered users with pagination
- 🔍 **Search & Filter**: Search by name/email/artist and filter by music genre
- ➕ **Create Users**: Add new users directly from admin panel
- ✏️ **Update Users**: Edit user information (name, DOB, genre, artist, password)
- 🗑️ **Delete Users**: Remove users with confirmation modal
- 📊 **Statistics**: Real-time stats for total users, new users, and active users

### Modern UI/UX
- 🎨 **Gradient Design**: Beautiful purple gradient theme
- 📱 **Fully Responsive**: Works perfectly on desktop, tablet, and mobile
- ⚡ **Fast & Smooth**: Optimized animations and transitions
- 🌓 **Professional Layout**: Sidebar navigation with topbar
- 🎭 **Toast Notifications**: Beautiful success/error messages
- 📄 **Pagination**: Efficient data display with page navigation

## 🚀 Setup Instructions

### 1. Environment Variables

Add these variables to your `MAIN/.env` file:

```env
# Admin Panel Credentials
ADMIN_EMAIL=admin@crazymusics.com
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_NAME=Admin

# Existing variables
JWT_SECRET=your_jwt_secret_here
MONGO_URI=your_mongodb_connection_string
```

**⚠️ IMPORTANT**: Change the default admin credentials before deploying to production!

### 2. Server Configuration

The admin routes are automatically included in `server.js`. The server serves admin files from:
```
http://your-domain.com/Admin/login.html
http://your-domain.com/Admin/dashboard.html
```

### 3. Access the Admin Panel

**Local Development:**
```
http://localhost:3000/Admin/login.html
```

**Production (Render):**
```
https://crazy-musics-1.onrender.com/Admin/login.html
```

## 📁 File Structure

```
Admin/
├── login.html              # Admin login page
├── dashboard.html          # Main dashboard with user management
├── styles/
│   ├── login.css          # Login page styles
│   └── dashboard.css      # Dashboard styles
└── scripts/
    └── dashboard.js       # Dashboard functionality
```

## 🔐 Security Best Practices

### Login Page Security
1. **Multiple autocomplete prevention layers:**
   - `autocomplete="off"` on form and inputs
   - `readonly` attribute removed only on focus
   - `data-lpignore="true"` to prevent LastPass
   - `data-form-type="other"` to avoid browser detection

2. **Session Security:**
   - Admin tokens in `sessionStorage` (not `localStorage`)
   - Automatic session expiry after 8 hours
   - Token cleared on logout or browser close

3. **Input Clearing:**
   - Password fields cleared on error
   - Form cleared on successful login
   - Inputs cleared on page unload

### API Security
- All admin routes protected with JWT middleware
- Admin role verification on every request
- Token expiry and refresh handling
- HTTPS recommended for production

## 🎨 Customization

### Change Theme Colors

Edit `Admin/styles/dashboard.css` or `Admin/styles/login.css`:

```css
:root {
  --primary-color: #667eea;      /* Main purple */
  --secondary-color: #764ba2;    /* Secondary purple */
  --success-color: #48bb78;      /* Green */
  --danger-color: #f56565;       /* Red */
}
```

### Update Admin Info

Modify `MAIN/.env`:
```env
ADMIN_NAME=Your Name
ADMIN_EMAIL=your.email@domain.com
```

## 📊 API Endpoints

### Admin Authentication
```
POST /admin/login
Body: { email, password }
Response: { token, email, name, status }
```

### User Management
```
GET /users
Headers: Authorization: Bearer {token}
Response: { count, users: [...] }

PUT /admin/users/:id
Headers: Authorization: Bearer {admin_token}
Body: { fullName, dob, musicGenre, favoriteArtist, password? }

DELETE /user/:id
Headers: Authorization: Bearer {admin_token}
```

## 🐛 Troubleshooting

### Login Issues
1. **"Invalid credentials"**: Check `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`
2. **"Session expired"**: Token expired after 8 hours, login again
3. **Autocomplete appearing**: Clear browser cache and saved passwords

### Dashboard Issues
1. **Users not loading**: Check JWT token in sessionStorage
2. **"Access Denied"**: Token invalid or expired
3. **Can't delete/update**: Verify admin token has correct role

### Network Issues
1. Check server is running on correct port
2. Verify API base URL in `dashboard.js` matches your server
3. Check CORS settings allow admin domain

## 🔄 Updates & Maintenance

### Adding New Features
1. Update `dashboard.html` for UI changes
2. Add functionality in `dashboard.js`
3. Create new API routes in `server.js` with `authenticateAdmin` middleware
4. Update this README

### Database Changes
If you add new user fields:
1. Update `MAIN/models/User.js`
2. Add fields to dashboard form in `dashboard.html`
3. Update `handleUserSubmit()` in `dashboard.js`
4. Update table columns in `renderUsers()`

## 📱 Responsive Breakpoints

- **Desktop**: > 1024px (full sidebar visible)
- **Tablet**: 768px - 1024px (collapsible sidebar)
- **Mobile**: < 768px (hamburger menu, stacked layout)

## 🎓 Technologies Used

- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Icons**: BoxIcons
- **Fonts**: Inter (Google Fonts)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Auth**: JWT (jsonwebtoken)

## 📄 License

Part of Crazy-Musics project. All rights reserved.

---

**Built with ❤️ by senior developers for optimal UX/UI experience**
