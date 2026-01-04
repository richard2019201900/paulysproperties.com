/**
 * ============================================================================
 * PROPERTY FILTERS - Button-Based Filter System
 * ============================================================================
 * 
 * ARCHITECTURE:
 * - All property data comes from the `properties` array (synced from Firestore)
 * - PropertyDataService.getValue() reads from this synced array
 * - Dual-filter system: Interior type + Property type (can combine)
 * 
 * FILTER TYPES:
 * 1. Interior Buttons: Walk-in, Instance (cyan border - can combine with type)
 * 2. Type Buttons: All, Houses, Apartments, etc. (purple - standard)
 * 3. Checkbox Filters: My Properties, Hide Unavailable
 * 4. Sort: Price, Bedrooms, Interior, Storage
 * 
 * ============================================================================
 */

// ==================== FILTER STATE ====================
// Track active filters separately for dual-filter system
window.activeInteriorFilter = null;  // 'Walk-in', 'Instance', or null
window.activeTypeFilter = null;      // 'house', 'apartment', etc., or null

// ==================== HELPER FUNCTIONS ====================

/**
 * Get property value from Firestore-synced data
 * Falls back to static property value if not in Firestore
 */
function getPropertyValue(property, field) {
    return PropertyDataService.getValue(property.id, field, property[field]);
}

/**
 * Format price for display
 */
function formatPrice(price) {
    if (price >= 1000000) {
        return '$' + (price / 1000000).toFixed(1) + 'M';
    } else if (price >= 1000) {
        return '$' + Math.round(price / 1000) + 'k';
    }
    return '$' + price;
}

// ==================== FEATURED PROPERTY ROTATOR ====================

let featuredRotatorInterval = null;
let currentFeaturedIndex = 0;

/**
 * Get pool of premium properties that are available
 */
function getFeaturedPool() {
    return properties.filter(p => {
        const isPremium = getPropertyValue(p, 'isPremium');
        const isAvailable = state.availability[p.id] !== false;
        return isPremium && isAvailable;
    });
}

/**
 * Generate short description for featured property
 */
function generateShortDescription(property) {
    const type = getPropertyValue(property, 'type') || 'property';
    const interior = getPropertyValue(property, 'interiorType') || '';
    const bedrooms = getPropertyValue(property, 'bedrooms') || 0;
    const location = getPropertyValue(property, 'location') || property.location || '';
    
    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
    const parts = [];
    
    if (bedrooms > 0) {
        parts.push(`${bedrooms} bed ${typeLabel.toLowerCase()}`);
    } else {
        parts.push(typeLabel);
    }
    
    if (interior) {
        parts.push(`${interior} interior`);
    }
    
    if (location) {
        parts.push(`in ${location.split(',')[0]}`);
    }
    
    return parts.join(' • ');
}

/**
 * Render the featured property spotlight
 */
function renderFeaturedSpotlight() {
    const container = $('featuredSpotlight');
    if (!container) return;
    
    const pool = getFeaturedPool();
    
    if (pool.length === 0) {
        // No premium properties - show CTA message
        container.innerHTML = `
            <div class="text-center py-6">
                <p class="text-amber-300 text-lg font-semibold mb-2">✨ Premium Spotlight Available</p>
                <p class="text-gray-300">List your property as Premium for featured placement!</p>
            </div>
        `;
        return;
    }
    
    // Get current featured property
    currentFeaturedIndex = currentFeaturedIndex % pool.length;
    const property = pool[currentFeaturedIndex];
    
    const price = getPropertyValue(property, 'weeklyPrice') || property.weeklyPrice || 0;
    const images = getPropertyValue(property, 'images') || property.images || [];
    const firstImage = images[0] || 'images/placeholder.png';
    const description = generateShortDescription(property);
    
    container.innerHTML = `
        <div class="flex items-center gap-4 cursor-pointer group" onclick="viewProperty(${property.id})">
            <div class="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden flex-shrink-0 border-2 border-amber-400/50 group-hover:border-amber-400 transition">
                <img src="${firstImage}" alt="${property.title}" class="w-full h-full object-cover group-hover:scale-110 transition duration-300" onerror="this.src='images/placeholder.png'">
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-amber-400 text-sm font-bold">✨ FEATURED</span>
                    ${pool.length > 1 ? `<span class="text-gray-500 text-xs">${currentFeaturedIndex + 1}/${pool.length}</span>` : ''}
                </div>
                <h3 class="text-white font-bold text-lg md:text-xl truncate group-hover:text-purple-300 transition">${property.title}</h3>
                <p class="text-gray-400 text-sm truncate">${description}</p>
                <p class="text-purple-400 font-bold mt-1">${formatPrice(price)}/week</p>
            </div>
            <div class="flex-shrink-0">
                <span class="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-semibold transition text-sm md:text-base">
                    View →
                </span>
            </div>
        </div>
    `;
}

/**
 * Start the featured property rotator
 */
window.initFeaturedRotator = function() {
    // Initial render
    renderFeaturedSpotlight();
    
    // Clear any existing interval
    if (featuredRotatorInterval) {
        clearInterval(featuredRotatorInterval);
    }
    
    // Rotate every 60 seconds
    featuredRotatorInterval = setInterval(() => {
        currentFeaturedIndex++;
        renderFeaturedSpotlight();
    }, 60000);
    
    console.log('[Filters] Featured rotator initialized (60s interval)');
};

/**
 * Stop the featured rotator (cleanup)
 */
window.stopFeaturedRotator = function() {
    if (featuredRotatorInterval) {
        clearInterval(featuredRotatorInterval);
        featuredRotatorInterval = null;
    }
};

// ==================== HERO CTA ACTIONS ====================

/**
 * Browse properties - clicks All filter and scrolls to listings
 */
window.browseProperties = function() {
    // Reset all filters
    activeInteriorFilter = null;
    activeTypeFilter = null;
    
    // Update button states
    updateFilterButtonStates();
    
    // Apply filters (shows all)
    applyAllFilters();
    
    // Scroll to properties section
    const propertiesSection = $('properties');
    if (propertiesSection) {
        propertiesSection.scrollIntoView({ behavior: 'smooth' });
    }
};

/**
 * List property - opens create listing modal
 */
window.listYourProperty = function() {
    if (typeof openCreateListingModal === 'function') {
        openCreateListingModal();
    } else {
        // Fallback - navigate to contact or show login
        if (!auth.currentUser) {
            if (typeof openAuthModal === 'function') {
                openAuthModal();
            }
        }
    }
};

// ==================== DUAL-FILTER SYSTEM ====================

/**
 * Update visual state of all filter buttons
 */
function updateFilterButtonStates() {
    // Update interior filter buttons (cyan accent)
    document.querySelectorAll('.interior-filter-btn').forEach(btn => {
        const filterValue = btn.dataset.filter;
        const isActive = activeInteriorFilter === filterValue;
        
        btn.classList.toggle('border-cyan-400', isActive);
        btn.classList.toggle('bg-cyan-500/20', isActive);
        btn.classList.toggle('text-cyan-300', isActive);
        btn.classList.toggle('border-gray-600', !isActive);
        btn.classList.toggle('bg-gray-700', !isActive);
        btn.classList.toggle('text-gray-200', !isActive);
    });
    
    // Update type filter buttons (purple/gradient)
    document.querySelectorAll('.type-filter-btn').forEach(btn => {
        const filterValue = btn.dataset.filter;
        const isAll = filterValue === 'all';
        const isActive = isAll 
            ? (activeTypeFilter === null && activeInteriorFilter === null)
            : activeTypeFilter === filterValue;
        
        btn.classList.toggle('active', isActive);
        btn.classList.toggle('gradient-bg', isActive);
        btn.classList.toggle('text-white', isActive);
        btn.classList.toggle('bg-gray-700', !isActive);
        btn.classList.toggle('text-gray-200', !isActive);
    });
}

/**
 * Handle interior filter button click (Walk-in / Instance)
 */
window.filterByInterior = function(interiorType, btn) {
    // Toggle: if already active, deactivate
    if (activeInteriorFilter === interiorType) {
        activeInteriorFilter = null;
    } else {
        activeInteriorFilter = interiorType;
    }
    
    updateFilterButtonStates();
    applyAllFilters();
};

/**
 * Handle type filter button click (All, Houses, Apartments, etc.)
 */
window.filterByType = function(type, btn) {
    if (type === 'all') {
        // "All" clears BOTH filters
        activeInteriorFilter = null;
        activeTypeFilter = null;
    } else {
        // Toggle: if already active, deactivate
        if (activeTypeFilter === type) {
            activeTypeFilter = null;
        } else {
            activeTypeFilter = type;
        }
    }
    
    updateFilterButtonStates();
    applyAllFilters();
};

// Legacy function for backwards compatibility
window.filterProperties = function(type, btn) {
    filterByType(type, btn);
};

/**
 * Apply all active filters (interior + type + checkboxes)
 */
window.applyAllFilters = function() {
    // Start with all properties
    let filtered = [...properties];
    
    // ========== FILTER: Interior Type ==========
    if (activeInteriorFilter) {
        filtered = filtered.filter(p => {
            const pInterior = getPropertyValue(p, 'interiorType');
            return pInterior === activeInteriorFilter;
        });
    }
    
    // ========== FILTER: Property Type ==========
    if (activeTypeFilter) {
        filtered = filtered.filter(p => {
            const pType = getPropertyValue(p, 'type');
            return pType === activeTypeFilter;
        });
    }
    
    // ========== FILTER: My Properties ==========
    const showMyProperties = $('showMyProperties')?.checked;
    if (showMyProperties && auth.currentUser) {
        const userEmail = auth.currentUser.email.toLowerCase();
        filtered = filtered.filter(p => {
            const ownerEmail = getPropertyValue(p, 'ownerEmail') || propertyOwnerEmail[p.id];
            return ownerEmail && ownerEmail.toLowerCase() === userEmail;
        });
    }
    
    // ========== FILTER: Hide Unavailable ==========
    const hideUnavailable = $('hideUnavailable')?.checked;
    if (hideUnavailable) {
        filtered = filtered.filter(p => {
            const availability = state.availability[p.id];
            if (availability !== undefined) {
                return availability !== false;
            }
            return getPropertyValue(p, 'availability') !== false;
        });
    }
    
    state.filteredProperties = filtered;
    renderProperties(state.filteredProperties);
};

/**
 * Toggle "Hide Unavailable" checkbox
 */
window.toggleHideUnavailable = function() {
    applyAllFilters();
};

/**
 * Toggle "My Properties" checkbox
 */
window.toggleMyProperties = function() {
    applyAllFilters();
};

// ==================== SORT ====================

/**
 * Sort filtered properties
 */
window.sortProperties = function() {
    const sortBy = $('sortBy')?.value;
    if (!sortBy) return;
    
    const sorters = {
        'price-low': (a, b) => {
            const priceA = getPropertyValue(a, 'weeklyPrice') || 0;
            const priceB = getPropertyValue(b, 'weeklyPrice') || 0;
            return priceA - priceB;
        },
        'price-high': (a, b) => {
            const priceA = getPropertyValue(a, 'weeklyPrice') || 0;
            const priceB = getPropertyValue(b, 'weeklyPrice') || 0;
            return priceB - priceA;
        },
        'bedrooms': (a, b) => {
            const bedsA = getPropertyValue(a, 'bedrooms') || 0;
            const bedsB = getPropertyValue(b, 'bedrooms') || 0;
            return bedsB - bedsA;
        },
        'interior': (a, b) => {
            const intA = getPropertyValue(a, 'interiorType') || '';
            const intB = getPropertyValue(b, 'interiorType') || '';
            return intA.localeCompare(intB);
        },
        'storage': (a, b) => {
            const storA = getPropertyValue(a, 'storage') || 0;
            const storB = getPropertyValue(b, 'storage') || 0;
            return storB - storA;
        }
    };
    
    if (sorters[sortBy]) {
        state.filteredProperties.sort(sorters[sortBy]);
    }
    
    renderProperties(state.filteredProperties);
};

// ==================== CLEAR FILTERS ====================

/**
 * Reset all filters to default state
 */
window.clearFilters = function() {
    // Reset filter state
    activeInteriorFilter = null;
    activeTypeFilter = null;
    
    // Reset Sort By dropdown
    const sortBy = $('sortBy');
    if (sortBy) sortBy.selectedIndex = 0;
    
    // Uncheck the filter checkboxes
    const hideUnavailable = $('hideUnavailable');
    const showMyProperties = $('showMyProperties');
    if (hideUnavailable) hideUnavailable.checked = false;
    if (showMyProperties) showMyProperties.checked = false;
    
    // Update button visual states
    updateFilterButtonStates();
    
    // Apply filters (will show all properties since everything is reset)
    applyAllFilters();
};

// ==================== INITIALIZATION ====================

// Auto-initialize featured rotator when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initFeaturedRotator, 500); // Small delay to ensure properties are loaded
    });
} else {
    setTimeout(initFeaturedRotator, 500);
}

console.log('[Filters] Button-based filter system loaded');
