<!-- FindIt JavaScript Modules Structure -->

# 📁 JavaScript Modules

The JavaScript code is organized into modular files by functionality. Load them in this order:

## **Module Order & Purpose**

1. **database.js** - Café database with Butuan City locations
   - Contains `cafeDatabase` array with 8 cafés
   - Includes: name, address, coordinates, rating, distance, tags, etc.

2. **geolocation.js** - Location & distance calculations
   - `userLocation` - Current user position
   - `locateMe()` - Request browser GPS permission
   - `calculateDistance()` - Haversine formula for accurate distances

3. **map.js** - Interactive Leaflet map management
   - `map` - Global Leaflet map instance
   - `initializeMap()` - Initialize map with markers
   - `addCafeMarkers()` - Place café markers on map
   - `updateMap()` - Refresh map based on filters
   - `closePopup()` - Close map popup

4. **search.js** - Search functionality
   - `currentSearchQuery` - Active search term
   - `handleSearch()` - Process search input
   - `displaySearchResults()` - Render search results

5. **filter.js** - Filter & sorting logic
   - `currentFilter` - Active filter type
   - `openDrawer()` / `closeDrawer()` - Drawer UI
   - `pickFilter()` / `applyFilter()` - Filter selection
   - `getFilteredCafes()` - Apply filters & sorting
   - `filterAndDisplayCafes()` - Combined filter + display

6. **ui.js** - UI state & navigation
   - `toggleTheme()` - Light/dark mode
   - `showToast()` - Toast notifications
   - `toggleNotif()` - Notification panel
   - `showPanel()` - Switch between pages
   - Map initialization trigger

7. **interactions.js** - User reactions
   - `bumpRxn()` - Reaction counter increment
   - `fReact()` - Feed reaction animation
   - `toggleFollow()` - Follow café
   - `doSave()` / `saveProfile()` - Save café
   - `followProfile()` - Follow café (profile page)

8. **mood.js** - Mood selection & personalization
   - `moodDB` - Mood database with messages
   - `setMood()` - Handle mood selection

9. **carousel.js** - Image carousel
   - `carIdx` - Current carousel index
   - `carouselGo()` - Go to specific slide
   - `carouselMove()` - Next/previous slide

10. **tabs.js** - Tab switching
    - `setPTab()` - Profile page tabs
    - `mfClick()` - Map filter chips
    - `mtgClick()` - Map/List toggle

11. **owner.js** - Owner dashboard
    - `ownerLogin()` - Owner authentication
    - `ownerLogout()` - Sign out
    - `setInv()` - Inventory management
    - `annType()` - Announcement type selection
    - `postAnn()` - Post announcement

12. **main.js** - Application initialization
    - DOMContentLoaded event listener
    - Time-based greeting
    - Initial café display
    - Carousel setup

## **Dependencies Flow**

```
database.js (Café data)
    ↓
geolocation.js (Location handling)
    ↓
map.js (Map UI)
    ↓
search.js (Search logic)
    ↓
filter.js (Filter logic - depends on search)
    ↓
ui.js (Core UI - shows panels, triggers map init)
    ↓
interactions.js (User actions)
mood.js (Mood selection)
carousel.js (Image carousel)
tabs.js (Tab switching)
owner.js (Owner features)
    ↓
main.js (Initialization - depends on all above)
```

## **Key Global Variables**

| Variable             | Module         | Purpose                |
| -------------------- | -------------- | ---------------------- |
| `cafeDatabase`       | database.js    | Array of 8 cafés       |
| `userLocation`       | geolocation.js | User's GPS position    |
| `map`                | map.js         | Leaflet map instance   |
| `markers`            | map.js         | Array of map markers   |
| `currentSearchQuery` | search.js      | Active search term     |
| `currentFilter`      | filter.js      | Active filter type     |
| `carIdx`             | carousel.js    | Current carousel slide |
| `moodDB`             | mood.js        | Mood configuration     |

## **Usage Example**

Search + Filter + Display:

```javascript
handleSearch("coffee"); // search.js
filterAndDisplayCafes(); // filter.js → uses search
updateMap(getFilteredCafes()); // map.js
```

Geolocation + Map:

```javascript
locateMe(); // geolocation.js
map.setView([lat, lng], 15); // map.js
filterAndDisplayCafes(); // Re-display by distance
```

Theme Toggle:

```javascript
toggleTheme(event); // ui.js
showToast("Theme changed"); // ui.js
```

## **File Sizes**

- database.js: ~3.5 KB (Café data)
- geolocation.js: ~2.8 KB (Location logic)
- map.js: ~2.5 KB (Map functions)
- search.js: ~1.2 KB (Search logic)
- filter.js: ~2.0 KB (Filter logic)
- ui.js: ~1.5 KB (UI core)
- interactions.js: ~1.8 KB (User interactions)
- mood.js: ~1.0 KB (Mood data)
- carousel.js: ~0.7 KB (Carousel)
- tabs.js: ~0.8 KB (Tabs)
- owner.js: ~1.5 KB (Owner dashboard)
- main.js: ~1.5 KB (Initialization)

**Total: ~24 KB** (vs ~28 KB for the original monolithic file)

## **Benefits of Modular Structure**

✅ **Maintainability** - Each function is isolated  
✅ **Readability** - Clear file organization  
✅ **Reusability** - Easy to copy modules to other projects  
✅ **Testability** - Individual modules can be tested  
✅ **Scalability** - Easy to add new features  
✅ **Debugging** - Easier to trace issues

---
