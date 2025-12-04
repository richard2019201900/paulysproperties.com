// ==================== FILTER & SORT ====================

// Central function to apply all active filters
window.applyAllFilters = function() {
    // Start with all properties
    let filtered = [...properties];
    
    // Apply type filter
    const activeFilterBtn = document.querySelector('.filter-btn.active');
    const activeFilter = activeFilterBtn ? activeFilterBtn.textContent.toLowerCase() : 'all';
    if (activeFilter !== 'all') {
        // Map button text to property types
        const typeMap = { 'houses': 'house', 'apartments': 'apartment', 'condos': 'condo', 'villas': 'villa' };
        const filterType = typeMap[activeFilter] || activeFilter;
        filtered = filtered.filter(p => p.type === filterType);
    }
    
    // Apply "My Properties" filter if checked
    const showMyProperties = $('showMyProperties')?.checked;
    if (showMyProperties && auth.currentUser) {
        const userEmail = auth.currentUser.email.toLowerCase();
        filtered = filtered.filter(p => {
            const ownerEmail = propertyOwnerEmail[p.id];
            return ownerEmail && ownerEmail.toLowerCase() === userEmail;
        });
    }
    
    // Apply "Hide Unavailable" filter if checked
    const hideUnavailable = $('hideUnavailable')?.checked;
    if (hideUnavailable) {
        filtered = filtered.filter(p => state.availability[p.id] !== false);
    }
    
    state.filteredProperties = filtered;
    renderProperties(state.filteredProperties);
};

window.toggleHideUnavailable = function() {
    applyAllFilters();
};

window.toggleMyProperties = function() {
    applyAllFilters();
};

window.filterProperties = function(type, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('active', 'gradient-bg', 'text-white');
        b.classList.add('bg-gray-700', 'text-gray-200');
    });
    btn.classList.remove('bg-gray-700', 'text-gray-200');
    btn.classList.add('active', 'gradient-bg', 'text-white');
    
    applyAllFilters();
};

window.sortProperties = function() {
    const sortBy = $('sortBy').value;
    const sorters = {
        'price-low': (a, b) => a.monthlyPrice - b.monthlyPrice,
        'price-high': (a, b) => b.monthlyPrice - a.monthlyPrice,
        'bedrooms': (a, b) => b.bedrooms - a.bedrooms,
        'interior': (a, b) => a.interiorType.localeCompare(b.interiorType),
        'storage': (a, b) => b.storage - a.storage
    };
    if (sorters[sortBy]) state.filteredProperties.sort(sorters[sortBy]);
    renderProperties(state.filteredProperties);
};

window.clearFilters = function() {
    ['searchType', 'searchInterior', 'searchPrice', 'sortBy'].forEach(id => $(id).value = '');
    // Uncheck the filter checkboxes
    const hideUnavailable = $('hideUnavailable');
    const showMyProperties = $('showMyProperties');
    if (hideUnavailable) hideUnavailable.checked = false;
    if (showMyProperties) showMyProperties.checked = false;
    
    document.querySelectorAll('.filter-btn').forEach((btn, i) => {
        toggleClass(btn, 'active', i === 0);
        toggleClass(btn, 'gradient-bg', i === 0);
        toggleClass(btn, 'text-white', i === 0);
        toggleClass(btn, 'bg-gray-700', i !== 0);
        toggleClass(btn, 'text-gray-200', i !== 0);
    });
    state.filteredProperties = [...properties];
    renderProperties(state.filteredProperties);
};

window.searchProperties = function() {
    const type = $('searchType').value;
    const interior = $('searchInterior').value;
    const price = $('searchPrice').value;
    
    state.filteredProperties = properties.filter(p => {
        if (type && p.type !== type) return false;
        if (interior && p.interiorType !== interior) return false;
        if (price) {
            const ranges = { '0-200000': [0, 200000], '200000-400000': [200000, 400000], '400000-600000': [400000, 600000], '600000+': [600000, Infinity] };
            const [min, max] = ranges[price] || [0, Infinity];
            if (p.monthlyPrice < min || p.monthlyPrice > max) return false;
        }
        return true;
    });
    renderProperties(state.filteredProperties);
    navigateTo('properties');
};
