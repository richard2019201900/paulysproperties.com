/**
 * PROPERTY FILTERS - Button-Based Filter System
 * Dual-filter: Interior (Walk-in/Instance) + Type (Houses/Apartments/etc)
 */

// Filter state
window.activeInteriorFilter = null;
window.activeTypeFilter = null;

// Featured rotator state
var featuredRotatorInterval = null;
var currentFeaturedIndex = 0;

/**
 * Get property value from Firestore-synced data
 */
function getPropertyValue(property, field) {
    return PropertyDataService.getValue(property.id, field, property[field]);
}

/**
 * Get pool of premium available properties
 */
function getFeaturedPool() {
    return properties.filter(function(p) {
        var isPremium = getPropertyValue(p, 'isPremium');
        var isAvailable = state.availability[p.id] !== false;
        return isPremium && isAvailable;
    });
}

/**
 * Render the featured property spotlight
 */
function renderFeaturedSpotlight() {
    var container = $('featuredSpotlight');
    if (!container) return;
    
    var pool = getFeaturedPool();
    
    if (pool.length === 0) {
        container.innerHTML = '<div class="text-center py-2">' +
            '<p class="text-amber-300 font-semibold">✨ Premium Spotlight Available</p>' +
            '<p class="text-gray-400 text-sm">List your property as Premium for featured placement!</p>' +
            '</div>';
        return;
    }
    
    currentFeaturedIndex = currentFeaturedIndex % pool.length;
    var property = pool[currentFeaturedIndex];
    
    var price = getPropertyValue(property, 'weeklyPrice') || property.weeklyPrice || 0;
    var images = getPropertyValue(property, 'images') || property.images || [];
    var firstImage = images[0] || 'images/placeholder.png';
    var type = getPropertyValue(property, 'type') || 'property';
    
    container.innerHTML = '<div class="flex items-center gap-3 cursor-pointer group" onclick="viewProperty(' + property.id + ')">' +
        '<div class="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-amber-400/50">' +
            '<img src="' + firstImage + '" alt="' + property.title + '" class="w-full h-full object-cover" onerror="this.src=\'images/placeholder.png\'">' +
        '</div>' +
        '<div class="flex-1 min-w-0">' +
            '<div class="flex items-center gap-2">' +
                '<span class="text-amber-400 text-xs font-bold">✨ FEATURED</span>' +
                (pool.length > 1 ? '<span class="text-gray-500 text-xs">' + (currentFeaturedIndex + 1) + '/' + pool.length + '</span>' : '') +
            '</div>' +
            '<h3 class="text-white font-bold truncate group-hover:text-purple-300 transition">' + property.title + '</h3>' +
            '<p class="text-purple-400 font-semibold text-sm">' + formatPrice(price) + '/week</p>' +
        '</div>' +
        '<span class="flex-shrink-0 bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg font-semibold transition text-sm">View</span>' +
        '</div>';
}

/**
 * Initialize featured rotator
 */
window.initFeaturedRotator = function() {
    renderFeaturedSpotlight();
    
    if (featuredRotatorInterval) {
        clearInterval(featuredRotatorInterval);
    }
    
    featuredRotatorInterval = setInterval(function() {
        currentFeaturedIndex++;
        renderFeaturedSpotlight();
    }, 60000);
    
    console.log('[Filters] Featured rotator initialized');
};

/**
 * Browse properties - scroll to listings
 */
window.browseProperties = function() {
    activeInteriorFilter = null;
    activeTypeFilter = null;
    updateFilterButtonStates();
    applyAllFilters();
    
    var propertiesSection = $('properties');
    if (propertiesSection) {
        propertiesSection.scrollIntoView({ behavior: 'smooth' });
    }
};

/**
 * List property - open create listing modal
 */
window.listYourProperty = function() {
    if (typeof openCreateListingModal === 'function') {
        openCreateListingModal();
    } else if (!auth.currentUser && typeof openAuthModal === 'function') {
        openAuthModal();
    }
};

/**
 * Update button visual states
 */
function updateFilterButtonStates() {
    // Interior buttons (cyan)
    document.querySelectorAll('.interior-filter-btn').forEach(function(btn) {
        var filterValue = btn.dataset.filter;
        var isActive = activeInteriorFilter === filterValue;
        
        if (isActive) {
            btn.classList.add('border-cyan-400', 'bg-cyan-500/20', 'text-cyan-300');
            btn.classList.remove('border-gray-600', 'bg-gray-700', 'text-gray-200');
        } else {
            btn.classList.remove('border-cyan-400', 'bg-cyan-500/20', 'text-cyan-300');
            btn.classList.add('border-gray-600', 'bg-gray-700', 'text-gray-200');
        }
    });
    
    // Type buttons (purple/gradient)
    document.querySelectorAll('.type-filter-btn').forEach(function(btn) {
        var filterValue = btn.dataset.filter;
        var isAll = filterValue === 'all';
        var isActive = isAll 
            ? (activeTypeFilter === null && activeInteriorFilter === null)
            : activeTypeFilter === filterValue;
        
        if (isActive) {
            btn.classList.add('active', 'gradient-bg', 'text-white');
            btn.classList.remove('bg-gray-700', 'text-gray-200');
        } else {
            btn.classList.remove('active', 'gradient-bg', 'text-white');
            btn.classList.add('bg-gray-700', 'text-gray-200');
        }
    });
}

/**
 * Filter by interior type (Walk-in/Instance)
 */
window.filterByInterior = function(interiorType, btn) {
    if (activeInteriorFilter === interiorType) {
        activeInteriorFilter = null;
    } else {
        activeInteriorFilter = interiorType;
    }
    updateFilterButtonStates();
    applyAllFilters();
};

/**
 * Filter by property type
 */
window.filterByType = function(type, btn) {
    if (type === 'all') {
        activeInteriorFilter = null;
        activeTypeFilter = null;
    } else {
        if (activeTypeFilter === type) {
            activeTypeFilter = null;
        } else {
            activeTypeFilter = type;
        }
    }
    updateFilterButtonStates();
    applyAllFilters();
};

// Legacy compatibility
window.filterProperties = function(type, btn) {
    filterByType(type, btn);
};

/**
 * Apply all active filters
 */
window.applyAllFilters = function() {
    var filtered = properties.slice();
    
    // Interior filter
    if (activeInteriorFilter) {
        filtered = filtered.filter(function(p) {
            return getPropertyValue(p, 'interiorType') === activeInteriorFilter;
        });
    }
    
    // Type filter
    if (activeTypeFilter) {
        filtered = filtered.filter(function(p) {
            return getPropertyValue(p, 'type') === activeTypeFilter;
        });
    }
    
    // My Properties
    var showMyProperties = $('showMyProperties');
    if (showMyProperties && showMyProperties.checked && auth.currentUser) {
        var userEmail = auth.currentUser.email.toLowerCase();
        filtered = filtered.filter(function(p) {
            var ownerEmail = getPropertyValue(p, 'ownerEmail') || propertyOwnerEmail[p.id];
            return ownerEmail && ownerEmail.toLowerCase() === userEmail;
        });
    }
    
    // Hide Unavailable
    var hideUnavailable = $('hideUnavailable');
    if (hideUnavailable && hideUnavailable.checked) {
        filtered = filtered.filter(function(p) {
            var availability = state.availability[p.id];
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
 * Toggle checkboxes
 */
window.toggleHideUnavailable = function() {
    applyAllFilters();
};

window.toggleMyProperties = function() {
    applyAllFilters();
};

/**
 * Sort properties
 */
window.sortProperties = function() {
    var sortBy = $('sortBy');
    if (!sortBy || !sortBy.value) return;
    
    var sortValue = sortBy.value;
    
    state.filteredProperties.sort(function(a, b) {
        if (sortValue === 'price-low') {
            return (getPropertyValue(a, 'weeklyPrice') || 0) - (getPropertyValue(b, 'weeklyPrice') || 0);
        } else if (sortValue === 'price-high') {
            return (getPropertyValue(b, 'weeklyPrice') || 0) - (getPropertyValue(a, 'weeklyPrice') || 0);
        } else if (sortValue === 'bedrooms') {
            return (getPropertyValue(b, 'bedrooms') || 0) - (getPropertyValue(a, 'bedrooms') || 0);
        } else if (sortValue === 'interior') {
            return (getPropertyValue(a, 'interiorType') || '').localeCompare(getPropertyValue(b, 'interiorType') || '');
        } else if (sortValue === 'storage') {
            return (getPropertyValue(b, 'storage') || 0) - (getPropertyValue(a, 'storage') || 0);
        }
        return 0;
    });
    
    renderProperties(state.filteredProperties);
};

/**
 * Clear all filters
 */
window.clearFilters = function() {
    activeInteriorFilter = null;
    activeTypeFilter = null;
    
    var sortBy = $('sortBy');
    if (sortBy) sortBy.selectedIndex = 0;
    
    var hideUnavailable = $('hideUnavailable');
    if (hideUnavailable) hideUnavailable.checked = false;
    
    var showMyProperties = $('showMyProperties');
    if (showMyProperties) showMyProperties.checked = false;
    
    updateFilterButtonStates();
    applyAllFilters();
};

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initFeaturedRotator, 500);
    });
} else {
    setTimeout(initFeaturedRotator, 500);
}

console.log('[Filters] Button-based filter system loaded');
