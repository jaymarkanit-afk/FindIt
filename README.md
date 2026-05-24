# FindIt — Butuan City Café Discovery

A modern web application for discovering and exploring cafés in Butuan City. Features interactive maps, geolocation support, café profiles, and personalized recommendations.

## Features

- 🗺️ **Interactive Map** - Explore cafés using Leaflet.js with OpenStreetMap integration
- 📍 **Geolocation** - Auto-detect your location and find nearest cafés
- ⭐ **Café Profiles** - Browse detailed café information, ratings, and reviews
- 🔖 **Save Favorites** - Bookmark your favorite spots
- 🎨 **Smart Recommendations** - AI-powered café suggestions based on mood and preferences
- 📱 **Responsive Design** - Fully functional on desktop and mobile devices
- 🌙 **Theme Toggle** - Dark mode support

## Project Structure

```
FindIt/
├── findit.html           # Main entry point
├── pages/                # Modular page templates
│   ├── home.html        # Home page content
│   ├── map.html         # Map page content
│   ├── profile.html     # Café profile page
│   ├── saved.html       # Saved cafés page
│   └── owner.html       # Owner dashboard
├── css/                  # Stylesheets
│   ├── reset.css        # Reset styles
│   ├── tokens.css       # Design tokens & variables
│   ├── layout.css       # Layout & flexbox
│   ├── findit.css       # Main styles
│   └── [component].css  # Component-specific styles
├── js/                   # JavaScript modules
│   ├── main.js          # App initialization
│   ├── ui.js            # UI interactions
│   ├── map.js           # Map functionality
│   ├── geolocation.js   # Location services
│   ├── database.js      # Café database
│   ├── search.js        # Search functionality
│   └── [feature].js     # Feature modules
├── package.json         # Project metadata
├── vercel.json          # Vercel deployment config
└── .gitignore           # Git ignore rules
```

## Local Development

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Basic HTTP server (for local development)

### Running Locally

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FindIt
   ```

2. **Start a local server**
   
   Using Python 3:
   ```bash
   python -m http.server 8000
   ```
   
   Or using Node.js/npm:
   ```bash
   npx http-server
   ```

3. **Open in browser**
   Navigate to `http://localhost:8000`

## Deployment

### Vercel Deployment

This project is configured for seamless Vercel deployment.

1. **Push to Git**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your Git repository
   - Vercel will auto-detect it's a static site
   - Click "Deploy"

3. **Custom Domain (Optional)**
   - In Vercel dashboard, go to "Settings" > "Domains"
   - Add your custom domain
   - Update DNS records as instructed

### Environment Configuration

The app uses geolocation APIs that work best with HTTPS. Vercel automatically provides HTTPS on all deployments.

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Mapping**: Leaflet.js v1.9.4 + OpenStreetMap
- **Geolocation**: HTML5 Geolocation API
- **Data**: In-memory café database (JavaScript)
- **Styling**: Custom CSS with design tokens system

## Features Documentation

### Geolocation
- Auto-detects user location using browser permission
- Calculates distances to all cafés using Haversine formula
- Displays nearest café and count of nearby cafés
- Updates map view to user's current position

### Map
- Interactive Leaflet map centered on Butuan City
- Café markers with clickable popups
- User location marker
- Click café markers to view profiles

### Café Profiles
- Dynamic profile loading with café images
- Ratings and review counts
- Address and hours information
- Related action buttons (Save, Follow, View on Map)
- Image carousel gallery

### Search
- Real-time café search by name and tags
- Filtered results with café details
- Click results to view full profile

### Sidebar Navigation
- Recommended cafés
- Quick access to features
- Clickable cards for profile navigation

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Modern mobile browsers

## API & Third-Party Services

- **Leaflet.js** - Open-source mapping library
- **OpenStreetMap** - Map tiles provider
- **HTML5 Geolocation API** - Browser location services

## Known Limitations

- Café database is stored in-memory (refreshes on page reload)
- Search functionality is client-side only
- No backend API (static deployment)

## Future Enhancements

- Backend API for persistent data storage
- User authentication & accounts
- Real-time café ratings & reviews
- Social features (sharing, recommendations)
- PWA capabilities (offline support)
- Advanced filtering & sorting
- Admin dashboard for café owners

## Troubleshooting

### Geolocation not working
- Check browser permissions for location access
- Ensure HTTPS is enabled (auto on Vercel)
- Try incognito/private mode
- Check browser console for errors

### Map not displaying
- Verify Leaflet library is loaded
- Check browser developer console for errors
- Ensure internet connection is active

### Pages showing blank
- Clear browser cache
- Check browser console for JavaScript errors
- Verify all page files are loading correctly

## License

ISC

## Support

For issues and feature requests, please create an issue in the repository.

---

**Made with ❤️ for Butuan City café lovers**
