// ==================== FILTER & SORT ====================

// Central function to apply all active filters
window.applyAllFilters = function() {
    console.log('[applyAllFilters] Called. Current state.availability:', JSON.stringify(state.availability));
    
    // Start with all properties
    let filtered = [...properties];
    
    // Apply type filter
    const activeFilterBtn = document.querySelector('.filter-btn.active');
    const activeFilter = activeFilterBtn ? activeFilterBtn.textContent.toLowerCase() : 'all';
    if (activeFilter !== 'all') {
        // Map button text to property types
        const typeMap = { 
            'houses': 'house', 
            'apartments': 'apartment', 
            'condos': 'condo', 
            'villas': 'villa',
            'hotels': 'hotel',
            'warehouses': 'warehouse',
            'hideouts': 'hideout'
        };
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
    ['searchType', 'searchInterior', 'searchPrice', 'sortBy', 'searchListingType', 'searchFrequency'].forEach(id => {
        const el = $(id);
        if (el) el.value = '';
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
    
    document.querySelectorAll('.filter-btn').forEach((btn, i) => {
        toggleClass(btn, 'active', i === 0);
        toggleClass(btn, 'gradient-bg', i === 0);
        toggleClass(btn, 'text-white', i === 0);
        toggleClass(btn, 'bg-gray-700', i !== 0);
        toggleClass(btn, 'text-gray-200', i !== 0);
    });
    
    // Use applyAllFilters to ensure availability is refreshed from Firestore
    applyAllFilters();
};

// Update price options based on rental vs purchase selection
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
            freqDropdown.value = '';
        }
    }
    
    // Update price ranges based on listing type
    const frequency = freqDropdown?.value || 'weekly';
    
    if (listingType === 'purchase') {
        // Purchase price ranges (in millions)
        priceDropdown.innerHTML = `
            <option value="" disabled selected class="text-purple-400">── Purchase Price ──</option>
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
        // Rental price ranges based on frequency
        if (frequency === 'weekly') {
            priceDropdown.innerHTML = `
                <option value="" disabled selected class="text-purple-400">── Weekly Rent ──</option>
                <option value="0-25000">Under $25k/week</option>
                <option value="25000-50000">$25k - $50k/week</option>
                <option value="50000-75000">$50k - $75k/week</option>
                <option value="75000-100000">$75k - $100k/week</option>
                <option value="100000-150000">$100k - $150k/week</option>
                <option value="150000+">$150k+/week</option>
            `;
        } else if (frequency === 'biweekly') {
            priceDropdown.innerHTML = `
                <option value="" disabled selected class="text-purple-400">── Bi-Weekly Rent ──</option>
                <option value="0-50000">Under $50k/2wks</option>
                <option value="50000-100000">$50k - $100k/2wks</option>
                <option value="100000-150000">$100k - $150k/2wks</option>
                <option value="150000-200000">$150k - $200k/2wks</option>
                <option value="200000-300000">$200k - $300k/2wks</option>
                <option value="300000+">$300k+/2wks</option>
            `;
        } else if (frequency === 'monthly') {
            priceDropdown.innerHTML = `
                <option value="" disabled selected class="text-purple-400">── Monthly Rent ──</option>
                <option value="0-100000">Under $100k/mo</option>
                <option value="100000-200000">$100k - $200k/mo</option>
                <option value="200000-300000">$200k - $300k/mo</option>
                <option value="300000-500000">$300k - $500k/mo</option>
                <option value="500000-750000">$500k - $750k/mo</option>
                <option value="750000+">$750k+/mo</option>
            `;
        } else {
            // Default rental (weekly)
            priceDropdown.innerHTML = `
                <option value="" disabled selected class="text-purple-400">── Rental Price ──</option>
                <option value="0-50000">$0 - $50k</option>
                <option value="50000-100000">$50k - $100k</option>
                <option value="100000-200000">$100k - $200k</option>
                <option value="200000+">$200k+</option>
            `;
        }
    } else {
        // Default options (no selection)
        priceDropdown.innerHTML = `
            <option value="" disabled selected class="text-purple-400">── Price ──</option>
            <option value="0-50000">$0 - $50k</option>
            <option value="50000-100000">$50k - $100k</option>
            <option value="100000-200000">$100k - $200k</option>
            <option value="200000+">$200k+</option>
        `;
    }
};

window.searchProperties = function() {
    const type = $('searchType')?.value;
    const interior = $('searchInterior')?.value;
    const price = $('searchPrice')?.value;
    const listingType = $('searchListingType')?.value;
    const frequency = $('searchFrequency')?.value;
    
    state.filteredProperties = properties.filter(p => {
        // Property type filter
        if (type && p.type !== type) return false;
        
        // Interior filter
        if (interior && p.interiorType !== interior) return false;
        
        // Price filter - determine which price field to use
        if (price) {
            let priceToCheck = p.weeklyPrice || 0; // default to weekly
            
            if (listingType === 'purchase') {
                // For purchases, check purchase price (or estimate from weekly * 52 * 10 years)
                priceToCheck = p.purchasePrice || (p.weeklyPrice * 52 * 10) || 0;
            } else if (listingType === 'rental') {
                // Check based on frequency
                if (frequency === 'weekly') {
                    priceToCheck = p.weeklyPrice || 0;
                } else if (frequency === 'biweekly') {
                    priceToCheck = p.biweeklyPrice || (p.weeklyPrice * 2) || 0;
                } else if (frequency === 'monthly') {
                    priceToCheck = p.monthlyPrice || (p.weeklyPrice * 4) || 0;
                }
            } else {
                // Default to weekly price
                priceToCheck = p.weeklyPrice || 0;
            }
            
            // Parse price range
            const isPlus = price.endsWith('+');
            if (isPlus) {
                const min = parseInt(price.replace('+', ''));
                if (priceToCheck < min) return false;
            } else {
                const [min, max] = price.split('-').map(n => parseInt(n));
                if (priceToCheck < min || priceToCheck > max) return false;
            }
        }
        
        return true;
    });
    
    renderProperties(state.filteredProperties);
    navigateTo('properties');
};
