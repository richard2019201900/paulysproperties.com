/**
 * ============================================================================
 * PROPERTY FILTERS - Enterprise Search & Filter System
 * ============================================================================
 * 
 * ARCHITECTURE:
 * - All property data comes from the `properties` array (synced from Firestore)
 * - PropertyDataService.getValue() reads from this synced array
 * - Filters work on real-time Firestore data, not static data.js values
 * 
 * FILTER TYPES:
 * 1. Hero Search (dropdowns): Listing type, Property type, Interior, Price
 * 2. Quick Filters (buttons): All, Houses, Apartments, etc.
 * 3. Checkbox Filters: My Properties, Hide Unavailable
 * 4. Sort: Price, Bedrooms, Interior, Storage
 * 
 * ============================================================================
 */

// ==================== HELPER FUNCTIONS ====================

/**
 * Get property value from Firestore-synced data
 * Falls back to static property value if not in Firestore
 */
function getPropertyValue(property, field) {
    // PropertyDataService reads from the properties array which is synced from Firestore
    return PropertyDataService.getValue(property.id, field, property[field]);
}

/**
 * Parse price range string into min/max values
 * @param {string} priceRange - e.g., "50000-100000" or "200000+"
 * @returns {Object} { min, max, isPlus }
 */
function parsePriceRange(priceRange) {
    if (!priceRange) return null;
    
    const isPlus = priceRange.endsWith('+');
    if (isPlus) {
        return {
            min: parseInt(priceRange.replace('+', '')),
            max: Infinity,
            isPlus: true
        };
    }
    
    const [min, max] = priceRange.split('-').map(n => parseInt(n));
    return { min, max, isPlus: false };
}

// ==================== MAIN SEARCH FUNCTION ====================

/**
 * Search properties using hero dropdown filters
 * This is called when user clicks the "Search" button
 */
window.searchProperties = function() {
    // Get filter values from dropdowns
    const listingType = $('searchListingType')?.value || '';
    const propertyType = $('searchType')?.value || '';
    const interior = $('searchInterior')?.value || '';
    const priceRange = $('searchPrice')?.value || '';
    const frequency = $('searchFrequency')?.value || 'weekly';
    
    console.log('[Filters] Search triggered with:', {
        listingType,
        propertyType,
        interior,
        priceRange,
        frequency,
        totalProperties: properties.length
    });
    
    // Start with all properties
    let filtered = [...properties];
    
    // ========== FILTER 1: Listing Type (Rental vs Purchase) ==========
    if (listingType === 'purchase') {
        filtered = filtered.filter(p => {
            const buyPrice = getPropertyValue(p, 'buyPrice') || 0;
            const hasBuyPrice = buyPrice > 0;
            return hasBuyPrice;
        });
        console.log('[Filters] After purchase filter:', filtered.length);
    }
    // Note: 'rental' shows all properties (everything can be rented)
    
    // ========== FILTER 2: Property Type ==========
    if (propertyType) {
        filtered = filtered.filter(p => {
            const pType = getPropertyValue(p, 'type');
            return pType === propertyType;
        });
        console.log('[Filters] After type filter:', filtered.length);
    }
    
    // ========== FILTER 3: Interior Type ==========
    if (interior) {
        filtered = filtered.filter(p => {
            const pInterior = getPropertyValue(p, 'interiorType');
            return pInterior === interior;
        });
        console.log('[Filters] After interior filter:', filtered.length);
    }
    
    // ========== FILTER 4: Price Range ==========
    if (priceRange) {
        const range = parsePriceRange(priceRange);
        
        filtered = filtered.filter(p => {
            let price = 0;
            
            if (listingType === 'purchase') {
                // Purchase: use buy price
                price = getPropertyValue(p, 'buyPrice') || 0;
            } else {
                // Rental: use price based on frequency
                if (frequency === 'monthly') {
                    price = getPropertyValue(p, 'monthlyPrice') || (getPropertyValue(p, 'weeklyPrice') || 0) * 4;
                } else if (frequency === 'biweekly') {
                    price = getPropertyValue(p, 'biweeklyPrice') || (getPropertyValue(p, 'weeklyPrice') || 0) * 2;
                } else {
                    // Default to weekly
                    price = getPropertyValue(p, 'weeklyPrice') || 0;
                }
            }
            
            if (range.isPlus) {
                return price >= range.min;
            }
            return price >= range.min && price <= range.max;
        });
        console.log('[Filters] After price filter:', filtered.length);
    }
    
    // Update state and render
    state.filteredProperties = filtered;
    console.log('[Filters] Final filtered count:', filtered.length);
    
    renderProperties(state.filteredProperties);
    navigateTo('properties');
};

// ==================== QUICK FILTER BUTTONS ====================

/**
 * Apply all active filters (type buttons + checkboxes)
 * Called by filter buttons and checkbox changes
 */
window.applyAllFilters = function() {
    // Start with all properties
    let filtered = [...properties];
    
    // ========== FILTER: Type Button ==========
    const activeFilterBtn = document.querySelector('.filter-btn.active');
    const activeFilter = activeFilterBtn ? activeFilterBtn.textContent.trim().toLowerCase() : 'all';
    
    if (activeFilter !== 'all') {
        const typeMap = { 
            'houses': 'house', 
            'apartments': 'apartment', 
            'condos': 'condo', 
            'villas': 'villa',
            'hotels': 'hotel',
            'offices': 'office',
            'warehouses': 'warehouse',
            'hideouts': 'hideout'
        };
        const filterType = typeMap[activeFilter] || activeFilter;
        
        filtered = filtered.filter(p => {
            const pType = getPropertyValue(p, 'type');
            return pType === filterType;
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
            // Check Firestore availability state first, then property value
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
 * Filter by property type (button click)
 */
window.filterProperties = function(type, btn) {
    // Update button styles
    document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('active', 'gradient-bg', 'text-white');
        b.classList.add('bg-gray-700', 'text-gray-200');
    });
    btn.classList.remove('bg-gray-700', 'text-gray-200');
    btn.classList.add('active', 'gradient-bg', 'text-white');
    
    applyAllFilters();
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
    // Reset all dropdown values
    ['searchType', 'searchInterior', 'searchPrice', 'sortBy', 'searchListingType', 'searchFrequency'].forEach(id => {
        const el = $(id);
        if (el) {
            el.selectedIndex = 0; // Reset to first option (placeholder)
        }
    });
    
    // Reset price dropdown to default options
    updatePriceOptions();
    
    // Hide frequency dropdown
    const freqDropdown = $('searchFrequency');
    if (freqDropdown) freqDropdown.classList.add('hidden');
    
    // Uncheck the filter checkboxes
    const hideUnavailable = $('hideUnavailable');
    const showMyProperties = $('showMyProperties');
    if (hideUnavailable) hideUnavailable.checked = false;
    if (showMyProperties) showMyProperties.checked = false;
    
    // Reset filter buttons (make "All" active)
    document.querySelectorAll('.filter-btn').forEach((btn, i) => {
        toggleClass(btn, 'active', i === 0);
        toggleClass(btn, 'gradient-bg', i === 0);
        toggleClass(btn, 'text-white', i === 0);
        toggleClass(btn, 'bg-gray-700', i !== 0);
        toggleClass(btn, 'text-gray-200', i !== 0);
    });
    
    // Apply filters (will show all properties since everything is reset)
    applyAllFilters();
};

// ==================== PRICE OPTIONS ====================

/**
 * Update price dropdown options based on listing type selection
 */
window.updatePriceOptions = function() {
    const listingType = $('searchListingType')?.value;
    const freqDropdown = $('searchFrequency');
    const priceDropdown = $('searchPrice');
    
    if (!priceDropdown) return;
    
    // Show/hide frequency dropdown based on listing type
    if (freqDropdown) {
        if (listingType === 'rental') {
            freqDropdown.classList.remove('hidden');
        } else {
            freqDropdown.classList.add('hidden');
            freqDropdown.selectedIndex = 0;
        }
    }
    
    // Get frequency for rental price ranges
    const frequency = freqDropdown?.value || 'weekly';
    
    if (listingType === 'purchase') {
        // Purchase price ranges
        priceDropdown.innerHTML = `
            <option value="" disabled selected>── Purchase Price ──</option>
            <option value="0-1000000">Under $1M</option>
            <option value="1000000-2000000">$1M - $2M</option>
            <option value="2000000-3000000">$2M - $3M</option>
            <option value="3000000-5000000">$3M - $5M</option>
            <option value="5000000-7500000">$5M - $7.5M</option>
            <option value="7500000-10000000">$7.5M - $10M</option>
            <option value="10000000-15000000">$10M - $15M</option>
            <option value="15000000-20000000">$15M - $20M</option>
            <option value="20000000+">$20M+</option>
        `;
    } else if (listingType === 'rental') {
        if (frequency === 'weekly') {
            priceDropdown.innerHTML = `
                <option value="" disabled selected>── Weekly Rent ──</option>
                <option value="0-25000">Under $25k/week</option>
                <option value="25000-50000">$25k - $50k/week</option>
                <option value="50000-75000">$50k - $75k/week</option>
                <option value="75000-100000">$75k - $100k/week</option>
                <option value="100000-150000">$100k - $150k/week</option>
                <option value="150000+">$150k+/week</option>
            `;
        } else if (frequency === 'biweekly') {
            priceDropdown.innerHTML = `
                <option value="" disabled selected>── Bi-Weekly Rent ──</option>
                <option value="0-50000">Under $50k/2wks</option>
                <option value="50000-100000">$50k - $100k/2wks</option>
                <option value="100000-150000">$100k - $150k/2wks</option>
                <option value="150000-200000">$150k - $200k/2wks</option>
                <option value="200000-300000">$200k - $300k/2wks</option>
                <option value="300000+">$300k+/2wks</option>
            `;
        } else if (frequency === 'monthly') {
            priceDropdown.innerHTML = `
                <option value="" disabled selected>── Monthly Rent ──</option>
                <option value="0-100000">Under $100k/mo</option>
                <option value="100000-200000">$100k - $200k/mo</option>
                <option value="200000-300000">$200k - $300k/mo</option>
                <option value="300000-500000">$300k - $500k/mo</option>
                <option value="500000-750000">$500k - $750k/mo</option>
                <option value="750000+">$750k+/mo</option>
            `;
        } else {
            priceDropdown.innerHTML = `
                <option value="" disabled selected>── Rental Price ──</option>
                <option value="0-50000">$0 - $50k</option>
                <option value="50000-100000">$50k - $100k</option>
                <option value="100000-200000">$100k - $200k</option>
                <option value="200000+">$200k+</option>
            `;
        }
    } else {
        // Default (no selection)
        priceDropdown.innerHTML = `
            <option value="" disabled selected>── Price ──</option>
            <option value="0-50000">$0 - $50k</option>
            <option value="50000-100000">$50k - $100k</option>
            <option value="100000-200000">$100k - $200k</option>
            <option value="200000+">$200k+</option>
        `;
    }
};

console.log('[Filters] Enterprise filter system loaded');
