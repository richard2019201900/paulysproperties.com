# paulysproperties.com

A premium real estate rental website for Los Santos properties, featuring Firebase authentication, Firestore database, and a modern responsive UI.

## Features

- **14+ Premium Properties** - Luxury apartments, houses, condos & villas
- **Firebase Authentication** - Secure owner login system
- **Real-time Database** - Firestore for property data and availability
- **Image Lightbox** - Full-screen property image viewer
- **Owner Dashboard** - Manage properties, toggle availability, edit stats
- **Review System** - Property reviews stored in localStorage
- **Responsive Design** - Mobile-first with Tailwind CSS
- **Contact System** - Text-based contact for quick responses

## Project Structure

```
paulysproperties.com/
|-- index.html              # Main HTML structure
|-- css/
|   |-- styles.css          # Custom styles (gradients, animations, components)
|-- js/
|   |-- config.js           # Firebase configuration
|   |-- data.js             # Property data & owner mappings
|   |-- state.js            # Application state management
|   |-- services.js         # PropertyDataService & Firestore operations
|   |-- ui.js               # UI rendering functions
|   |-- components.js       # Lightbox, modals, filters, reviews
|   |-- app.js              # Main initialization & event handlers
|-- images/                 # Property images
|-- README.md               # This file
```

## Deployment

This site is deployed via GitHub Pages. Any push to the `main` branch automatically updates the live site.

**Live Site:** https://richard2019201900.github.io/paulysproperties.com/

## Development

### Prerequisites
- Modern web browser
- Git for version control
- (Optional) Local server for development

### Local Development
1. Clone the repository
2. Open `index.html` in a browser, or use a local server
3. Make changes and commit to `main` branch

### Firebase Setup
The site uses Firebase for:
- **Authentication** - Email/password login for property owners
- **Firestore** - Property availability and custom data storage

Firebase config is in `js/config.js`.

## Changelog

### v2.0.0 (Current)
- Refactored from single-file to modular architecture
- Separated CSS, JavaScript into organized files
- Improved maintainability and version control

### v1.0.0
- Initial release (single index.html file)

## License

(c) 2024 paulysproperties.com. All rights reserved.
