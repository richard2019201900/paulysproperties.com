/**
 * PROPERTY FILTERS - Button-Based Filter System
 * Dual-filter: Interior (Walk-in/Instance) + Type (Houses/Apartments/etc)
 */

// Filter state
window.activeInteriorFilter = null;
window.activeTypeFilter = null;

/**
 * Get property value from Firestore-synced data
 */
function getPropertyValue(property, field) {
    return PropertyDataService.getValue(property.id, field, property[field]);
}

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
    // MUST check authentication FIRST before allowing any listing creation
    if (!auth.currentUser) {
        // Not logged in - open login modal and show create account form
        openModal('loginModal');
        // Small delay to ensure modal is open, then switch to create account
        setTimeout(function() {
            if (typeof showCreateAccountForm === 'function') {
                showCreateAccountForm();
            }
        }, 100);
        showToast('Please sign up or log in to list a property', 'info');
        return;
    }
    
    // User is logged in - open the create listing modal
    if (typeof openCreateListingModal === 'function') {
        openCreateListingModal();
    }
};

/**
 * Update button visual states
 */
function updateFilterButtonStates() {
    // Interior buttons - use data-interior attribute
    document.querySelectorAll('.interior-filter-btn').forEach(function(btn) {
        var filterValue = btn.dataset.interior;
        var isAll = filterValue === 'all';
        var isActive = isAll 
            ? (activeInteriorFilter === null || activeInteriorFilter === 'all')
            : activeInteriorFilter === filterValue;
        
        if (isActive) {
            btn.classList.add('bg-purple-600', 'text-white');
            btn.classList.remove('bg-gray-700', 'text-gray-200');
        } else {
            btn.classList.remove('bg-purple-600', 'text-white');
            btn.classList.add('bg-gray-700', 'text-gray-200');
        }
    });
    
    // Type buttons - use data-filter attribute and .filter-btn class
    document.querySelectorAll('.filter-btn').forEach(function(btn) {
        var filterValue = btn.dataset.filter;
        var isAll = filterValue === 'all';
        var isActive = isAll 
            ? (activeTypeFilter === null || activeTypeFilter === 'all')
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
    if (interiorType === 'all') {
        activeInteriorFilter = null;
    } else if (activeInteriorFilter === interiorType) {
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

