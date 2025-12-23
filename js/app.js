// ==================== DATE HELPER ====================
// Parse date string (YYYY-MM-DD) as local time, not UTC
window.parseLocalDate = function(dateStr) {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}

// Format date for display
window.formatDate = function(dateStr, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
    const date = parseLocalDate(dateStr);
    return date ? date.toLocaleDateString('en-US', options) : '';
}

// ==================== VIEW PROPERTY ====================
window.viewProperty = function(id) {
    const p = properties.find(prop => prop.id === id);
    if (!p) return;
    
    state.currentPropertyId = id;
    state.currentImages = p.images || [];
    
    // Check if property has valid images
    const hasImages = p.images && Array.isArray(p.images) && p.images.length > 0;
    const firstImage = hasImages ? p.images[0] : '';
    
    // Get premium status early for all styling
    const isPremium = PropertyDataService.getValue(id, 'isPremium', p.isPremium || false);
    
    // Image placeholder HTML
    const imagePlaceholder = `
        <div class="w-full h-60 md:h-80 bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 flex flex-col items-center justify-center rounded-xl shadow-lg border border-gray-600">
            <span class="text-7xl mb-4">🏠</span>
            <span class="text-gray-400 font-semibold text-lg">Photos Coming Soon</span>
            <span class="text-gray-500 text-sm mt-1">Check back later for property images</span>
        </div>
    `;
    
    // Image error handler
    const imgErrorHandler = "this.onerror=null; this.style.display='none'; this.insertAdjacentHTML('afterend', `<div class='w-full h-60 md:h-80 bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 flex flex-col items-center justify-center rounded-xl shadow-lg border border-gray-600'><span class='text-7xl mb-4'>🏠</span><span class='text-gray-400 font-semibold text-lg'>Photo Unavailable</span></div>`);";
    
    hideElement($('renterSection'));
    hideElement($('ownerDashboard'));
    hideElement($('propertyStatsPage'));
    showElement($('propertyDetailPage'));
    
    // Update navigation counter
    if (typeof updatePropertyNavCounter === 'function') {
        updatePropertyNavCounter();
    }
    
    const luxuryFeatures = p.features ? `
        <div class="bg-gradient-to-br from-amber-900 via-orange-900 to-red-900 p-6 md:p-10 rounded-2xl md:rounded-3xl mb-8 border-2 md:border-4 border-amber-700 shadow-2xl">
            <h3 class="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 mb-6 md:mb-8 flex items-center">
                <svg class="w-8 h-8 md:w-10 md:h-10 text-amber-400 mr-3 md:mr-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                Luxury Estate Features
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                ${[
                    {icon:'Fish', title:'500-Gallon Aquarium', desc:'Giant indoor aquarium with exotic marine life'},
                    {icon:'Kitchen', title:'Outdoor Kitchen', desc:'Professional-grade outdoor cooking station'},
                    {icon:'Pool', title:'Infinity Pool', desc:'Stunning infinity edge pool with ocean views'},
                    {icon:'Helicopter', title:'Helicopter Pad', desc:'Private landing pad for ultimate convenience'}
                ].map(f => `
                    <div class="flex items-start space-x-3 md:space-x-4 bg-black/40 p-4 md:p-5 rounded-xl md:rounded-2xl border border-amber-600/30">
                        <div class="text-3xl md:text-5xl">${f.icon}</div>
                        <div><h4 class="text-lg md:text-xl font-black text-white mb-1">${f.title}</h4><p class="text-gray-300 font-medium text-sm md:text-base">${f.desc}</p></div>
                    </div>
                `).join('')}
                <div class="flex items-start space-x-3 md:space-x-4 bg-black/40 p-4 md:p-5 rounded-xl md:rounded-2xl md:col-span-2 border border-amber-600/30">
                    <div class="text-3xl md:text-5xl">Road</div>
                    <div><h4 class="text-lg md:text-xl font-black text-white mb-1">Private Driveway</h4><p class="text-gray-300 font-medium text-sm md:text-base">Long, gated driveway ensuring complete privacy and exclusivity</p></div>
                </div>
            </div>
        </div>` : '';

    // Generate owner tabs if user is owner of this property
    const ownerTabs = (state.currentUser === 'owner' && ownsProperty(id)) ? `
        <div class="flex border-b border-gray-700">
            <button onclick="viewProperty(${id})" class="flex-1 py-4 px-6 text-center font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 border-b-2 border-purple-400">
                <svg class="w-5 h-5 inline-block mr-2 -mt-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
                Property View
            </button>
            <button onclick="viewPropertyStats(${id})" class="flex-1 py-4 px-6 text-center font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition">
                <svg class="w-5 h-5 inline-block mr-2 -mt-1" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path></svg>
                Owner Stats
            </button>
        </div>` : '';

    // Premium badge for images section
    const premiumImageBadge = isPremium 
        ? '<div class="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 px-4 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2"><span>👑</span> Premium</div>' 
        : '';

    // Build images section - show placeholder if no images
    const imagesSection = hasImages 
        ? `<div class="relative grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 p-4 md:p-6">
            ${premiumImageBadge}
            ${p.images.map((img, i) => `
                <img src="${img}" alt="${sanitize(p.title)} - Image ${i+1}" onclick="openLightbox(state.currentImages, ${i})" class="img-clickable w-full h-60 md:h-80 object-cover rounded-xl shadow-lg border border-gray-600 ${i === 0 ? 'md:col-span-2' : ''}" loading="lazy" onerror="${imgErrorHandler}">
            `).join('')}
           </div>`
        : `<div class="relative p-4 md:p-6">
            ${premiumImageBadge}
            <div class="md:col-span-2 w-full h-72 md:h-96 bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 flex flex-col items-center justify-center rounded-xl shadow-lg border border-gray-600">
                <span class="text-8xl mb-4">🏠</span>
                <span class="text-gray-400 font-semibold text-xl">Photos Coming Soon</span>
                <span class="text-gray-500 text-sm mt-2">Check back later for property images</span>
            </div>
           </div>`;
    
    // Video poster - use first image or empty
    const videoPoster = firstImage || '';

    // Premium styling - apply to container
    const detailContainer = $('propertyDetailContent');
    if (detailContainer) {
        if (isPremium) {
            detailContainer.className = 'glass-effect rounded-2xl shadow-2xl overflow-hidden border-2 border-amber-500 ring-2 ring-amber-500/50 shadow-amber-500/30';
        } else {
            detailContainer.className = 'glass-effect rounded-2xl shadow-2xl overflow-hidden';
        }
    }

    // Premium banner for top of page - same style as Owner Stats
    // Note: rounded-t-2xl for top corners when there are no owner tabs above
    const premiumBanner = isPremium 
        ? `<div class="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-gray-900 text-center py-2 font-black text-sm tracking-wider flex items-center justify-center gap-2">
            <span>👑</span> PREMIUM LISTING <span>👑</span>
           </div>` 
        : '';

    $('propertyDetailContent').innerHTML = `
        ${premiumBanner}
        ${ownerTabs}
        ${p.videoUrl ? `
        <div class="p-4 md:p-6 bg-gradient-to-r from-red-900 to-pink-900 border-b border-gray-700">
            <div class="flex items-center space-x-3 mb-4">
                <svg class="w-6 h-6 md:w-8 md:h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"></path></svg>
                <h3 class="text-xl md:text-2xl font-black text-white">Virtual Video Tour</h3>
            </div>
            <video controls autoplay muted playsinline class="w-full rounded-xl shadow-2xl border border-gray-600" ${videoPoster ? `poster="${videoPoster}"` : ''}>
                <source src="${p.videoUrl}" type="video/mp4">
            </video>
        </div>` : ''}
        ${imagesSection}
        <div class="p-5 md:p-8">
            <div class="flex flex-wrap justify-between items-start gap-4 mb-6">
                <div>
                    <h2 class="text-2xl md:text-4xl font-black text-white mb-2">✨ ${sanitize(p.title)}</h2>
                    <p class="text-lg md:text-xl text-gray-300 font-semibold">📝 Description: ${sanitize(p.location)}</p>
                    <p id="propertyOwnerDisplay" class="text-blue-400 font-semibold mt-1">👤 Owner: Loading...</p>
                </div>
                <span class="badge text-white text-sm font-bold px-4 py-2 rounded-full uppercase">${PropertyDataService.getValue(id, 'type', p.type)}</span>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
                ${[
                    {icon:'🛏️', val:PropertyDataService.getValue(id, 'bedrooms', p.bedrooms), label:'Bedrooms'},
                    {icon:'🛁', val:PropertyDataService.getValue(id, 'bathrooms', p.bathrooms), label:'Bathrooms'},
                    {icon:'📦', val:PropertyDataService.getValue(id, 'storage', p.storage).toLocaleString(), label:'Storage Space'},
                    {icon:'🏠', val:PropertyDataService.getValue(id, 'interiorType', p.interiorType), label:'Interior'}
                ].map(s => `
                    <div class="text-center p-3 md:p-4 bg-gray-700 rounded-xl border border-gray-600">
                        <div class="text-2xl md:text-3xl mb-2">${s.icon}</div>
                        <div class="text-xl md:text-2xl font-bold text-white">${s.val}</div>
                        <div class="text-xs md:text-sm text-gray-300 font-semibold">${s.label}</div>
                    </div>
                `).join('')}
            </div>
            ${luxuryFeatures}
            <div class="bg-gray-800 p-5 md:p-8 rounded-2xl mb-8 border border-gray-700">
                <h3 class="text-xl font-bold text-white mb-4">💰 Pricing Options</h3>
                ${(() => {
                    const dailyPrice = PropertyDataService.getValue(id, 'dailyPrice', p.dailyPrice || 0);
                    const weeklyPrice = PropertyDataService.getValue(id, 'weeklyPrice', p.weeklyPrice || 0);
                    const biweeklyPrice = PropertyDataService.getValue(id, 'biweeklyPrice', p.biweeklyPrice || 0);
                    const monthlyPrice = PropertyDataService.getValue(id, 'monthlyPrice', p.monthlyPrice || 0);
                    const buyPrice = PropertyDataService.getValue(id, 'buyPrice', p.buyPrice || 0);
                    
                    // Calculate discounts based on daily rate (or weekly/7 if no daily)
                    const baseDaily = dailyPrice > 0 ? dailyPrice : Math.round(weeklyPrice / 7);
                    
                    const calcDiscount = (actualPrice, equivalentDays) => {
                        if (baseDaily <= 0 || actualPrice <= 0) return 0;
                        const fullPrice = baseDaily * equivalentDays;
                        const discount = Math.round(((fullPrice - actualPrice) / fullPrice) * 100);
                        return discount > 0 ? discount : 0;
                    };
                    
                    const weeklyDiscount = calcDiscount(weeklyPrice, 7);
                    const biweeklyDiscount = calcDiscount(biweeklyPrice, 14);
                    const monthlyDiscount = calcDiscount(monthlyPrice, 30);
                    
                    // Helper function to get dynamic text size based on price
                    const getPriceTextSize = (price) => {
                        if (price >= 10000000) return 'text-base md:text-lg'; // 10M+
                        if (price >= 1000000) return 'text-lg md:text-xl';   // 1M+
                        return 'text-xl md:text-2xl';                         // Under 1M
                    };
                    
                    const getLargePriceTextSize = (price) => {
                        if (price >= 10000000) return 'text-lg md:text-xl'; // 10M+
                        if (price >= 1000000) return 'text-xl md:text-2xl';   // 1M+
                        return 'text-2xl md:text-3xl';                         // Under 1M
                    };
                    
                    let html = '<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">';
                    
                    // Daily
                    if (dailyPrice > 0) {
                        html += '<div class="bg-gradient-to-br from-cyan-600/20 to-teal-700/20 border border-cyan-500/50 rounded-xl p-4 text-center">';
                        html += '<div class="text-cyan-400 text-xs font-bold mb-1">DAILY</div>';
                        html += '<div class="text-white ' + getPriceTextSize(dailyPrice) + ' font-black truncate">$' + dailyPrice.toLocaleString() + '</div>';
                        html += '</div>';
                    }
                    
                    // Weekly
                    if (weeklyPrice > 0) {
                        html += '<div class="bg-gradient-to-br from-blue-600/20 to-blue-700/20 border border-blue-500/50 rounded-xl p-4 text-center relative">';
                        if (weeklyDiscount > 0) {
                            html += '<div class="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">SAVE ' + weeklyDiscount + '%</div>';
                        }
                        html += '<div class="text-blue-400 text-xs font-bold mb-1">WEEKLY</div>';
                        html += '<div class="text-white ' + getPriceTextSize(weeklyPrice) + ' font-black truncate">$' + weeklyPrice.toLocaleString() + '</div>';
                        html += '</div>';
                    }
                    
                    // Biweekly
                    if (biweeklyPrice > 0) {
                        html += '<div class="bg-gradient-to-br from-purple-600/20 to-violet-700/20 border border-purple-500/50 rounded-xl p-4 text-center relative">';
                        if (biweeklyDiscount > 0) {
                            html += '<div class="absolute -top-2 -right-2 bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">SAVE ' + biweeklyDiscount + '%</div>';
                        }
                        html += '<div class="text-purple-400 text-xs font-bold mb-1">BIWEEKLY</div>';
                        html += '<div class="text-white ' + getPriceTextSize(biweeklyPrice) + ' font-black truncate">$' + biweeklyPrice.toLocaleString() + '</div>';
                        html += '</div>';
                    }
                    
                    // Monthly (featured)
                    if (monthlyPrice > 0) {
                        html += '<div class="bg-gradient-to-br from-green-600/20 to-emerald-700/20 border-2 border-green-500 rounded-xl p-4 text-center relative">';
                        if (monthlyDiscount > 0) {
                            html += '<div class="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">SAVE ' + monthlyDiscount + '%</div>';
                        }
                        html += '<div class="text-green-400 text-xs font-bold mb-1">⭐ MONTHLY</div>';
                        html += '<div class="text-green-400 ' + getLargePriceTextSize(monthlyPrice) + ' font-black truncate">$' + monthlyPrice.toLocaleString() + '</div>';
                        html += '<div class="text-green-300/70 text-[10px] mt-1">Best Value</div>';
                        html += '</div>';
                    }
                    
                    // Buy Price
                    if (buyPrice > 0) {
                        const feeAmount = Math.round(buyPrice * 0.1);
                        html += '<div class="bg-gradient-to-br from-amber-600/20 to-orange-700/20 border-2 border-amber-500 rounded-xl p-4 text-center overflow-hidden">';
                        html += '<div class="text-amber-400 text-xs font-bold mb-1">🏠 OWN IT</div>';
                        html += '<div class="text-amber-400 ' + getLargePriceTextSize(buyPrice) + ' font-black truncate">$' + buyPrice.toLocaleString() + '</div>';
                        html += '<div class="text-amber-300/70 text-[10px] mt-1 truncate">+10% PMA Realtor Fee ($' + feeAmount.toLocaleString() + ')</div>';
                        html += '</div>';
                    }
                    
                    html += '</div>';
                    return html;
                })()}
            </div>
            <button id="offerRentBtn" onclick="openContactModal('rent', '${sanitize(p.title)}', ${id})" class="w-full gradient-bg text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-black text-lg md:text-xl hover:opacity-90 transition shadow-lg mb-4">Make an Offer to Rent</button>
            <button id="offerPurchaseBtn" onclick="openContactModal('offer', '${sanitize(p.title)}', ${id})" class="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-black text-lg md:text-xl hover:opacity-90 transition shadow-lg">Make an Offer to Purchase</button>
        </div>`;
    
    displayReviews(id);
    
    // Load and display owner username with tier badge
    getPropertyOwnerWithTier(id).then(ownerInfo => {
        const ownerEl = $('propertyOwnerDisplay');
        if (ownerEl) {
            const isAdmin = TierService.isMasterAdmin(auth.currentUser?.email);
            if (isAdmin) {
                ownerEl.innerHTML = `👤 Owner: ${ownerInfo.display} <button onclick="openReassignModal(${id})" class="ml-2 text-xs bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded transition">✏️ Change</button>`;
            } else {
                ownerEl.innerHTML = `👤 Owner: ${ownerInfo.display}`;
            }
        }
    });
    
    window.scrollTo(0, 0);
};

// Navigate to property page and highlight the offer buttons
window.viewPropertyAndHighlightOffers = function(id) {
    viewProperty(id);
    
    // Wait for DOM to update, then highlight the offer buttons
    setTimeout(() => {
        const rentBtn = $('offerRentBtn');
        const purchaseBtn = $('offerPurchaseBtn');
        
        if (rentBtn && purchaseBtn) {
            // Add highlight animation class
            const highlightClass = 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-gray-900 animate-pulse';
            
            rentBtn.className += ' ' + highlightClass;
            purchaseBtn.className += ' ' + highlightClass;
            
            // Scroll to buttons
            rentBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Add a tooltip/label
            const tipHtml = `
                <div id="offerTip" class="bg-yellow-500 text-gray-900 font-bold px-4 py-2 rounded-lg mb-4 text-center animate-bounce shadow-lg">
                    👇 Choose your offer type below 👇
                </div>
            `;
            rentBtn.insertAdjacentHTML('beforebegin', tipHtml);
            
            // Remove highlight after 5 seconds
            setTimeout(() => {
                rentBtn.className = rentBtn.className.replace(/ ring-4 ring-yellow-400 ring-offset-2 ring-offset-gray-900 animate-pulse/g, '');
                purchaseBtn.className = purchaseBtn.className.replace(/ ring-4 ring-yellow-400 ring-offset-2 ring-offset-gray-900 animate-pulse/g, '');
                const tip = $('offerTip');
                if (tip) tip.remove();
            }, 5000);
        }
    }, 100);
};

// ==================== PROPERTY STATS PAGE ====================
/**
 * Renders the property stats page with EDITABLE tiles
 * All editable fields sync in real-time with Firestore
 */
window.viewPropertyStats = async function(id) {
    const p = properties.find(prop => prop.id === id);
    if (!p) {
        console.error('[viewPropertyStats] Property not found:', id);
        return;
    }
    
    // Check if owner owns this property
    if (!ownsProperty(id)) {
        console.warn('[viewPropertyStats] Access denied for property:', id);
        alert('You do not have access to this property.');
        return;
    }
    state.currentPropertyId = id;
    state.currentImages = p.images;
    
    // Fetch fresh data from Firestore and sync to local properties array
    try {
        const freshData = await PropertyDataService.read(id);
        if (freshData.exists) {
            // Data is automatically synced to properties array by PropertyDataService.read()
            console.log('[ViewPropertyStats] Fresh data loaded for property', id);
        }
    } catch (error) {
        console.error('Error fetching property data:', error);
    }
    
    // Set up real-time listener for all properties
    PropertyDataService.subscribeAll((data) => {
        // Re-render when data changes from another source
        if (state.currentPropertyId === id) {
            renderPropertyStatsContent(id);
            loadStatsOwnerName(id);
        }
    });
    
    // Note: Property deletion notifications are handled by the global listener
    // in setupGlobalPropertiesListener() which watches the propertyDeletions collection
    // filtered by the logged-in user's email - so only the OWNER sees the notification
    
    renderPropertyStatsContent(id);
    loadStatsOwnerName(id);
    
    // Load property analytics (async - will populate the analytics section)
    setTimeout(() => {
        if (typeof renderPropertyAnalytics === 'function') {
            renderPropertyAnalytics(id);
        }
    }, 100);
    
    hideElement($('ownerDashboard'));
    hideElement($('renterSection'));
    hideElement($('propertyDetailPage'));
    showElement($('propertyStatsPage'));
    window.scrollTo(0, 0);
    
    // Update stats navigation counter
    if (typeof updateStatsNavCounter === 'function') {
        updateStatsNavCounter();
    }
};

// Load owner name for stats page
async function loadStatsOwnerName(propertyId) {
    const ownerEl = $(`stats-owner-${propertyId}`);
    if (!ownerEl) return;
    
    try {
        // Use tier-aware username lookup
        const ownerInfo = await getPropertyOwnerWithTier(propertyId);
        const spanEl = ownerEl.querySelector('span');
        if (spanEl) {
            spanEl.textContent = ownerInfo.display;
        }
    } catch (error) {
        console.error('Error loading owner name:', error);
        const ownerEmail = propertyOwnerEmail[propertyId];
        const spanEl = ownerEl.querySelector('span');
        if (spanEl) {
            spanEl.textContent = ownerEmail ? ownerEmail.split('@')[0] : 'Unknown';
        }
    }
}

/**
 * Renders the property stats content with editable tiles
 */
function renderPropertyStatsContent(id) {
    const p = properties.find(prop => prop.id === id);
    if (!p) return;
    
    const isAvailable = state.availability[id] !== false;
    const statusClass = isAvailable ? 'from-green-600 to-emerald-600' : 'from-red-600 to-pink-600';
    const statusText = isAvailable ? 'Available' : 'Rented';
    
    // Get premium status
    const isPremium = PropertyDataService.getValue(id, 'isPremium', p.isPremium || false);
    const isPremiumTrial = PropertyDataService.getValue(id, 'isPremiumTrial', p.isPremiumTrial || false);
    const premiumStartDate = PropertyDataService.getValue(id, 'premiumStartDate', p.premiumStartDate || '');
    const premiumLastPayment = PropertyDataService.getValue(id, 'premiumLastPayment', p.premiumLastPayment || '');
    
    // Calculate premium next due date (weekly)
    let premiumNextDue = '';
    let premiumDaysUntilDue = null;
    if (isPremium && !isPremiumTrial && premiumLastPayment) {
        const lastDate = parseLocalDate(premiumLastPayment);
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + 7); // Weekly premium fee
        premiumNextDue = nextDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        nextDate.setHours(0, 0, 0, 0);
        premiumDaysUntilDue = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
    }
    
    // Get effective values (overrides or defaults)
    const bedrooms = PropertyDataService.getValue(id, 'bedrooms', p.bedrooms);
    const bathrooms = PropertyDataService.getValue(id, 'bathrooms', p.bathrooms);
    const storage = PropertyDataService.getValue(id, 'storage', p.storage);
    const interiorType = PropertyDataService.getValue(id, 'interiorType', p.interiorType);
    const propertyType = PropertyDataService.getValue(id, 'type', p.type);
    const dailyPrice = PropertyDataService.getValue(id, 'dailyPrice', p.dailyPrice || 0);
    const weeklyPrice = PropertyDataService.getValue(id, 'weeklyPrice', p.weeklyPrice);
    const biweeklyPrice = PropertyDataService.getValue(id, 'biweeklyPrice', p.biweeklyPrice || 0);
    const monthlyPrice = PropertyDataService.getValue(id, 'monthlyPrice', p.monthlyPrice);
    const buyPrice = PropertyDataService.getValue(id, 'buyPrice', p.buyPrice || 0);
    
    // Get reviews for this property
    const propertyReviews = state.reviews[id] || [];
    const avgRating = propertyReviews.length > 0 
        ? (propertyReviews.reduce((sum, r) => sum + r.rating, 0) / propertyReviews.length).toFixed(1)
        : 'N/A';
    
    // Renter & Payment info
    const renterName = PropertyDataService.getValue(id, 'renterName', p.renterName || '');
    const renterPhoneRaw = PropertyDataService.getValue(id, 'renterPhone', p.renterPhone || '');
    const renterPhone = renterPhoneRaw ? renterPhoneRaw.replace(/\D/g, '') : '';
    const renterNotes = PropertyDataService.getValue(id, 'renterNotes', p.renterNotes || '');
    const paymentFrequency = PropertyDataService.getValue(id, 'paymentFrequency', p.paymentFrequency || '');
    const lastPaymentDate = PropertyDataService.getValue(id, 'lastPaymentDate', p.lastPaymentDate || '');
    
    // DEBUG: Log what we're getting
    console.log('[PropertyStats] Rendering property', id, '- renterName:', renterName, '- available:', state.availability[id]);
    
    // NOTE: Removed AUTO-FIX logic that was causing race conditions with lease completion
    // The availability status should be explicitly managed via toggleAvailability/saveAvailability
    // and the completeLease flow, not auto-corrected based on potentially stale data
    
    // Calculate next due date and days until due
    let nextDueDate = '';
    let daysUntilDue = null;
    let reminderScript = '';
    
    if (lastPaymentDate) {
        const lastDate = parseLocalDate(lastPaymentDate);
        const nextDate = new Date(lastDate);
        if (paymentFrequency === 'daily') {
            nextDate.setDate(nextDate.getDate() + 1);
        } else if (paymentFrequency === 'weekly') {
            nextDate.setDate(nextDate.getDate() + 7);
        } else if (paymentFrequency === 'biweekly') {
            nextDate.setDate(nextDate.getDate() + 14);
        } else {
            nextDate.setMonth(nextDate.getMonth() + 1);
        }
        nextDueDate = nextDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        nextDate.setHours(0, 0, 0, 0);
        daysUntilDue = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
        
        // Generate reminder script if 1 day away or overdue
        // Determine amount based on frequency
        const biweeklyPrice = PropertyDataService.getValue(id, 'biweeklyPrice', p.biweeklyPrice || 0);
        let amountDue = weeklyPrice;
        if (paymentFrequency === 'daily' && dailyPrice > 0) {
            amountDue = dailyPrice;
        } else if (paymentFrequency === 'biweekly' && biweeklyPrice > 0) {
            amountDue = biweeklyPrice;
        } else if (paymentFrequency === 'monthly' && monthlyPrice > 0) {
            amountDue = monthlyPrice;
        } else if (paymentFrequency === 'daily') {
            amountDue = Math.round(weeklyPrice / 7);
        } else if (paymentFrequency === 'biweekly') {
            amountDue = weeklyPrice * 2;
        } else if (paymentFrequency === 'monthly') {
            amountDue = weeklyPrice * 4;
        }
        
        if (renterName && daysUntilDue <= 1) {
            if (daysUntilDue === 1) {
                reminderScript = `Hey ${renterName}! 👋 Just a friendly reminder that your ${paymentFrequency} rent payment of $${amountDue.toLocaleString()} is due tomorrow (${nextDueDate}). Let me know if you have any questions!`;
            } else if (daysUntilDue === 0) {
                reminderScript = `Hey ${renterName}! 👋 Just a friendly reminder that your ${paymentFrequency} rent payment of $${amountDue.toLocaleString()} is due today (${nextDueDate}). Let me know if you have any questions!`;
            } else {
                const daysOverdue = Math.abs(daysUntilDue);
                if (daysOverdue >= 3) {
                    // 3+ days overdue - eviction warning
                    reminderScript = `Hey ${renterName}, your ${paymentFrequency} rent payment of $${amountDue.toLocaleString()} was due on ${nextDueDate} (${daysOverdue} day${daysOverdue > 1 ? 's' : ''} ago). ⚠️ You are scheduled for eviction in 24 hours if payment is not received. Please make your payment immediately or contact me to discuss your situation.`;
                } else {
                    reminderScript = `Hey ${renterName}, your ${paymentFrequency} rent payment of $${amountDue.toLocaleString()} was due on ${nextDueDate} (${daysOverdue} day${daysOverdue > 1 ? 's' : ''} ago). Please make your payment as soon as possible. Let me know if you need to discuss anything!`;
                }
            }
        }
    }
    
    const showReminderSection = renterName && (daysUntilDue !== null && daysUntilDue <= 1);
    
    // Premium styling - apply to container (same approach as Property View)
    const statsContainer = $('propertyStatsContent');
    if (statsContainer) {
        if (isPremium) {
            statsContainer.className = 'glass-effect rounded-2xl shadow-2xl overflow-hidden border-2 border-amber-500 ring-2 ring-amber-500/50 shadow-amber-500/30';
        } else {
            statsContainer.className = 'glass-effect rounded-2xl shadow-2xl overflow-hidden';
        }
    }
    
    // Premium banner inside container (same as Property View)
    const premiumBanner = isPremium 
        ? `<div class="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-gray-900 text-center py-2 font-black text-sm tracking-wider flex items-center justify-center gap-2">
            <span>👑</span> PREMIUM LISTING <span>👑</span>
           </div>` 
        : '';

    $('propertyStatsContent').innerHTML = `
        ${premiumBanner}
        <!-- View Toggle Tabs - full width, no padding needed -->
        <div class="flex border-b border-gray-700">
            <button onclick="viewProperty(${id})" class="flex-1 py-4 px-6 text-center font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition">
                <svg class="w-5 h-5 inline-block mr-2 -mt-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
                Property View
            </button>
            <button onclick="viewPropertyStats(${id})" class="flex-1 py-4 px-6 text-center font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 border-b-2 border-amber-400">
                <svg class="w-5 h-5 inline-block mr-2 -mt-1" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path></svg>
                Owner Stats
            </button>
        </div>
        
        <!-- Property Header -->
        <div class="relative">
            <img src="${p.images[0]}" alt="${sanitize(p.title)}" class="w-full h-64 md:h-80 object-cover">
            <div class="absolute top-4 right-4 bg-gradient-to-r ${statusClass} text-white px-4 py-2 rounded-xl font-bold shadow-lg">
                ${statusText}
            </div>
            ${isPremium ? '<div class="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 px-4 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2"><span>👑</span> Premium</div>' : ''}
            </div>
            
            <div class="p-6 md:p-8">
                <div class="flex flex-wrap justify-between items-start gap-4 mb-6">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-2xl">✨</span>
                            <h2 id="editable-title-${id}" 
                                class="text-3xl md:text-4xl font-black ${isPremium ? 'text-amber-300' : 'text-white'} cursor-pointer hover:text-purple-300 transition inline-block"
                                onclick="startEditField('title', ${id}, this)"
                                title="Click to edit address">
                                ${sanitize(p.title)}
                            </h2>
                            <span class="text-purple-400 text-sm">✏️</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span>📝</span>
                            <span class="text-lg text-gray-300 font-semibold">Description:</span>
                            <span id="editable-location-${id}" 
                                  class="text-lg text-gray-300 font-semibold cursor-pointer hover:text-purple-300 transition"
                                  onclick="startEditField('location', ${id}, this)"
                                  title="Click to edit description">
                                ${sanitize(p.location)}
                            </span>
                            <span class="text-purple-400 text-sm">✏️</span>
                        </div>
                    </div>
                    <div class="flex flex-col items-end gap-2">
                        <span id="tile-type-${id}" 
                              class="badge text-white text-sm font-bold px-4 py-2 rounded-full uppercase cursor-pointer hover:ring-2 hover:ring-purple-400 transition flex items-center gap-2"
                              onclick="startEditPropertyType(${id})"
                              data-field="type"
                              data-original-value="${propertyType}"
                              title="Click to change property type">
                            ${propertyType}
                            <svg class="w-3.5 h-3.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </span>
                        <span id="stats-owner-${id}" class="bg-blue-600/80 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                            <span>Loading...</span>
                        </span>
                    </div>
                </div>
                
                <div class="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/30 rounded-xl p-4 mb-6">
                    <p class="text-purple-200 font-semibold text-center">Click any tile below to edit - Changes sync in real-time across all pages</p>
                </div>
                
                <!-- EDITABLE Quick Stats Grid -->
                <h3 class="text-xl font-bold text-gray-200 mb-4">Property Details <span class="text-sm text-purple-400">(Click to edit)</span></h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" id="editableStatsGrid">
                    <!-- Bedrooms Tile -->
                    <div id="tile-bedrooms-${id}" 
                         class="stat-tile text-center p-4 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl border border-indigo-500 cursor-pointer"
                         onclick="startEditTile('bedrooms', ${id}, 'number')"
                         data-field="bedrooms"
                         data-original-value="${bedrooms}">
                        <div class="text-2xl mb-2">🛏️</div>
                        <div id="value-bedrooms-${id}" class="text-xl font-bold text-white">${bedrooms}</div>
                        <div class="text-sm text-indigo-200">Bedrooms</div>
                        <div class="text-xs text-indigo-300 mt-1 opacity-70">Click to edit</div>
                    </div>
                    
                    <!-- Bathrooms Tile -->
                    <div id="tile-bathrooms-${id}" 
                         class="stat-tile text-center p-4 bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-xl border border-cyan-500 cursor-pointer"
                         onclick="startEditTile('bathrooms', ${id}, 'number')"
                         data-field="bathrooms"
                         data-original-value="${bathrooms}">
                        <div class="text-2xl mb-2">🛁</div>
                        <div id="value-bathrooms-${id}" class="text-xl font-bold text-white">${bathrooms}</div>
                        <div class="text-sm text-cyan-200">Bathrooms</div>
                        <div class="text-xs text-cyan-300 mt-1 opacity-70">Click to edit</div>
                    </div>
                    
                    <!-- Storage Tile -->
                    <div id="tile-storage-${id}" 
                         class="stat-tile text-center p-4 bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl border border-amber-500 cursor-pointer"
                         onclick="startEditTile('storage', ${id}, 'number')"
                         data-field="storage"
                         data-original-value="${storage}">
                        <div class="text-2xl mb-2">📦</div>
                        <div id="value-storage-${id}" class="text-xl font-bold text-white">${storage.toLocaleString()}</div>
                        <div class="text-sm text-amber-200">Storage Space</div>
                        <div class="text-xs text-amber-300 mt-1 opacity-70">Click to edit</div>
                    </div>
                    
                    <!-- Interior Type Tile -->
                    <div id="tile-interiorType-${id}" 
                         class="stat-tile text-center p-4 bg-gradient-to-br from-rose-600 to-rose-800 rounded-xl border border-rose-500 cursor-pointer"
                         onclick="startEditTile('interiorType', ${id}, 'select')"
                         data-field="interiorType"
                         data-original-value="${interiorType}">
                        <div class="text-2xl mb-2">🏠</div>
                        <div id="value-interiorType-${id}" class="text-xl font-bold text-white">${interiorType}</div>
                        <div class="text-sm text-rose-200">Interior</div>
                        <div class="text-xs text-rose-300 mt-1 opacity-70">Click to edit</div>
                    </div>
                </div>
                
                <!-- Property Images Gallery -->
                <div class="glass-effect rounded-2xl shadow-2xl p-6 md:p-8 mb-8">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-2xl font-bold text-gray-200">📸 Property Images</h3>
                        <button onclick="openAddImageModal(${id})" class="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:opacity-90 transition shadow-lg flex items-center gap-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                            Add Image
                        </button>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4" id="images-grid-${id}">
                        ${p.images.map((img, i) => `
                            <div class="relative group">
                                <img src="${img}" alt="${sanitize(p.title)} - Image ${i+1}" onclick="openLightbox(state.currentImages, ${i})" class="img-clickable w-full h-32 md:h-40 object-cover rounded-xl shadow-lg border border-gray-600" loading="lazy">
                                <button onclick="deletePropertyImage(${id}, ${i}, '${img.replace(/'/g, "\\'")}')" class="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition shadow-lg" title="Delete image">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    ${p.images.length === 0 ? '<p class="text-gray-500 text-center py-8">No images yet. Add some images to showcase your property!</p>' : ''}
                </div>
                
                <!-- Renter & Payment Info -->
                <h3 class="text-xl font-bold text-gray-200 mb-4">Renter & Payment Info <span class="text-sm text-purple-400">(Click to edit)</span></h3>
                
                <!-- Renter Info Row -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <!-- Renter Name -->
                    <div id="tile-renterName-${id}" 
                         class="stat-tile p-4 bg-gradient-to-br from-sky-600 to-sky-800 rounded-xl border border-sky-500 cursor-pointer"
                         onclick="startEditTile('renterName', ${id}, 'text')"
                         data-field="renterName"
                         data-original-value="${sanitize(renterName)}">
                        <div class="flex items-center gap-3 mb-1">
                            <svg class="w-6 h-6 text-sky-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                            <span class="text-sky-200 font-semibold">Renter Name</span>
                        </div>
                        <div class="text-xs text-sky-300 mb-2 opacity-80">🔒 Only you can see this</div>
                        <div id="value-renterName-${id}" class="text-lg font-bold text-white">${renterName || '<span class="text-sky-300 opacity-70">Not set</span>'}</div>
                        <div class="text-xs text-sky-300 mt-2 opacity-70">${renterName ? 'Click to edit' : '⚠️ Set before selecting last payment date'}</div>
                    </div>
                    
                    <!-- Renter Phone -->
                    <div class="stat-tile p-4 bg-gradient-to-br from-pink-600 to-pink-800 rounded-xl border border-pink-500">
                        <div class="flex items-center justify-between mb-1">
                            <div class="flex items-center gap-3">
                                <svg class="w-6 h-6 text-pink-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                <span class="text-pink-200 font-semibold">Renter Phone</span>
                            </div>
                            ${renterPhone ? `
                            <button onclick="event.stopPropagation(); copyRenterPhone('${renterPhone}', this)" class="bg-pink-500 hover:bg-pink-400 text-white px-2 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1" title="Copy phone number">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                                Copy
                            </button>
                            ` : ''}
                        </div>
                        <div class="text-xs text-pink-300 mb-2 opacity-80">🔒 Only you can see this</div>
                        <div id="tile-renterPhone-${id}" 
                             class="cursor-pointer"
                             onclick="startEditTile('renterPhone', ${id}, 'tel')"
                             data-field="renterPhone"
                             data-original-value="${sanitize(renterPhone)}">
                            <div id="value-renterPhone-${id}" class="text-lg font-bold text-white">${renterPhone || '<span class="text-pink-300 opacity-70">Not set</span>'}</div>
                            <div class="text-xs text-pink-300 mt-2 opacity-70">Click to edit</div>
                        </div>
                    </div>
                    
                    <!-- Renter Notes -->
                    <div id="tile-renterNotes-${id}" 
                         class="stat-tile p-4 bg-gradient-to-br from-violet-600 to-violet-800 rounded-xl border border-violet-500 cursor-pointer"
                         onclick="startEditTile('renterNotes', ${id}, 'textarea')"
                         data-field="renterNotes"
                         data-original-value="${sanitize(renterNotes)}">
                        <div class="flex items-center gap-3 mb-1">
                            <svg class="w-6 h-6 text-violet-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            <span class="text-violet-200 font-semibold">Private Renter Notes</span>
                        </div>
                        <div class="text-xs text-violet-300 mb-2 opacity-80">🔒 Only you can see this</div>
                        <div id="value-renterNotes-${id}" class="text-sm font-medium text-white" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${renterNotes || '<span class="text-violet-300 opacity-70">e.g. Prefers upfront monthly discounts</span>'}</div>
                        <div class="text-xs text-violet-300 mt-2 opacity-70">Click to edit</div>
                    </div>
                </div>
                
                <!-- Payment Info Row -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div id="tile-paymentFrequency-${id}" 
                         class="stat-tile p-4 bg-gradient-to-br from-teal-600 to-teal-800 rounded-xl border border-teal-500 cursor-pointer"
                         onclick="startEditTile('paymentFrequency', ${id}, 'frequency')"
                         data-field="paymentFrequency"
                         data-original-value="${paymentFrequency}">
                        <div class="flex items-center gap-3 mb-2">
                            <svg class="w-6 h-6 text-teal-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <span class="text-teal-200 font-semibold">Payment Frequency</span>
                        </div>
                        <div id="value-paymentFrequency-${id}" class="text-lg font-bold text-white capitalize">${paymentFrequency || '<span class="text-teal-300 opacity-70">Not Set</span>'}</div>
                        <div class="text-xs text-teal-300 mt-2 opacity-70">${paymentFrequency ? 'Click to edit' : '⚠️ Set before selecting last payment date'}</div>
                    </div>
                    
                    <!-- Last Payment Date -->
                    <div id="tile-lastPaymentDate-${id}" 
                         class="stat-tile p-4 bg-gradient-to-br from-lime-600 to-lime-800 rounded-xl border border-lime-500 cursor-pointer"
                         onclick="startEditTile('lastPaymentDate', ${id}, 'date')"
                         data-field="lastPaymentDate"
                         data-original-value="${lastPaymentDate}">
                        <div class="flex items-center gap-3 mb-2">
                            <svg class="w-6 h-6 text-lime-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            <span class="text-lime-200 font-semibold">Last Payment</span>
                        </div>
                        <div id="value-lastPaymentDate-${id}" class="text-lg font-bold text-white">${lastPaymentDate ? formatDate(lastPaymentDate) : '<span class="text-lime-300 opacity-70">Not set</span>'}</div>
                        <div class="text-xs text-lime-300 mt-2 opacity-70">${(!renterName || !paymentFrequency) ? '⚠️ Set renter name & frequency first!' : 'Click to edit'}</div>
                    </div>
                    
                    <!-- Next Due Date (calculated, not editable) -->
                    <div class="stat-tile p-4 bg-gradient-to-br ${daysUntilDue !== null && daysUntilDue <= 1 ? 'from-red-600 to-red-800 border-red-500' : 'from-gray-600 to-gray-800 border-gray-500'} rounded-xl border">
                        <div class="flex items-center gap-3 mb-2">
                            <svg class="w-6 h-6 ${daysUntilDue !== null && daysUntilDue <= 1 ? 'text-red-200' : 'text-gray-200'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <span class="${daysUntilDue !== null && daysUntilDue <= 1 ? 'text-red-200' : 'text-gray-200'} font-semibold">Next Due Date</span>
                        </div>
                        <div class="text-lg font-bold text-white">${nextDueDate || '<span class="opacity-70">Set last payment</span>'}</div>
                        ${daysUntilDue !== null ? `<div class="text-xs ${daysUntilDue <= 1 ? 'text-red-200 font-bold' : 'text-gray-300'} mt-2">${daysUntilDue === 0 ? '⚠️ Due today!' : daysUntilDue === 1 ? '⚠️ Due tomorrow!' : daysUntilDue < 0 ? '🚨 ' + Math.abs(daysUntilDue) + ' day(s) overdue!' : daysUntilDue + ' days remaining'}</div>` : '<div class="text-xs text-gray-400 mt-2">Auto-calculated</div>'}
                    </div>
                </div>
                
                <!-- Complete Lease Action (only shows when renter is assigned) -->
                ${renterName ? `
                <div class="bg-gradient-to-r from-gray-800/80 to-gray-900/80 border border-gray-600 rounded-xl p-4 mb-4">
                    <div class="flex flex-col gap-4">
                        <!-- Complete Lease -->
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h4 class="text-gray-200 font-bold flex items-center gap-2">
                                    <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    Renter Moving Out?
                                </h4>
                                <p class="text-gray-400 text-sm mt-1">Complete the lease to finalize payment history, clear renter info, and mark available</p>
                            </div>
                            <button onclick="showCompleteLeaseModal(${id})" class="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 whitespace-nowrap shadow-lg">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                                Complete Lease
                            </button>
                        </div>
                        
                        <div class="border-t border-gray-700"></div>
                        
                        <!-- Eviction -->
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h4 class="text-gray-200 font-bold flex items-center gap-2">
                                    <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                                    Evict Renter?
                                </h4>
                                <p class="text-gray-400 text-sm mt-1">Remove renter for non-payment, clear their info, and mark property available</p>
                            </div>
                            <button onclick="showEvictionModal(${id})" class="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 whitespace-nowrap shadow-lg">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                                Evict Renter
                            </button>
                        </div>
                    </div>
                </div>
                ` : ''}
                
                <!-- Reminder Script (only shows when due soon) -->
                ${showReminderSection ? `
                <div class="bg-gradient-to-r from-red-900/50 to-orange-900/50 border border-red-500/50 rounded-xl p-4 mb-8">
                    <div class="flex items-center justify-between mb-3">
                        <h4 class="text-lg font-bold text-red-200 flex items-center gap-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                            Payment Reminder Script
                            <span class="text-xs font-normal text-red-300">(edit as needed)</span>
                        </h4>
                        <button onclick="copyReminderScript(${id}, this)" class="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition flex items-center gap-2" title="Text in city for fastest response">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                            Copy Message
                        </button>
                    </div>
                    <div class="text-xs text-yellow-300 mb-3 flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Text in city for fastest response
                    </div>
                    <textarea id="reminderScript-${id}" rows="4" class="w-full px-4 py-3 border-2 border-gray-600 rounded-xl bg-gray-700/80 font-medium text-white focus:ring-2 focus:ring-purple-500 transition resize-y">${reminderScript}</textarea>
                </div>
                ` : '<div class="mb-8"></div>'}
            </div>
        </div>
        
        <!-- Wrapper for remaining sections with proper padding -->
        <div class="px-6 md:px-8 pb-8">
        
        <!-- EDITABLE Income Stats -->
        <h3 class="text-xl font-bold text-gray-200 mb-4">Pricing & Status <span class="text-sm text-purple-400">(Click to edit)</span></h3>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <!-- Daily Rate Tile -->
            <div id="tile-dailyPrice-${id}" 
                 class="stat-tile bg-gradient-to-br from-cyan-600 to-teal-800 rounded-2xl shadow-xl p-4 text-white border border-cyan-500 cursor-pointer"
                 onclick="startEditTile('dailyPrice', ${id}, 'number')"
                 data-field="dailyPrice"
                 data-original-value="${dailyPrice}">
                <div class="flex items-center justify-between mb-1">
                    <h3 class="text-xs font-bold opacity-90">Daily</h3>
                    <svg class="w-4 h-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                </div>
                <div id="value-dailyPrice-${id}" class="text-xl font-black">${dailyPrice > 0 ? dailyPrice.toLocaleString() : 'Not set'}</div>
                <div class="text-xs text-cyan-200 mt-1 opacity-70">Click to edit</div>
            </div>
            
            <!-- Weekly Rate Tile -->
            <div id="tile-weeklyPrice-${id}" 
                 class="stat-tile bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-xl p-4 text-white border border-blue-500 cursor-pointer"
                 onclick="startEditTile('weeklyPrice', ${id}, 'number')"
                 data-field="weeklyPrice"
                 data-original-value="${weeklyPrice}">
                <div class="flex items-center justify-between mb-1">
                    <h3 class="text-xs font-bold opacity-90">Weekly</h3>
                    <svg class="w-4 h-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div id="value-weeklyPrice-${id}" class="text-xl font-black">${weeklyPrice > 0 ? weeklyPrice.toLocaleString() : 'Not set'}</div>
                <div class="text-xs text-blue-200 mt-1 opacity-70">Click to edit</div>
            </div>
            
            <!-- Biweekly Rate Tile -->
            <div id="tile-biweeklyPrice-${id}" 
                 class="stat-tile bg-gradient-to-br from-purple-600 to-violet-800 rounded-2xl shadow-xl p-4 text-white border border-purple-500 cursor-pointer"
                 onclick="startEditTile('biweeklyPrice', ${id}, 'number')"
                 data-field="biweeklyPrice"
                 data-original-value="${biweeklyPrice}">
                <div class="flex items-center justify-between mb-1">
                    <h3 class="text-xs font-bold opacity-90">Biweekly</h3>
                    <svg class="w-4 h-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <div id="value-biweeklyPrice-${id}" class="text-xl font-black">${biweeklyPrice > 0 ? biweeklyPrice.toLocaleString() : 'Not set'}</div>
                <div class="text-xs text-purple-200 mt-1 opacity-70">Click to edit</div>
            </div>
            
            <!-- Monthly Rate Tile -->
            <div id="tile-monthlyPrice-${id}" 
                 class="stat-tile bg-gradient-to-br from-green-600 to-emerald-800 rounded-2xl shadow-xl p-4 text-white border border-green-500 cursor-pointer"
                 onclick="startEditTile('monthlyPrice', ${id}, 'number')"
                 data-field="monthlyPrice"
                 data-original-value="${monthlyPrice}">
                <div class="flex items-center justify-between mb-1">
                    <h3 class="text-xs font-bold opacity-90">Monthly</h3>
                    <svg class="w-4 h-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                </div>
                <div id="value-monthlyPrice-${id}" class="text-xl font-black">${monthlyPrice > 0 ? monthlyPrice.toLocaleString() : 'Not set'}</div>
                <div class="text-xs text-green-200 mt-1 opacity-70">Click to edit</div>
            </div>
            
            <!-- Buy Price Tile -->
            <div id="tile-buyPrice-${id}" 
                 class="stat-tile bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-xl p-4 text-white border border-amber-400 cursor-pointer"
                 onclick="startEditTile('buyPrice', ${id}, 'number')"
                 data-field="buyPrice"
                 data-original-value="${buyPrice}">
                <div class="flex items-center justify-between mb-1">
                    <h3 class="text-xs font-bold opacity-90">Buy Price</h3>
                    <svg class="w-4 h-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                </div>
                <div id="value-buyPrice-${id}" class="text-xl font-black">${buyPrice > 0 ? buyPrice.toLocaleString() : 'Not set'}</div>
                <div class="text-xs text-amber-200 mt-1 opacity-70">Own it forever</div>
            </div>
            
            <!-- Status Tile (toggles availability) -->
            <div id="tile-status-${id}" 
                 class="stat-tile bg-gradient-to-br ${isAvailable ? 'from-emerald-600 to-teal-800 border-emerald-500' : 'from-red-600 to-pink-800 border-red-500'} rounded-2xl shadow-xl p-4 text-white border cursor-pointer"
                 onclick="togglePropertyStatus(${id})">
                <div class="flex items-center justify-between mb-1">
                    <h3 class="text-xs font-bold opacity-90">Status</h3>
                    <svg class="w-4 h-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div class="text-lg font-black">${statusText}</div>
                <div class="text-xs opacity-80">${isAvailable ? 'Accepting inquiries' : 'Currently rented'}</div>
                <div class="text-xs mt-1 opacity-70">Click to toggle</div>
            </div>
        </div>
        
        <!-- Premium Advertising Info (only shows if premium is enabled) -->
        ${isPremium ? `
        <h3 class="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">👑 Premium Advertising <span class="text-sm text-amber-300/70">(Click to edit)</span></h3>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <!-- Premium Status -->
            <div class="stat-tile p-4 bg-gradient-to-br from-amber-600 to-yellow-700 rounded-xl border border-amber-500">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-xl">👑</span>
                    <span class="text-amber-100 font-semibold">Premium Status</span>
                </div>
                <div class="text-lg font-bold text-white">${isPremiumTrial ? '🎁 Free Trial' : '💰 Paid'}</div>
                <div class="text-xs text-amber-200 mt-2">${isPremiumTrial ? 'No charge' : '$10,000/week'}</div>
                ${TierService.isMasterAdmin(auth.currentUser?.email) ? `
                <button onclick="togglePremiumTrialStatus(${id})" class="mt-2 text-xs bg-amber-800 hover:bg-amber-700 px-2 py-1 rounded text-amber-100">
                    ${isPremiumTrial ? 'Convert to Paid' : 'Convert to Trial'}
                </button>
                ` : ''}
            </div>
            
            <!-- Premium Start Date -->
            <div id="tile-premiumStartDate-${id}"
                 class="stat-tile p-4 bg-gradient-to-br from-amber-700 to-orange-800 rounded-xl border border-amber-600 cursor-pointer"
                 onclick="startEditTile('premiumStartDate', ${id}, 'date')"
                 data-field="premiumStartDate"
                 data-original-value="${premiumStartDate}">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-xl">📅</span>
                    <span class="text-amber-100 font-semibold">Start Date</span>
                </div>
                <div id="value-premiumStartDate-${id}" class="text-lg font-bold text-white">${premiumStartDate ? formatDate(premiumStartDate) : '<span class="opacity-70">Not set</span>'}</div>
                <div class="text-xs text-amber-200 mt-2 opacity-70">Click to edit</div>
            </div>
            
            <!-- Premium Last Payment (only for paid) -->
            <div id="tile-premiumLastPayment-${id}"
                 class="stat-tile p-4 bg-gradient-to-br ${isPremiumTrial ? 'from-gray-600 to-gray-700 border-gray-500' : 'from-green-600 to-emerald-700 border-green-500'} rounded-xl border cursor-pointer"
                 onclick="${isPremiumTrial ? '' : `startEditTile('premiumLastPayment', ${id}, 'date')`}"
                 data-field="premiumLastPayment"
                 data-original-value="${premiumLastPayment}">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-xl">💵</span>
                    <span class="${isPremiumTrial ? 'text-gray-300' : 'text-green-100'} font-semibold">Last Payment</span>
                </div>
                <div id="value-premiumLastPayment-${id}" class="text-lg font-bold text-white">
                    ${isPremiumTrial ? '<span class="opacity-50">N/A (Trial)</span>' : (premiumLastPayment ? formatDate(premiumLastPayment) : '<span class="opacity-70">Not set</span>')}
                </div>
                <div class="text-xs ${isPremiumTrial ? 'text-gray-400' : 'text-green-200'} mt-2 opacity-70">${isPremiumTrial ? 'Free trial active' : 'Click to edit'}</div>
            </div>
            
            <!-- Premium Next Due (calculated) -->
            <div class="stat-tile p-4 bg-gradient-to-br ${isPremiumTrial ? 'from-gray-600 to-gray-700 border-gray-500' : (premiumDaysUntilDue !== null && premiumDaysUntilDue <= 1 ? 'from-red-600 to-red-800 border-red-500' : 'from-orange-600 to-orange-800 border-orange-500')} rounded-xl border">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-xl">⏰</span>
                    <span class="${isPremiumTrial ? 'text-gray-300' : (premiumDaysUntilDue !== null && premiumDaysUntilDue <= 1 ? 'text-red-100' : 'text-orange-100')} font-semibold">Next Due</span>
                </div>
                <div class="text-lg font-bold text-white">
                    ${isPremiumTrial ? '<span class="opacity-50">N/A (Trial)</span>' : (premiumNextDue || '<span class="opacity-70">Set last payment</span>')}
                </div>
                ${!isPremiumTrial && premiumDaysUntilDue !== null ? `
                <div class="text-xs ${premiumDaysUntilDue <= 1 ? 'text-red-200 font-bold' : 'text-orange-200'} mt-2">
                    ${premiumDaysUntilDue === 0 ? '⚠️ Due today!' : premiumDaysUntilDue === 1 ? '⚠️ Due tomorrow!' : premiumDaysUntilDue < 0 ? '🚨 ' + Math.abs(premiumDaysUntilDue) + ' day(s) overdue!' : premiumDaysUntilDue + ' days remaining'}
                </div>
                ` : '<div class="text-xs text-gray-400 mt-2">Auto-calculated weekly</div>'}
            </div>
        </div>
        ` : ''}
        
        <!-- Actions -->
        <div class="glass-effect rounded-2xl shadow-2xl p-6 md:p-8 mb-8">
            <h3 class="text-2xl font-bold text-gray-200 mb-6">⚡ Quick Actions</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button onclick="toggleAvailability(${id}); setTimeout(() => renderPropertyStatsContent(${id}), 100);" class="flex items-center justify-center space-x-3 ${isAvailable ? 'bg-gradient-to-r from-red-500 to-pink-600' : 'bg-gradient-to-r from-green-500 to-emerald-600'} text-white px-6 py-4 rounded-xl font-bold hover:opacity-90 transition shadow-lg">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                    <span>${isAvailable ? 'Mark as Rented' : 'Mark as Available'}</span>
                </button>
                <button onclick="togglePremiumStatus(${id})" class="flex items-center justify-center space-x-3 ${isPremium ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900' : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-amber-600 hover:to-yellow-600 text-white'} px-6 py-4 rounded-xl font-bold transition shadow-lg">
                    <span class="text-xl">👑</span>
                    <span>${isPremium ? 'Premium Active ($10k)' : 'Enable Premium'}</span>
                </button>
                <button onclick="viewProperty(${id})" class="flex items-center justify-center space-x-3 gradient-bg text-white px-6 py-4 rounded-xl font-bold hover:opacity-90 transition shadow-lg">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    <span>View Public Listing</span>
                </button>
                <button onclick="confirmDeleteProperty(${id}, '${sanitize(p.title).replace(/'/g, "\\'")}')" class="flex items-center justify-center space-x-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-red-600 hover:to-red-700 text-white px-6 py-4 rounded-xl font-bold transition shadow-lg">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    <span>Delete Property</span>
                </button>
            </div>
        </div>
        
        </div><!-- End of padding wrapper for Pricing & Quick Actions sections -->
        
        <!-- Analytics and Reviews - continue within main card -->
        <div class="px-6 md:px-8 pb-8">
        
        <!-- Property Analytics & Payment Ledger -->
        <div class="bg-gray-800/50 rounded-2xl p-6 mb-8 border border-gray-700">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-2xl font-bold text-gray-200 flex items-center gap-3">
                    <span>📊</span> Property Analytics & Ledger
                </h3>
                <button onclick="renderPropertyAnalytics(${id})" class="text-purple-400 hover:text-purple-300 text-sm font-semibold flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    Refresh
                </button>
            </div>
            <div id="propertyAnalyticsSection">
                <div class="text-center py-8">
                    <div class="text-4xl mb-4 animate-pulse">📊</div>
                    <p class="text-gray-400">Loading analytics...</p>
                </div>
            </div>
        </div>
        
        <!-- Reviews Section -->
        <div class="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <h3 class="text-2xl font-bold text-gray-200 mb-6">⭐ Property Reviews (${propertyReviews.length})</h3>
            <div class="space-y-4">
                ${propertyReviews.length > 0 ? propertyReviews.map(r => `
                    <div class="review-card p-5 rounded-xl shadow-md">
                        <div class="flex justify-between items-start mb-3">
                            <div>
                                <h5 class="font-bold text-white text-lg">${sanitize(r.name)}</h5>
                                <div class="text-yellow-400 text-lg">${'*'.repeat(r.rating)}</div>
                            </div>
                            <div class="text-sm text-gray-400 font-medium">${sanitize(r.date)}</div>
                        </div>
                        <p class="text-gray-300 font-medium">${sanitize(r.text)}</p>
                    </div>
                `).join('') : '<p class="text-gray-500 text-center font-semibold py-8">No reviews yet for this property.</p>'}
            </div>
        </div>
        
        </div><!-- End of Analytics and Reviews section -->
    `;
}

/**
 * Start editing a tile - shows inline input
 */
window.startEditTile = function(field, propertyId, type) {
    const tileId = `tile-${field}-${propertyId}`;
    const valueId = `value-${field}-${propertyId}`;
    const tile = $(tileId);
    const valueEl = $(valueId);
    
    if (!tile || !valueEl || tile.classList.contains('editing')) return;
    
    // VALIDATION: Block lastPaymentDate if frequency is not set
    if (field === 'lastPaymentDate') {
        const p = properties.find(prop => prop.id === propertyId);
        const frequency = PropertyDataService.getValue(propertyId, 'paymentFrequency', p?.paymentFrequency || '');
        if (!frequency) {
            alert('⚠️ Please set the Payment Frequency first!\n\nThe frequency determines how the next due date is calculated and how payments are logged.\n\n1. Click on "Payment Frequency"\n2. Select: Daily, Weekly, Biweekly, or Monthly\n3. Then you can set the Last Payment date');
            return;
        }
    }
    
    tile.classList.add('editing');
    
    const currentValue = PropertyDataService.getValue(propertyId, field, tile.dataset.originalValue);
    
    let inputHtml;
    if (type === 'select' && field === 'interiorType') {
        inputHtml = `
            <select id="input-${field}-${propertyId}" class="stat-input text-lg w-full">
                <option value="Instance" ${currentValue === 'Instance' ? 'selected' : ''}>Instance</option>
                <option value="Walk-in" ${currentValue === 'Walk-in' ? 'selected' : ''}>Walk-in</option>
            </select>
        `;
    } else if (type === 'frequency') {
        inputHtml = `
            <select id="input-${field}-${propertyId}" class="stat-input text-lg w-full">
                <option value="" ${!currentValue ? 'selected' : ''}>-- Select Frequency --</option>
                <option value="daily" ${currentValue === 'daily' ? 'selected' : ''}>Daily</option>
                <option value="weekly" ${currentValue === 'weekly' ? 'selected' : ''}>Weekly</option>
                <option value="biweekly" ${currentValue === 'biweekly' ? 'selected' : ''}>Biweekly</option>
                <option value="monthly" ${currentValue === 'monthly' ? 'selected' : ''}>Monthly</option>
            </select>
        `;
    } else if (type === 'date') {
        inputHtml = `
            <input type="date" 
                   id="input-${field}-${propertyId}"
                   class="stat-input text-lg"
                   value="${currentValue || ''}">
        `;
    } else if (type === 'textarea') {
        inputHtml = `
            <textarea id="input-${field}-${propertyId}"
                   class="stat-input text-sm w-full"
                   rows="3"
                   placeholder="Add notes about this renter...">${currentValue || ''}</textarea>
        `;
    } else {
        const rawValue = typeof currentValue === 'number' ? currentValue : String(currentValue || '').replace(/[$,]/g, '');
        const inputType = type === 'number' ? 'number' : (type === 'tel' ? 'tel' : 'text');
        const placeholder = field === 'ownerName' ? 'Enter contact name' : 
                           field === 'ownerPhone' ? 'Enter phone number' : 
                           field === 'renterName' ? 'Enter renter name' : 
                           field === 'renterPhone' ? 'Enter renter phone' : '';
        const phoneHandler = type === 'tel' ? 'oninput="this.value = this.value.replace(/\\D/g, \'\')" maxlength="10"' : '';
        inputHtml = `
            <input type="${inputType}" 
                   id="input-${field}-${propertyId}"
                   class="stat-input text-lg"
                   value="${rawValue}"
                   ${type === 'number' ? 'min="0"' : ''}
                   ${phoneHandler}
                   placeholder="${placeholder}">
        `;
    }
    
    valueEl.innerHTML = `
        ${inputHtml}
        <div class="flex gap-2 mt-3">
            <button onclick="event.stopPropagation(); saveTileEdit('${field}', ${propertyId}, '${type}')" 
                    class="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg font-bold text-xs transition">
                Save
            </button>
            <button onclick="event.stopPropagation(); cancelTileEdit('${field}', ${propertyId})" 
                    class="flex-1 bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded-lg font-bold text-xs transition">
                Cancel
            </button>
        </div>
    `;
    
    const input = $(`input-${field}-${propertyId}`);
    if (input) {
        input.focus();
        if (input.select) input.select();
        input.onclick = (e) => e.stopPropagation();
        input.onkeydown = (e) => {
            e.stopPropagation();
            // For textarea, don't save on Enter (allow multi-line)
            if (e.key === 'Enter' && type !== 'textarea') saveTileEdit(field, propertyId, type);
            if (e.key === 'Escape') cancelTileEdit(field, propertyId);
        };
    }
};

/**
 * Save tile edit - writes to Firestore with optimistic UI
 */
window.saveTileEdit = async function(field, propertyId, type) {
    const tileId = `tile-${field}-${propertyId}`;
    const valueId = `value-${field}-${propertyId}`;
    const inputId = `input-${field}-${propertyId}`;
    
    const tile = $(tileId);
    const valueEl = $(valueId);
    const input = $(inputId);
    
    if (!tile || !valueEl || !input) return;
    
    let newValue;
    if (type === 'number') {
        newValue = parseInt(input.value, 10);
        if (isNaN(newValue) || newValue < 0) {
            tile.classList.add('error');
            setTimeout(() => tile.classList.remove('error'), 500);
            return;
        }
    } else if (type === 'tel') {
        // Remove all non-digit characters from phone numbers
        newValue = input.value.replace(/\D/g, '');
        input.value = newValue; // Update input to show cleaned number
    } else if (type === 'text') {
        // Allow empty values for owner/renter info
        newValue = input.value.trim();
        // For non-contact fields, require a value
        if (!newValue && field !== 'ownerName' && field !== 'ownerPhone' && field !== 'renterName' && field !== 'renterPhone') {
            tile.classList.add('error');
            setTimeout(() => tile.classList.remove('error'), 500);
            return;
        }
    } else if (type === 'textarea') {
        // Allow empty values for notes
        newValue = input.value.trim();
    } else if (type === 'frequency') {
        newValue = input.value;
    } else if (type === 'date') {
        newValue = input.value; // Keep as YYYY-MM-DD format
    } else {
        newValue = input.value.trim();
        if (!newValue && field !== 'interiorType') {
            tile.classList.add('error');
            setTimeout(() => tile.classList.remove('error'), 500);
            return;
        }
    }
    
    // PRICE VALIDATION - check if price values are logical
    if (field === 'weeklyPrice' || field === 'biweeklyPrice' || field === 'monthlyPrice') {
        const p = properties.find(prop => prop.id === propertyId);
        if (p) {
            const weekly = field === 'weeklyPrice' ? newValue : PropertyDataService.getValue(propertyId, 'weeklyPrice', p.weeklyPrice);
            const biweekly = field === 'biweeklyPrice' ? newValue : PropertyDataService.getValue(propertyId, 'biweeklyPrice', p.biweeklyPrice || 0);
            const monthly = field === 'monthlyPrice' ? newValue : PropertyDataService.getValue(propertyId, 'monthlyPrice', p.monthlyPrice);
            
            const warnings = validatePriceLogic(weekly, biweekly, monthly);
            
            if (warnings.length > 0) {
                // Store the save parameters for after confirmation
                const saveParams = { field, propertyId, type, newValue, tile, valueEl };
                
                showPriceWarningModal(warnings, 
                    () => {
                        // User confirmed - proceed with save
                        executeTileSave(saveParams.field, saveParams.propertyId, saveParams.type, saveParams.newValue, saveParams.tile, saveParams.valueEl);
                    },
                    () => {
                        // User cancelled - just cancel the edit
                        cancelTileEdit(field, propertyId);
                    }
                );
                return; // Don't save yet, wait for confirmation
            }
        }
    }
    
    // Proceed with normal save
    executeTileSave(field, propertyId, type, newValue, tile, valueEl);
};

/**
 * Execute tile save - writes to Firestore with optimistic UI
 * (Separated from saveTileEdit to allow price warning confirmation)
 */
window.executeTileSave = async function(field, propertyId, type, newValue, tile, valueEl) {
    if (!tile || !valueEl) {
        tile = $(`tile-${field}-${propertyId}`);
        valueEl = $(`value-${field}-${propertyId}`);
    }
    
    const originalValue = tile.dataset.originalValue;
    
    // Optimistic UI update
    tile.classList.remove('editing');
    tile.classList.add('saving');
    
    let displayValue;
    if (type === 'number') {
        if (field === 'biweeklyPrice' && (newValue === 0 || !newValue)) {
            displayValue = 'Not set';
        } else {
            displayValue = field === 'weeklyPrice' || field === 'biweeklyPrice' || field === 'monthlyPrice' ? `${newValue.toLocaleString()}` : newValue.toLocaleString();
        }
    } else if ((field === 'ownerName' || field === 'ownerPhone' || field === 'renterName' || field === 'renterPhone') && !newValue) {
        displayValue = '<span class="opacity-70">Not set</span>';
    } else if (field === 'renterNotes' && !newValue) {
        displayValue = '<span class="opacity-70">Add notes...</span>';
    } else if (field === 'renterNotes' && newValue) {
        // Show full text - CSS line-clamp will handle overflow
        displayValue = newValue;
    } else if (type === 'date' && newValue) {
        displayValue = formatDate(newValue);
    } else if (type === 'frequency') {
        displayValue = newValue.charAt(0).toUpperCase() + newValue.slice(1);
    } else {
        displayValue = newValue || '<span class="opacity-70">Not set</span>';
    }
    valueEl.innerHTML = `<span class="opacity-70">${displayValue}</span><div class="text-xs mt-1">Saving...</div>`;
    
    try {
        // CRITICAL: Write to Firestore (includes fresh read before write)
        await PropertyDataService.write(propertyId, field, newValue);
        
        // LOG PAYMENT when lastPaymentDate is updated
        if (field === 'lastPaymentDate' && newValue) {
            const p = properties.find(prop => prop.id === propertyId);
            const renterName = PropertyDataService.getValue(propertyId, 'renterName', p?.renterName || 'Unknown');
            const paymentFrequency = PropertyDataService.getValue(propertyId, 'paymentFrequency', p?.paymentFrequency || 'weekly');
            const dailyPrice = PropertyDataService.getValue(propertyId, 'dailyPrice', p?.dailyPrice || 0);
            const weeklyPrice = PropertyDataService.getValue(propertyId, 'weeklyPrice', p?.weeklyPrice || 0);
            const biweeklyPrice = PropertyDataService.getValue(propertyId, 'biweeklyPrice', p?.biweeklyPrice || 0);
            const monthlyPrice = PropertyDataService.getValue(propertyId, 'monthlyPrice', p?.monthlyPrice || 0);
            
            // Calculate payment amount based on frequency
            let paymentAmount = weeklyPrice;
            if (paymentFrequency === 'daily') {
                paymentAmount = dailyPrice > 0 ? dailyPrice : Math.round(weeklyPrice / 7);
            } else if (paymentFrequency === 'biweekly') {
                paymentAmount = biweeklyPrice > 0 ? biweeklyPrice : weeklyPrice * 2;
            } else if (paymentFrequency === 'monthly') {
                paymentAmount = monthlyPrice > 0 ? monthlyPrice : weeklyPrice * 4;
            }
            
            // Log payment to Firestore
            const logSuccess = await logPayment(propertyId, {
                paymentDate: newValue,
                recordedAt: new Date().toISOString(),
                renterName: renterName,
                frequency: paymentFrequency,
                amount: paymentAmount,
                recordedBy: auth.currentUser?.email || 'owner'
            });
            // Calculate next due date for thank you message
            const lastDate = parseLocalDate(newValue);
            const nextDate = new Date(lastDate);
            if (paymentFrequency === 'daily') {
                nextDate.setDate(nextDate.getDate() + 1);
            } else if (paymentFrequency === 'weekly') {
                nextDate.setDate(nextDate.getDate() + 7);
            } else if (paymentFrequency === 'biweekly') {
                nextDate.setDate(nextDate.getDate() + 14);
            } else {
                nextDate.setMonth(nextDate.getMonth() + 1);
            }
            const nextDueDateStr = nextDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
            
            // Show thank you message popup with copy functionality
            if (logSuccess) {
                showPaymentConfirmationModal(renterName, nextDueDateStr, paymentAmount);
            }
        }
        
        // Auto-flip to "rented" when setting renter name or phone
        if ((field === 'renterName' || field === 'renterPhone') && newValue) {
            if (state.availability[propertyId] !== false) {
                // Property is currently available, flip to rented
                state.availability[propertyId] = false;
                await saveAvailability(propertyId, false);
                
                // End any ongoing vacancy period
                await endVacancyPeriod(propertyId);
            }
        }
        
        // If payment frequency changed to weekly, auto-adjust monthly price
        if (field === 'paymentFrequency' && newValue === 'weekly') {
            const p = properties.find(prop => prop.id === propertyId);
            const weeklyPrice = PropertyDataService.getValue(propertyId, 'weeklyPrice', p?.weeklyPrice || 0);
            const newMonthlyPrice = weeklyPrice * 4;
            await PropertyDataService.write(propertyId, 'monthlyPrice', newMonthlyPrice);
        }
        
        // Success feedback
        tile.classList.remove('saving');
        tile.classList.add('success');
        tile.dataset.originalValue = newValue;
        
        // Update display
        valueEl.innerHTML = displayValue;
        
        // Show success briefly
        setTimeout(() => {
            tile.classList.remove('success');
            // Refresh the entire stats page to show synced data
            renderPropertyStatsContent(propertyId);
            
            // Refresh analytics if payment was logged
            if (field === 'lastPaymentDate' && typeof renderPropertyAnalytics === 'function') {
                setTimeout(() => renderPropertyAnalytics(propertyId), 200);
            }
        }, 1000);
        
        // Update filtered properties to reflect changes
        state.filteredProperties = [...properties];
        
        // Also refresh properties grid and dashboard if they're using this data
        renderProperties(state.filteredProperties);
        if (state.currentUser === 'owner') renderOwnerDashboard();
        
    } catch (error) {
        console.error('Save failed, rolling back:', error);
        
        // Rollback on failure
        tile.classList.remove('saving');
        tile.classList.add('error');
        
        const rollbackValue = type === 'number'
            ? (field === 'weeklyPrice' || field === 'biweeklyPrice' || field === 'monthlyPrice' ? `${parseInt(originalValue).toLocaleString()}` : parseInt(originalValue).toLocaleString())
            : originalValue;
        valueEl.innerHTML = `${rollbackValue}<div class="text-xs mt-1 text-red-300">Error! Try again</div>`;
        
        setTimeout(() => {
            tile.classList.remove('error');
            renderPropertyStatsContent(propertyId);
        }, 2000);
    }
};

/**
 * Cancel tile edit - restores original value
 */
window.cancelTileEdit = function(field, propertyId) {
    const tileId = `tile-${field}-${propertyId}`;
    const tile = $(tileId);
    
    if (!tile || !tile.classList.contains('editing')) return;
    
    tile.classList.remove('editing');
    
    // Re-render to restore original display
    renderPropertyStatsContent(propertyId);
};

/**
 * Edit property type on stats page
 */
window.startEditPropertyType = function(propertyId) {
    const tile = $(`tile-type-${propertyId}`);
    if (!tile) return;
    
    const currentValue = tile.dataset.originalValue || tile.textContent.trim().toLowerCase();
    
    // Create dropdown in place
    tile.outerHTML = `
        <div id="type-edit-container-${propertyId}" class="flex flex-col items-end gap-2">
            <select id="type-select-${propertyId}" 
                    class="bg-gray-800 border-2 border-purple-500 rounded-full px-4 py-2 text-white text-sm font-bold uppercase cursor-pointer focus:ring-2 focus:ring-purple-400"
                    onchange="savePropertyType(${propertyId}, this.value)">
                <option value="apartment" ${currentValue === 'apartment' ? 'selected' : ''}>Apartment</option>
                <option value="house" ${currentValue === 'house' ? 'selected' : ''}>House</option>
                <option value="condo" ${currentValue === 'condo' ? 'selected' : ''}>Condo</option>
                <option value="villa" ${currentValue === 'villa' ? 'selected' : ''}>Villa</option>
                <option value="hotel" ${currentValue === 'hotel' ? 'selected' : ''}>Hotel</option>
                <option value="office" ${currentValue === 'office' ? 'selected' : ''}>Office</option>
                <option value="warehouse" ${currentValue === 'warehouse' ? 'selected' : ''}>Warehouse</option>
                <option value="hideout" ${currentValue === 'hideout' ? 'selected' : ''}>Hideout</option>
            </select>
            <button onclick="renderPropertyStatsContent(${propertyId})" class="text-xs text-gray-400 hover:text-white">Cancel</button>
        </div>
    `;
    
    // Focus the select
    setTimeout(() => {
        const select = $(`type-select-${propertyId}`);
        if (select) select.focus();
    }, 50);
};

/**
 * Save property type change
 */
window.savePropertyType = async function(propertyId, newValue) {
    try {
        await PropertyDataService.write(propertyId, 'type', newValue);
        
        // Update filtered properties
        state.filteredProperties = [...properties];
        
        // Refresh all views
        renderPropertyStatsContent(propertyId);
        renderProperties(state.filteredProperties);
        if (state.currentUser === 'owner') renderOwnerDashboard();
        
        showToast('Property type updated!', 'success');
    } catch (error) {
        console.error('Failed to save property type:', error);
        showToast('Failed to update property type', 'error');
        renderPropertyStatsContent(propertyId);
    }
};

/**
 * Toggle property status (available/rented)
 */
window.togglePropertyStatus = async function(propertyId) {
    await toggleAvailability(propertyId);
    setTimeout(() => renderPropertyStatsContent(propertyId), 100);
};

// Toggle Premium listing status
window.togglePremiumStatus = async function(propertyId) {
    const p = properties.find(prop => prop.id === propertyId);
    if (!p) return;
    
    const currentPremium = PropertyDataService.getValue(propertyId, 'isPremium', p.isPremium || false);
    const newPremium = !currentPremium;
    
    if (newPremium) {
        // Show premium enable modal instead of simple confirm
        showPremiumEnableModal(propertyId, p.title);
        return;
    }
    
    // Disabling premium - simple confirm
    if (!confirm('Disable Premium Listing?\n\nThis will remove the premium status and featured placement.')) {
        return;
    }
    
    try {
        await PropertyDataService.write(propertyId, 'isPremium', false);
        await PropertyDataService.write(propertyId, 'premiumUpdatedAt', new Date().toISOString());
        
        p.isPremium = false;
        renderPropertyStatsContent(propertyId);
        
        if (typeof renderProperties === 'function') {
            state.filteredProperties = [...properties];
            renderProperties(state.filteredProperties);
        }
        
        showToast('Premium Listing Deactivated', 'info');
        
    } catch (error) {
        console.error('Error toggling premium status:', error);
        alert('Failed to update premium status. Please try again.');
    }
};

// Show modal to enable premium with trial option
window.showPremiumEnableModal = function(propertyId, propertyTitle) {
    const isAdmin = TierService.isMasterAdmin(auth.currentUser?.email);
    
    // Free Trial section - only visible to admin
    const freeTrialSection = isAdmin ? `
                <!-- Free Trial Checkbox - Admin Only -->
                <div class="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-xl p-4 mb-4">
                    <label class="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" id="premiumTrialCheckbox" class="w-5 h-5 rounded border-cyan-500 text-cyan-500 focus:ring-cyan-500 cursor-pointer">
                        <div>
                            <span class="text-cyan-300 font-bold">🎁 Free Trial</span>
                            <p class="text-cyan-400/70 text-sm">Grant free premium trial (won't count as revenue)</p>
                        </div>
                    </label>
                </div>
    ` : '';
    
    // Payment notice for non-admin users
    const paymentNotice = !isAdmin ? `
                <div class="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-4">
                    <div class="flex items-center gap-2 text-red-300">
                        <span class="text-xl">⚠️</span>
                        <p class="text-sm"><strong>Weekly payment required</strong> - Pauly will contact you in-city to collect $10k payment</p>
                    </div>
                </div>
    ` : '';
    
    const modalHTML = `
        <div id="premiumEnableModal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onclick="if(event.target.id === 'premiumEnableModal') closePremiumEnableModal()">
            <div class="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-amber-700/50" onclick="event.stopPropagation()">
                <h3 class="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">👑 Enable Premium Listing</h3>
                
                <div class="bg-gray-900/50 rounded-xl p-4 mb-4">
                    <p class="text-gray-300 mb-2"><strong>Property:</strong> ${propertyTitle}</p>
                    <p class="text-gray-300"><strong>Fee:</strong> <span class="text-amber-400 font-bold">$10,000/week</span></p>
                </div>
                
                <div class="bg-amber-900/20 border border-amber-600/30 rounded-xl p-4 mb-4">
                    <div class="text-amber-300 font-bold mb-2">✨ Premium Benefits:</div>
                    <ul class="text-amber-200/80 text-sm space-y-1">
                        <li>✓ Top placement on Properties page</li>
                        <li>✓ Gold border and FEATURED badge</li>
                        <li>✓ Stand out from other listings</li>
                    </ul>
                </div>
                
                ${freeTrialSection}
                ${paymentNotice}
                
                <!-- Buttons -->
                <div class="flex gap-3">
                    <button onclick="confirmPremiumEnable(${propertyId})" 
                            class="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 py-3 rounded-xl font-bold hover:opacity-90 transition">
                        ✓ Enable Premium
                    </button>
                    <button onclick="closePremiumEnableModal()" 
                            class="flex-1 bg-gray-700 text-white py-3 rounded-xl font-bold hover:bg-gray-600 transition">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

window.closePremiumEnableModal = function() {
    const modal = $('premiumEnableModal');
    if (modal) modal.remove();
};

window.confirmPremiumEnable = async function(propertyId) {
    const p = properties.find(prop => prop.id === propertyId);
    if (!p) return;
    
    const isTrial = $('premiumTrialCheckbox')?.checked || false;
    const today = new Date().toISOString().split('T')[0];
    
    try {
        // Save premium status
        await PropertyDataService.write(propertyId, 'isPremium', true);
        await PropertyDataService.write(propertyId, 'isPremiumTrial', isTrial);
        await PropertyDataService.write(propertyId, 'premiumUpdatedAt', new Date().toISOString());
        await PropertyDataService.write(propertyId, 'premiumStartDate', today);
        
        // If not trial, set last payment date to today
        if (!isTrial) {
            await PropertyDataService.write(propertyId, 'premiumLastPayment', today);
        }
        
        // Update local property
        p.isPremium = true;
        p.isPremiumTrial = isTrial;
        
        // Create admin notification if NOT admin enabling it
        const currentUserEmail = auth.currentUser?.email?.toLowerCase();
        const ownerEmail = (p.ownerEmail || propertyOwnerEmail[propertyId] || '').toLowerCase();
        
        if (!TierService.isMasterAdmin(currentUserEmail)) {
            // Property owner enabled premium - notify admin
            try {
                await db.collection('adminNotifications').add({
                    type: 'premium_request',
                    propertyId: propertyId,
                    propertyTitle: p.title,
                    ownerEmail: ownerEmail,
                    isTrial: isTrial,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    dismissed: false,
                    message: `${p.title} enabled premium${isTrial ? ' (trial)' : ' - collect $10k/week'}`
                });
            } catch (e) {
                console.error('[Premium] Failed to create admin notification:', e);
                // Non-critical error - don't block the premium activation
            }
        }
        
        closePremiumEnableModal();
        renderPropertyStatsContent(propertyId);
        
        if (typeof renderProperties === 'function') {
            state.filteredProperties = [...properties];
            renderProperties(state.filteredProperties);
        }
        
        if (isTrial) {
            showToast('🎁 Premium Trial Activated!', 'success');
        } else {
            showToast('👑 Premium Listing Activated!', 'success');
        }
        
    } catch (error) {
        console.error('Error enabling premium:', error);
        alert('Failed to enable premium. Please try again.');
    }
};

// Toggle premium between trial and paid
window.togglePremiumTrialStatus = async function(propertyId) {
    const p = properties.find(prop => prop.id === propertyId);
    if (!p) return;
    
    const currentTrial = PropertyDataService.getValue(propertyId, 'isPremiumTrial', p.isPremiumTrial || false);
    const newTrial = !currentTrial;
    
    const action = newTrial ? 'Convert to Free Trial?' : 'Convert to Paid ($10k/week)?';
    if (!confirm(action + '\n\nThis will update the premium status.')) {
        return;
    }
    
    try {
        await PropertyDataService.write(propertyId, 'isPremiumTrial', newTrial);
        
        // If converting to paid, set last payment to today
        if (!newTrial) {
            const today = new Date().toISOString().split('T')[0];
            await PropertyDataService.write(propertyId, 'premiumLastPayment', today);
        }
        
        p.isPremiumTrial = newTrial;
        renderPropertyStatsContent(propertyId);
        
        if (newTrial) {
            showToast('🎁 Converted to Free Trial', 'info');
        } else {
            showToast('💰 Converted to Paid Premium', 'success');
        }
        
    } catch (error) {
        console.error('Error toggling premium trial:', error);
        alert('Failed to update. Please try again.');
    }
};

// ==================== PAYMENT LEDGER SYSTEM ====================

// Log a payment to the property's payment history
window.logPayment = async function(propertyId, paymentData) {
    try {
        // Get existing payment history
        const historyDoc = await db.collection('paymentHistory').doc(String(propertyId)).get();
        let payments = [];
        
        if (historyDoc.exists) {
            payments = historyDoc.data().payments || [];
        } else {
        }
        
        // Add new payment
        const newPayment = {
            ...paymentData,
            id: Date.now().toString() // Unique ID for this payment
        };
        payments.push(newPayment);
        // Save back to Firestore
        await db.collection('paymentHistory').doc(String(propertyId)).set({
            propertyId: propertyId,
            payments: payments,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('[PaymentLog] Error logging payment:', error);
        console.error('[PaymentLog] Error details:', error.code, error.message);
        
        // Show error toast if available
        if (typeof showToast === 'function') {
            showToast('⚠️ Payment may not have been logged: ' + error.message, 'error');
        }
        return false;
    }
};

// Show payment confirmation modal with copyable thank you message
window.showPaymentConfirmationModal = function(renterName, nextDueDate, amount) {
    // Get first name only for friendlier message
    const firstName = renterName.split(' ')[0];
    
    // Create the thank you message
    const thankYouMessage = `Thanks ${firstName}! 🙏 Your payment of $${amount.toLocaleString()} has been received. Your next payment is due on ${nextDueDate}. Let me know if you have any questions!`;
    
    // Create modal HTML
    const modalHTML = `
        <div id="paymentConfirmModal" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onclick="if(event.target === this) closePaymentConfirmModal()">
            <div class="bg-gray-900 rounded-2xl max-w-lg w-full p-6 border border-green-500/30 shadow-2xl" onclick="event.stopPropagation()">
                <div class="text-center mb-4">
                    <div class="text-5xl mb-3">✅</div>
                    <h3 class="text-2xl font-bold text-green-400">Payment Logged!</h3>
                    <p class="text-gray-400 mt-1">$${amount.toLocaleString()} from ${renterName}</p>
                </div>
                
                <div class="bg-gray-800 rounded-xl p-4 mb-4">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm text-gray-400 font-medium">📋 Copy this message to send to ${firstName}:</span>
                    </div>
                    <div id="thankYouMessageText" class="bg-gray-700/50 rounded-lg p-3 text-white text-sm leading-relaxed border border-gray-600">
                        ${thankYouMessage}
                    </div>
                </div>
                
                <div class="flex gap-3">
                    <button onclick="copyThankYouMessage()" class="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl font-bold hover:opacity-90 transition flex items-center justify-center gap-2">
                        <span>📋</span> Copy Message
                    </button>
                    <button onclick="closePaymentConfirmModal()" class="flex-1 bg-gray-700 text-white py-3 px-4 rounded-xl font-bold hover:bg-gray-600 transition">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Remove any existing modal
    const existing = document.getElementById('paymentConfirmModal');
    if (existing) existing.remove();
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Store message for copy function
    window.currentThankYouMessage = thankYouMessage;
};

window.copyThankYouMessage = async function() {
    try {
        await navigator.clipboard.writeText(window.currentThankYouMessage);
        
        // Update button to show success
        const btn = document.querySelector('#paymentConfirmModal button');
        if (btn) {
            btn.innerHTML = '<span>✅</span> Copied!';
            btn.classList.remove('from-green-500', 'to-emerald-600');
            btn.classList.add('from-blue-500', 'to-purple-600');
        }
        
        if (typeof showToast === 'function') {
            showToast('📋 Message copied to clipboard!', 'success');
        }
    } catch (e) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = window.currentThankYouMessage;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (typeof showToast === 'function') {
            showToast('📋 Message copied!', 'success');
        }
    }
};

window.closePaymentConfirmModal = function() {
    const modal = document.getElementById('paymentConfirmModal');
    if (modal) {
        modal.style.opacity = '0';
        modal.style.transition = 'opacity 0.2s';
        setTimeout(() => modal.remove(), 200);
    }
};

// Get payment history for a property
window.getPaymentHistory = async function(propertyId) {
    try {
        const historyDoc = await db.collection('paymentHistory').doc(String(propertyId)).get();
        if (historyDoc.exists) {
            const payments = historyDoc.data().payments || [];
            return payments;
        }
        return [];
    } catch (error) {
        console.error('[PaymentLog] Error fetching history:', error);
        console.error('[PaymentLog] Error code:', error.code);
        
        // If permission denied, show a warning
        if (error.code === 'permission-denied') {
            console.warn('[PaymentLog] Permission denied - check Firestore rules for paymentHistory collection');
        }
        return [];
    }
};

// Delete a payment from the ledger
window.deletePayment = async function(propertyId, paymentId) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this payment? This will update all financial stats.')) {
        return;
    }
    try {
        // Get existing payment history
        const historyDoc = await db.collection('paymentHistory').doc(String(propertyId)).get();
        
        if (!historyDoc.exists) {
            showToast('❌ Payment history not found', 'error');
            return;
        }
        
        let payments = historyDoc.data().payments || [];
        const originalCount = payments.length;
        
        // Find and remove the payment
        payments = payments.filter(p => p.id !== paymentId);
        
        if (payments.length === originalCount) {
            showToast('❌ Payment not found', 'error');
            return;
        }
        
        // Save back to Firestore
        await db.collection('paymentHistory').doc(String(propertyId)).set({
            propertyId: propertyId,
            payments: payments,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        showToast('🗑️ Payment deleted - refreshing stats...', 'success');
        
        // Refresh the analytics view
        await refreshPropertyAnalytics(propertyId);
        
    } catch (error) {
        console.error('[PaymentLog] Error deleting payment:', error);
        showToast('❌ Error deleting payment: ' + error.message, 'error');
    }
};

// Refresh property analytics after payment changes
window.refreshPropertyAnalytics = async function(propertyId) {
    // Find the property
    const property = properties.find(p => p.id === propertyId);
    if (!property) {
        console.error('[Analytics] Property not found:', propertyId);
        return;
    }
    
    // Re-fetch payment history
    const payments = await getPaymentHistory(propertyId);
    
    // Recalculate analytics
    const analytics = calculatePropertyAnalytics(payments, property);
    
    // Update the analytics container if it exists
    const analyticsContainer = document.getElementById(`propertyAnalytics-${propertyId}`);
    if (analyticsContainer) {
        analyticsContainer.innerHTML = renderPropertyAnalytics(property, payments, analytics);
    }
    
    // Also refresh the stats page if we're viewing this property
    if (state && state.currentPropertyId === propertyId) {
        // Re-render the stats page content
        renderPropertyStatsContent(propertyId);
    }
};

// Calculate property analytics from payment history
window.calculatePropertyAnalytics = function(payments, property) {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    
    // Filter out premium_fee payments - these are fees the owner PAYS, not income they receive
    const rentPayments = payments.filter(p => p.type !== 'premium_fee');
    
    // Sort payments by date
    const sortedPayments = [...rentPayments].sort((a, b) => 
        new Date(a.paymentDate) - new Date(b.paymentDate)
    );
    
    // YTD calculations
    const ytdPayments = sortedPayments.filter(p => new Date(p.paymentDate) >= yearStart);
    const totalEarnings = sortedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const ytdEarnings = ytdPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    // Payment counts
    const totalPayments = sortedPayments.length;
    const ytdPaymentCount = ytdPayments.length;
    
    // Average rent calculation
    const avgRent = totalPayments > 0 ? Math.round(totalEarnings / totalPayments) : 0;
    
    // Renter breakdown - also filter out premium_fee entries
    const renterStats = {};
    sortedPayments.forEach(p => {
        const name = p.renterName || 'Unknown';
        if (!renterStats[name]) {
            renterStats[name] = { count: 0, total: 0, payments: [] };
        }
        renterStats[name].count++;
        renterStats[name].total += (p.amount || 0);
        renterStats[name].payments.push(p);
    });
    
    // Monthly breakdown for charting
    const monthlyData = {};
    sortedPayments.forEach(p => {
        const date = new Date(p.paymentDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { earnings: 0, payments: 0 };
        }
        monthlyData[monthKey].earnings += (p.amount || 0);
        monthlyData[monthKey].payments++;
    });
    
    // Calculate rental period (time since first payment or first renter set)
    let firstPaymentDate = null;
    if (sortedPayments.length > 0) {
        firstPaymentDate = new Date(sortedPayments[0].paymentDate);
    }
    
    const daysSinceFirstPayment = firstPaymentDate 
        ? Math.floor((now - firstPaymentDate) / (1000 * 60 * 60 * 24))
        : 0;
    
    // Calculate occupancy rate (payments made / payments expected)
    // This measures payment consistency - 100% means all expected payments were made
    let expectedPayments = 0;
    let occupancyRate = 0;
    
    if (firstPaymentDate && totalPayments > 0) {
        const frequency = PropertyDataService.getValue(property?.id, 'paymentFrequency', 'weekly');
        let daysBetweenPayments = 7; // default weekly
        if (frequency === 'biweekly') daysBetweenPayments = 14;
        else if (frequency === 'monthly') daysBetweenPayments = 30;
        
        // Expected payments = (days since first payment / days between payments) + 1 (for the first payment)
        // Use ceiling to account for current period
        expectedPayments = Math.max(1, Math.ceil(daysSinceFirstPayment / daysBetweenPayments) + 1);
        
        // Calculate occupancy - cap at 100%
        occupancyRate = Math.min(100, Math.round((totalPayments / expectedPayments) * 100));
        
        // If only 1 payment and it's recent (within one payment cycle), show 100%
        if (totalPayments === 1 && daysSinceFirstPayment < daysBetweenPayments) {
            occupancyRate = 100;
        }
    }
    
    return {
        totalEarnings,
        ytdEarnings,
        totalPayments,
        ytdPaymentCount,
        avgRent,
        renterStats,
        monthlyData,
        firstPaymentDate,
        daysSinceFirstPayment,
        occupancyRate,
        sortedPayments
    };
};

// Render analytics section on property stats page
window.renderPropertyAnalytics = async function(propertyId) {
    const container = $('propertyAnalyticsSection');
    if (!container) return;
    
    const p = properties.find(prop => prop.id === propertyId);
    if (!p) return;
    
    // Show loading
    container.innerHTML = `
        <div class="text-center py-8">
            <div class="text-4xl mb-4 animate-pulse">📊</div>
            <p class="text-gray-400">Loading analytics...</p>
        </div>
    `;
    
    // Fetch payment history (includes tenure history)
    const historyDoc = await db.collection('paymentHistory').doc(String(propertyId)).get();
    const historyData = historyDoc.exists ? historyDoc.data() : { payments: [], tenureHistory: [], vacancyPeriods: [] };
    const payments = historyData.payments || [];
    const tenureHistory = historyData.tenureHistory || [];
    const vacancyPeriods = historyData.vacancyPeriods || [];
    
    const analytics = calculatePropertyAnalytics(payments, p);
    
    // Generate monthly chart data
    const months = Object.keys(analytics.monthlyData).sort();
    const lastSixMonths = months.slice(-6);
    
    // Calculate current vacancy duration if applicable
    let currentVacancy = null;
    const ongoingVacancy = vacancyPeriods.find(v => v.status === 'ongoing');
    if (ongoingVacancy && state.availability[propertyId] === true) {
        const startDate = new Date(ongoingVacancy.startDate);
        const today = new Date();
        const vacancyDays = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));
        currentVacancy = {
            days: vacancyDays,
            startDate: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
    }
    
    container.innerHTML = `
        <!-- Summary Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-gradient-to-br from-green-900/50 to-emerald-900/50 rounded-xl p-4 border border-green-600/30 cursor-help" title="Total rent collected from this property since tracking began">
                <div class="text-green-400 text-sm font-semibold">💰 Total Earnings</div>
                <div class="text-2xl font-black text-white">$${analytics.totalEarnings.toLocaleString()}</div>
                <div class="text-green-300/70 text-xs">${analytics.totalPayments} payment${analytics.totalPayments !== 1 ? 's' : ''}</div>
            </div>
            <div class="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 rounded-xl p-4 border border-blue-600/30 cursor-help" title="Rent collected in ${new Date().getFullYear()} only">
                <div class="text-blue-400 text-sm font-semibold">📅 YTD Earnings</div>
                <div class="text-2xl font-black text-white">$${analytics.ytdEarnings.toLocaleString()}</div>
                <div class="text-blue-300/70 text-xs">${analytics.ytdPaymentCount} payment${analytics.ytdPaymentCount !== 1 ? 's' : ''} this year</div>
            </div>
            <div class="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl p-4 border border-purple-600/30 cursor-help" title="Average amount per payment (Total ÷ # of payments)">
                <div class="text-purple-400 text-sm font-semibold">💵 Avg Payment</div>
                <div class="text-2xl font-black text-white">$${analytics.avgRent.toLocaleString()}</div>
                <div class="text-purple-300/70 text-xs">per payment cycle</div>
            </div>
            <div class="bg-gradient-to-br from-amber-900/50 to-orange-900/50 rounded-xl p-4 border border-amber-600/30 cursor-help" title="Payment consistency: 100% = all expected payments made on time. Calculated as (payments received ÷ payments expected) based on payment frequency.">
                <div class="text-amber-400 text-sm font-semibold">📈 Occupancy</div>
                <div class="text-2xl font-black text-white">${analytics.occupancyRate}%</div>
                <div class="text-amber-300/70 text-xs">${analytics.daysSinceFirstPayment} day${analytics.daysSinceFirstPayment !== 1 ? 's' : ''} tracked</div>
            </div>
        </div>
        
        ${currentVacancy ? `
        <!-- Current Vacancy Alert -->
        <div class="bg-gradient-to-r from-gray-800/80 to-gray-900/80 border border-gray-600 rounded-xl p-4 mb-6">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="text-3xl">🏠</div>
                    <div>
                        <div class="text-gray-200 font-bold">Currently Vacant</div>
                        <div class="text-gray-400 text-sm">Since ${currentVacancy.startDate} • ${currentVacancy.days} day${currentVacancy.days !== 1 ? 's' : ''}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-gray-400 text-xs uppercase">Potential Lost Revenue</div>
                    <div class="text-red-400 font-bold">$${Math.round((p.weeklyPrice / 7) * currentVacancy.days).toLocaleString()}</div>
                </div>
            </div>
        </div>
        ` : ''}
        
        <!-- Monthly Earnings Chart -->
        <div class="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700">
            <h4 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>📊</span> Monthly Earnings Trend
            </h4>
            <div id="earningsChart-${propertyId}" class="h-48">
                ${renderEarningsChart(lastSixMonths, analytics.monthlyData)}
            </div>
        </div>
        
        ${tenureHistory.length > 0 ? `
        <!-- Completed Tenures -->
        <div class="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-4 mb-6 border border-green-600/30">
            <h4 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>📜</span> Completed Tenures
                <span class="text-xs font-normal text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full">${tenureHistory.length} former renter${tenureHistory.length !== 1 ? 's' : ''}</span>
            </h4>
            <div class="space-y-3">
                ${tenureHistory.slice().reverse().map(tenure => `
                    <div class="bg-gray-900/70 rounded-xl p-4 border border-gray-700 group relative">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                    ${tenure.renterName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div class="text-white font-bold">${tenure.renterName}</div>
                                    <div class="text-gray-400 text-sm">
                                        ${tenure.paymentCount || 0} × $${(tenure.avgPayment || tenure.totalCollected / (tenure.paymentCount || 1)).toLocaleString()} 
                                        <span class="capitalize">${tenure.paymentFrequency || 'payment'}${tenure.paymentCount !== 1 ? 's' : ''}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                                    Lease Completed
                                </div>
                                <button onclick="deleteTenureRecord(${propertyId}, '${tenure.id}')" 
                                    class="sm:opacity-0 sm:group-hover:opacity-100 p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 transition-all"
                                    title="Delete this tenure record">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                            <div class="bg-gray-800/50 rounded-lg p-2">
                                <div class="text-gray-400 text-xs uppercase">Total Collected</div>
                                <div class="text-green-400 font-bold">$${(tenure.totalCollected || 0).toLocaleString()}</div>
                            </div>
                            <div class="bg-gray-800/50 rounded-lg p-2">
                                <div class="text-gray-400 text-xs uppercase">Tenure</div>
                                <div class="text-white font-bold">${tenure.tenureDays || 0} days</div>
                                <div class="text-gray-500 text-xs">${tenure.tenureWeeks || Math.round((tenure.tenureDays || 0) / 7 * 10) / 10} weeks</div>
                            </div>
                            <div class="bg-gray-800/50 rounded-lg p-2">
                                <div class="text-gray-400 text-xs uppercase">Started</div>
                                <div class="text-white font-bold text-sm">${tenure.startDate || 'N/A'}</div>
                            </div>
                            <div class="bg-gray-800/50 rounded-lg p-2">
                                <div class="text-gray-400 text-xs uppercase">Ended</div>
                                <div class="text-white font-bold text-sm">${tenure.endDate || 'N/A'}</div>
                            </div>
                        </div>
                        ${tenure.renterNotes ? `
                        <div class="mt-3 pt-3 border-t border-gray-700">
                            <div class="text-gray-400 text-xs uppercase mb-1">Notes</div>
                            <div class="text-gray-300 text-sm">${tenure.renterNotes}</div>
                        </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        <!-- Renter Breakdown -->
        <div class="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700">
            <h4 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>👥</span> Renter History
            </h4>
            <div class="space-y-3">
                ${Object.entries(analytics.renterStats).length > 0 
                    ? Object.entries(analytics.renterStats).map(([name, stats]) => `
                        <div class="bg-gray-900/50 rounded-lg p-3 flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                    ${name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div class="text-white font-semibold">${name}</div>
                                    <div class="text-gray-400 text-sm">${stats.count} payment${stats.count > 1 ? 's' : ''}</div>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-green-400 font-bold">$${stats.total.toLocaleString()}</div>
                                <div class="text-gray-500 text-xs">total paid</div>
                            </div>
                        </div>
                    `).join('')
                    : '<p class="text-gray-500 text-center py-4">No renter history yet</p>'
                }
            </div>
        </div>
        
        <!-- Payment Ledger -->
        <div class="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div class="flex items-center justify-between mb-4">
                <h4 class="text-lg font-bold text-white flex items-center gap-2">
                    <span>📒</span> Payment Ledger
                </h4>
                <button onclick="toggleLedgerExpand(${propertyId})" class="text-purple-400 hover:text-purple-300 text-sm font-semibold">
                    ${payments.length > 5 ? 'View All (' + payments.length + ')' : ''}
                </button>
            </div>
            <div id="paymentLedger-${propertyId}" class="space-y-2 max-h-80 overflow-y-auto">
                ${payments.length > 0 
                    ? analytics.sortedPayments.slice().reverse().slice(0, 10).map((p, i) => `
                        <div class="bg-gray-900/50 rounded-lg p-3 flex items-center justify-between text-sm ${i === 0 ? 'ring-2 ring-green-500/50' : ''} group">
                            <div class="flex items-center gap-3">
                                <div class="text-2xl">${i === 0 ? '✅' : '💵'}</div>
                                <div>
                                    <div class="text-white font-medium">${p.renterName || 'Unknown'}</div>
                                    <div class="text-gray-400 text-xs">
                                        Paid for: ${formatDate(p.paymentDate)} 
                                        <span class="text-gray-600">•</span> 
                                        ${p.frequency || 'weekly'}
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <div class="text-right">
                                    <div class="text-green-400 font-bold">$${(p.amount || 0).toLocaleString()}</div>
                                    <div class="text-gray-500 text-xs">
                                        ${new Date(p.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                    </div>
                                </div>
                                <button onclick="deletePayment(${propertyId}, '${p.id}')" 
                                    class="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 transition-all"
                                    title="Delete this payment">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    `).join('')
                    : `
                        <div class="text-center py-8">
                            <div class="text-4xl mb-2">📭</div>
                            <p class="text-gray-500">No payments recorded yet</p>
                            <p class="text-gray-600 text-sm mt-1">Payments are logged when you update the "Last Payment" date</p>
                        </div>
                    `
                }
            </div>
            ${payments.length > 10 ? `
                <button onclick="showFullLedger(${propertyId})" class="w-full mt-4 py-2 text-center text-purple-400 hover:text-purple-300 font-semibold border border-purple-500/30 rounded-lg hover:bg-purple-500/10 transition">
                    View Full Ledger (${payments.length} entries)
                </button>
            ` : ''}
        </div>
    `;
};

// Render simple bar chart for earnings
window.renderEarningsChart = function(months, monthlyData) {
    if (months.length === 0) {
        return `
            <div class="flex items-center justify-center h-full text-gray-500">
                <div class="text-center">
                    <div class="text-3xl mb-2">📊</div>
                    <p>No earnings data yet</p>
                </div>
            </div>
        `;
    }
    
    const maxEarnings = Math.max(...months.map(m => monthlyData[m]?.earnings || 0), 1);
    
    return `
        <div class="flex items-end justify-around h-full gap-2 px-4">
            ${months.map(month => {
                const data = monthlyData[month] || { earnings: 0, payments: 0 };
                const heightPercent = (data.earnings / maxEarnings) * 100;
                const monthLabel = new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' });
                return `
                    <div class="flex-1 flex flex-col items-center gap-2">
                        <div class="text-xs text-green-400 font-bold">$${(data.earnings / 1000).toFixed(0)}k</div>
                        <div class="w-full bg-gray-700 rounded-t-lg relative" style="height: 120px;">
                            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-600 to-emerald-500 rounded-t-lg transition-all duration-500" 
                                 style="height: ${Math.max(heightPercent, 5)}%;">
                            </div>
                        </div>
                        <div class="text-xs text-gray-400">${monthLabel}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
};

// Show full ledger modal
window.showFullLedger = async function(propertyId) {
    const payments = await getPaymentHistory(propertyId);
    const p = properties.find(prop => prop.id === propertyId);
    
    const sortedPayments = [...payments].sort((a, b) => 
        new Date(b.paymentDate) - new Date(a.paymentDate)
    );
    
    const totalEarnings = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const modalHTML = `
        <div id="fullLedgerModal" class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div class="bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-purple-700">
                <div class="bg-gradient-to-r from-purple-900 to-pink-900 p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-xl font-bold text-white flex items-center gap-2">
                                <span>📒</span> Complete Payment Ledger
                            </h3>
                            <p class="text-purple-200 text-sm mt-1">${p?.title || 'Property'}</p>
                        </div>
                        <button onclick="closeFullLedger()" class="text-white/70 hover:text-white text-2xl">&times;</button>
                    </div>
                    <div class="mt-4 flex gap-4 text-sm">
                        <div class="bg-white/10 rounded-lg px-4 py-2">
                            <span class="text-purple-200">Total Payments:</span>
                            <span class="text-white font-bold ml-2">${payments.length}</span>
                        </div>
                        <div class="bg-white/10 rounded-lg px-4 py-2">
                            <span class="text-purple-200">Total Earned:</span>
                            <span class="text-green-400 font-bold ml-2">$${totalEarnings.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <div class="p-6 overflow-y-auto max-h-[60vh]">
                    <table class="w-full">
                        <thead>
                            <tr class="text-left text-gray-400 text-sm border-b border-gray-700">
                                <th class="pb-3">Date</th>
                                <th class="pb-3">Renter</th>
                                <th class="pb-3">Frequency</th>
                                <th class="pb-3 text-right">Amount</th>
                                <th class="pb-3 text-right">Recorded</th>
                                <th class="pb-3 text-center w-16">Delete</th>
                            </tr>
                        </thead>
                        <tbody class="text-sm">
                            ${sortedPayments.map((payment, i) => `
                                <tr class="border-b border-gray-700/50 hover:bg-gray-700/30 group">
                                    <td class="py-3 text-white font-medium">${formatDate(payment.paymentDate)}</td>
                                    <td class="py-3 text-gray-300">${payment.renterName || 'Unknown'}</td>
                                    <td class="py-3">
                                        <span class="px-2 py-1 rounded-full text-xs font-semibold ${
                                            payment.frequency === 'monthly' ? 'bg-purple-500/20 text-purple-300' :
                                            payment.frequency === 'biweekly' ? 'bg-blue-500/20 text-blue-300' :
                                            payment.frequency === 'daily' ? 'bg-cyan-500/20 text-cyan-300' :
                                            'bg-green-500/20 text-green-300'
                                        }">
                                            ${payment.frequency || 'weekly'}
                                        </span>
                                    </td>
                                    <td class="py-3 text-right text-green-400 font-bold">$${(payment.amount || 0).toLocaleString()}</td>
                                    <td class="py-3 text-right text-gray-500 text-xs">
                                        ${new Date(payment.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                                    </td>
                                    <td class="py-3 text-center">
                                        <button onclick="deletePaymentFromModal(${propertyId}, '${payment.id}')" 
                                            class="opacity-50 group-hover:opacity-100 p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 transition-all"
                                            title="Delete this payment">
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existing = $('fullLedgerModal');
    if (existing) existing.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

// Delete payment from the full ledger modal (refreshes modal after)
window.deletePaymentFromModal = async function(propertyId, paymentId) {
    if (!confirm('Are you sure you want to delete this payment? This will update all financial stats.')) {
        return;
    }
    try {
        const historyDoc = await db.collection('paymentHistory').doc(String(propertyId)).get();
        
        if (!historyDoc.exists) {
            showToast('❌ Payment history not found', 'error');
            return;
        }
        
        let payments = historyDoc.data().payments || [];
        const originalCount = payments.length;
        payments = payments.filter(p => p.id !== paymentId);
        
        if (payments.length === originalCount) {
            showToast('❌ Payment not found', 'error');
            return;
        }
        
        await db.collection('paymentHistory').doc(String(propertyId)).set({
            propertyId: propertyId,
            payments: payments,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('🗑️ Payment deleted', 'success');
        
        // Refresh the modal
        await showFullLedger(propertyId);
        
        // Also refresh analytics
        await refreshPropertyAnalytics(propertyId);
        
    } catch (error) {
        console.error('[PaymentLog] Error deleting payment:', error);
        showToast('❌ Error: ' + error.message, 'error');
    }
};

window.closeFullLedger = function() {
    const modal = $('fullLedgerModal');
    if (modal) modal.remove();
};

// ==================== EVENT LISTENERS ====================
// Firebase login form
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = $('firebaseLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            let email = $('ownerEmail').value.trim().toLowerCase();
            const password = $('ownerPassword').value;
            const btn = $('loginSubmitBtn');
            const errorDiv = $('loginError');
            
            // Auto-append @pma.network if no @ symbol
            if (!email.includes('@')) {
                email = email + '@pma.network';
            }
            
            btn.disabled = true;
            btn.textContent = 'Signing In...';
            hideElement(errorDiv);
            
            auth.signInWithEmailAndPassword(email, password)
                .then(() => {
                    state.currentUser = 'owner';
                    closeModal('loginModal');
                    hideOwnerLoginForm();
                    hideElement($('renterSection'));
                    hideElement($('propertyDetailPage'));
                    hideElement($('propertyStatsPage'));
                    showElement($('ownerDashboard'));
                    updateAuthButton(true);
                    renderOwnerDashboard();
                    loadUsername();
                    window.scrollTo(0, 0);
                })
                .catch(error => {
                    const messages = {
                        'auth/user-not-found': 'No account found with this username.',
                        'auth/wrong-password': 'Incorrect password. Please try again.',
                        'auth/invalid-credential': 'Invalid username or password.',
                        'auth/too-many-requests': 'Too many failed attempts. Please try again later.'
                    };
                    errorDiv.textContent = messages[error.code] || 'Invalid username or password. Please try again.';
                    showElement(errorDiv);
                })
                .finally(() => {
                    btn.disabled = false;
                    btn.textContent = 'Sign In';
                });
        });
    }
    
    // Review form
    const reviewForm = $('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (!state.currentPropertyId) return;
            
            const review = {
                name: $('reviewerName').value.trim(),
                rating: parseInt($('reviewRating').value),
                text: $('reviewText').value.trim(),
                date: new Date().toLocaleDateString()
            };
            
            if (!state.reviews[state.currentPropertyId]) {
                state.reviews[state.currentPropertyId] = [];
            }
            state.reviews[state.currentPropertyId].unshift(review);
            localStorage.setItem('propertyReviews', JSON.stringify(state.reviews));
            displayReviews(state.currentPropertyId);
            this.reset();
            alert('Thank you for your review!');
        });
    }
    
    // Mobile menu
    const menuBtn = $('menuBtn');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => $('mobileMenu').classList.toggle('hidden'));
    }
});

// ==================== EDIT TITLE/LOCATION ====================
window.startEditField = function(field, propertyId, element) {
    const currentValue = PropertyDataService.getValue(propertyId, field, properties.find(p => p.id === propertyId)?.[field]);
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentValue;
    input.className = 'bg-gray-800 border-2 border-purple-500 rounded-lg px-3 py-2 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400';
    input.style.width = Math.max(200, element.offsetWidth + 50) + 'px';
    
    const originalContent = element.innerHTML;
    element.innerHTML = '';
    element.appendChild(input);
    input.focus();
    input.select();
    
    const saveField = async () => {
        const newValue = input.value.trim();
        if (newValue && newValue !== currentValue) {
            element.innerHTML = '<span class="text-gray-400">Saving...</span>';
            try {
                await PropertyDataService.write(propertyId, field, newValue);
                
                // Update local property object
                const prop = properties.find(p => p.id === propertyId);
                if (prop) prop[field] = newValue;
                
                // Update Firestore properties doc for user-created properties
                await db.collection('settings').doc('properties').set({
                    [propertyId]: properties.find(p => p.id === propertyId)
                }, { merge: true });
                
                renderPropertyStatsContent(propertyId);
                renderProperties(state.filteredProperties);
            } catch (error) {
                console.error('Failed to save:', error);
                element.innerHTML = originalContent;
            }
        } else {
            element.innerHTML = currentValue;
        }
    };
    
    input.addEventListener('blur', saveField);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            input.blur();
        } else if (e.key === 'Escape') {
            element.innerHTML = currentValue;
        }
    });
};

// ==================== IMAGE MANAGEMENT ====================
window.openAddImageModal = function(propertyId) {
    window.currentImagePropertyId = propertyId;
    $('newImageUrl').value = '';
    hideElement($('addImageError'));
    openModal('addImageModal');
};

window.closeAddImageModal = function() {
    closeModal('addImageModal');
    window.currentImagePropertyId = null;
};

window.saveNewImage = async function() {
    const propertyId = window.currentImagePropertyId;
    if (!propertyId) return;
    
    const imageUrl = $('newImageUrl').value.trim();
    const errorDiv = $('addImageError');
    
    if (!imageUrl) {
        errorDiv.textContent = 'Please enter an image URL';
        showElement(errorDiv);
        return;
    }
    
    // Basic URL validation
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        errorDiv.textContent = 'Please enter a valid URL starting with http:// or https://';
        showElement(errorDiv);
        return;
    }
    
    const btn = $('saveImageBtn');
    btn.disabled = true;
    btn.textContent = 'Adding...';
    
    try {
        const prop = properties.find(p => p.id === propertyId);
        if (!prop) throw new Error('Property not found');
        
        // Add new image to array
        prop.images.push(imageUrl);
        state.currentImages = prop.images;
        
        // Ensure owner info is set (especially for base properties being edited)
        if (!prop.ownerEmail) {
            prop.ownerEmail = (auth.currentUser?.email || 'richard2019201900@gmail.com').toLowerCase();
        }
        
        // Save to Firestore
        await db.collection('settings').doc('properties').set({
            [propertyId]: prop
        }, { merge: true });
        
        // Re-render
        renderPropertyStatsContent(propertyId);
        closeAddImageModal();
        
    } catch (error) {
        console.error('Failed to add image:', error);
        errorDiv.textContent = 'Failed to add image. Please try again.';
        showElement(errorDiv);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Add Image';
    }
};

window.deletePropertyImage = async function(propertyId, imageIndex, imageUrl) {
    const prop = properties.find(p => p.id === propertyId);
    if (!prop || !prop.images || prop.images.length <= 1) {
        alert('Cannot delete the last image. Properties must have at least one image.');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this image?')) {
        return;
    }
    
    try {
        // Remove image from array
        prop.images.splice(imageIndex, 1);
        state.currentImages = prop.images;
        
        // Ensure owner info is set (especially for base properties being edited)
        if (!prop.ownerEmail) {
            prop.ownerEmail = (auth.currentUser?.email || 'richard2019201900@gmail.com').toLowerCase();
        }
        
        // Save to Firestore
        await db.collection('settings').doc('properties').set({
            [propertyId]: prop
        }, { merge: true });
        
        // Re-render
        renderPropertyStatsContent(propertyId);
        
    } catch (error) {
        console.error('Failed to delete image:', error);
        alert('Failed to delete image. Please try again.');
    }
};

// ==================== COPY REMINDER SCRIPT ====================
window.copyReminderScript = function(propertyId, btn) {
    const scriptElement = $(`reminderScript-${propertyId}`);
    if (!scriptElement) return;
    
    // Get value from textarea (or textContent if it's a div)
    const text = scriptElement.value || scriptElement.textContent;
    const originalHtml = btn.innerHTML;
    
    navigator.clipboard.writeText(text).then(() => {
        // Show success feedback
        btn.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            Copied!
        `;
        btn.classList.remove('from-green-500', 'to-emerald-600');
        btn.classList.add('from-purple-500', 'to-purple-600');
        
        setTimeout(() => {
            btn.innerHTML = originalHtml;
            btn.classList.remove('from-purple-500', 'to-purple-600');
            btn.classList.add('from-green-500', 'to-emerald-600');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            btn.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                Copied!
            `;
            btn.classList.remove('from-green-500', 'to-emerald-600');
            btn.classList.add('from-purple-500', 'to-purple-600');
            setTimeout(() => {
                btn.innerHTML = originalHtml;
                btn.classList.remove('from-purple-500', 'to-purple-600');
                btn.classList.add('from-green-500', 'to-emerald-600');
            }, 2000);
        } catch(e) {
            alert('Failed to copy. Please select and copy manually.');
        }
        document.body.removeChild(textArea);
    });
};

// ==================== EDIT REMINDER SCRIPT ====================
window.startEditReminderScript = function(propertyId) {
    const tile = $(`tile-reminderScript-${propertyId}`);
    const scriptDiv = $(`reminderScript-${propertyId}`);
    if (!tile || !scriptDiv) return;
    
    const currentValue = scriptDiv.textContent;
    
    tile.innerHTML = `
        <textarea id="input-reminderScript-${propertyId}"
                  class="w-full bg-gray-800 border-2 border-purple-500 rounded-lg p-3 text-gray-200 font-medium resize-y"
                  rows="4"
                  onclick="event.stopPropagation()">${currentValue}</textarea>
        <div class="flex gap-2 mt-3">
            <button onclick="event.stopPropagation(); saveReminderScript(${propertyId})" 
                    class="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg font-bold text-sm transition">
                Save
            </button>
            <button onclick="event.stopPropagation(); cancelReminderEdit(${propertyId})" 
                    class="flex-1 bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded-lg font-bold text-sm transition">
                Cancel
            </button>
        </div>
    `;
    
    const input = $(`input-reminderScript-${propertyId}`);
    if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
    }
};

window.saveReminderScript = async function(propertyId) {
    const tile = $(`tile-reminderScript-${propertyId}`);
    const input = $(`input-reminderScript-${propertyId}`);
    if (!tile || !input) return;
    
    const newValue = input.value.trim();
    
    // Show saving state
    tile.innerHTML = `<div id="reminderScript-${propertyId}" class="text-gray-200 font-medium opacity-70">Saving...</div>`;
    
    try {
        await PropertyDataService.write(propertyId, 'customReminderScript', newValue);
        
        // Refresh the stats page to show updated content
        viewPropertyStats(propertyId);
    } catch (error) {
        console.error('Failed to save reminder script:', error);
        alert('Failed to save. Please try again.');
        // Restore the input
        startEditReminderScript(propertyId);
    }
};

window.cancelReminderEdit = function(propertyId) {
    const tile = $(`tile-reminderScript-${propertyId}`);
    if (!tile) return;
    
    const originalValue = tile.dataset.originalValue || '';
    tile.innerHTML = `<div id="reminderScript-${propertyId}" class="text-gray-200 font-medium whitespace-pre-wrap">${originalValue}</div>`;
};

window.resetReminderScript = async function(propertyId) {
    if (!confirm('Reset to the auto-generated reminder script?')) return;
    
    try {
        await PropertyDataService.write(propertyId, 'customReminderScript', '');
        viewPropertyStats(propertyId);
    } catch (error) {
        console.error('Failed to reset reminder script:', error);
        alert('Failed to reset. Please try again.');
    }
};

// ==================== COPY RENTER PHONE ====================
window.copyRenterPhone = function(phoneNumber, btn) {
    // Sanitize phone number - remove all non-digits
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const originalHtml = btn.innerHTML;
    
    navigator.clipboard.writeText(cleanPhone).then(() => {
        // Show success feedback
        btn.innerHTML = `
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            Copied!
        `;
        btn.classList.remove('bg-pink-500', 'hover:bg-pink-400');
        btn.classList.add('bg-green-500');
        
        setTimeout(() => {
            btn.innerHTML = originalHtml;
            btn.classList.remove('bg-green-500');
            btn.classList.add('bg-pink-500', 'hover:bg-pink-400');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = cleanPhone;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            btn.innerHTML = `
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                Copied!
            `;
            btn.classList.remove('bg-pink-500', 'hover:bg-pink-400');
            btn.classList.add('bg-green-500');
            setTimeout(() => {
                btn.innerHTML = originalHtml;
                btn.classList.remove('bg-green-500');
                btn.classList.add('bg-pink-500', 'hover:bg-pink-400');
            }, 2000);
        } catch(e) {
            alert('Failed to copy phone number.');
        }
        document.body.removeChild(textArea);
    });
};

// ==================== INITIALIZE ====================
async function init() {
    loadReviews();
    await initFirestore();
    setupRealtimeListener();
    
    // Listen for auth state changes (including on page load)
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // User is signed in - restore owner session
            state.currentUser = 'owner';
            updateAuthButton(true);
            
            // Ensure user has tier set (default to starter for new users)
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (!userDoc.exists || !userDoc.data()?.tier) {
                    // New user or missing tier - set to starter
                    await db.collection('users').doc(user.uid).set({
                        email: user.email.toLowerCase(),
                        tier: 'starter',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                }
                
                // Store user tier in state for quick access
                const updatedDoc = await db.collection('users').doc(user.uid).get();
                state.userTier = updatedDoc.data()?.tier || 'starter';
            } catch (error) {
                console.error('[Auth] Error checking user tier:', error);
                state.userTier = 'starter';
            }
            
            // Track last login time
            try {
                await db.collection('users').doc(user.uid).set({
                    lastLoginAt: new Date().toISOString(),
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            } catch (e) {
                console.warn('[Auth] Could not update last login:', e);
            }
            
            renderOwnerDashboard();
            loadUsername();
            
            // Start real-time property sync listener (all users)
            if (typeof startPropertySyncListener === 'function') {
                startPropertySyncListener();
            }
            
            // Start real-time celebration listener (gamification banners)
            if (typeof setupCelebrationListener === 'function') {
                setupCelebrationListener();
            }
            
            // Start real-time listener for upgrade requests (admin only)
            if (typeof loadPendingUpgradeRequests === 'function') {
                loadPendingUpgradeRequests();
            }
        } else {
            // No user signed in
            state.currentUser = null;
            state.userTier = null;
            updateAuthButton(false);
            
            // Stop property sync listener
            if (typeof stopPropertySyncListener === 'function') {
                stopPropertySyncListener();
            }
        }
    });
    
    // Apply all filters (including hideUnavailable which is checked by default)
    // This ensures the initial render respects the default filter state
    if (typeof applyAllFilters === 'function') {
        applyAllFilters();
    } else {
        renderProperties(properties);
    }
}

// ============================================================================
// LEASE COMPLETION SYSTEM
// ============================================================================

/**
 * Show the Complete Lease confirmation modal
 * Displays tenure summary and confirmation before completing
 */
window.showCompleteLeaseModal = async function(propertyId) {
    // Prevent opening multiple modals
    if (document.getElementById('completeLeaseModal')) {
        console.warn('[CompleteLease] Modal already open');
        return;
    }
    
    const p = properties.find(prop => prop.id === propertyId);
    if (!p) return;
    
    // Get FRESH data from PropertyDataService
    const renterName = PropertyDataService.getValue(propertyId, 'renterName', p.renterName || '');
    const renterPhone = PropertyDataService.getValue(propertyId, 'renterPhone', p.renterPhone || '');
    const paymentFrequency = PropertyDataService.getValue(propertyId, 'paymentFrequency', p.paymentFrequency || '');
    
    if (!renterName) {
        showToast('No renter assigned to this property. The lease may have already been completed.', 'error');
        // Refresh the page to show correct state
        viewPropertyStats(propertyId);
        return;
    }
    
    // Calculate tenure summary from payment history
    const tenureSummary = await calculateTenureSummary(propertyId, renterName);
    
    const modalHTML = `
        <div id="completeLeaseModal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onclick="if(event.target === this) closeCompleteLeaseModal()">
            <div class="bg-gray-900 rounded-2xl max-w-lg w-full border border-orange-500/50 shadow-2xl overflow-hidden" onclick="event.stopPropagation()">
                <!-- Header -->
                <div class="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4">
                    <h3 class="text-xl font-bold text-white flex items-center gap-3">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Complete Lease
                    </h3>
                    <p class="text-orange-100 text-sm mt-1">${p.title}</p>
                </div>
                
                <!-- Content -->
                <div class="p-6">
                    <!-- Renter Summary -->
                    <div class="bg-gray-800 rounded-xl p-4 mb-4">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-12 h-12 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                ${renterName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div class="text-white font-bold">${renterName}</div>
                                <div class="text-gray-400 text-sm">${renterPhone || 'No phone on file'}</div>
                            </div>
                        </div>
                        <div class="text-gray-400 text-sm capitalize">${paymentFrequency || 'Unknown'} payment schedule</div>
                    </div>
                    
                    <!-- Tenure Statistics -->
                    <div class="bg-gradient-to-br from-green-900/50 to-emerald-900/50 border border-green-500/30 rounded-xl p-4 mb-4">
                        <h4 class="text-green-400 font-bold mb-3 flex items-center gap-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                            Tenure Summary
                        </h4>
                        
                        <!-- Payment breakdown - more prominent -->
                        <div class="bg-gray-800/50 rounded-lg p-3 mb-3">
                            <div class="flex items-center justify-between">
                                <div class="text-gray-300">
                                    <span class="text-2xl font-bold text-white">${tenureSummary.paymentCount}</span>
                                    <span class="text-gray-400"> × </span>
                                    <span class="text-xl font-bold text-green-400">$${tenureSummary.avgPayment.toLocaleString()}</span>
                                    <span class="text-gray-400 capitalize"> ${tenureSummary.frequency}</span>
                                </div>
                                <div class="text-right">
                                    <div class="text-xs text-gray-500 uppercase">Total</div>
                                    <div class="text-xl font-bold text-green-400">$${tenureSummary.totalCollected.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-3 text-sm">
                            <div class="bg-gray-800/30 rounded-lg p-2">
                                <div class="text-gray-500 text-xs uppercase">First Payment</div>
                                <div class="text-white font-semibold">${tenureSummary.firstPayment || 'N/A'}</div>
                            </div>
                            <div class="bg-gray-800/30 rounded-lg p-2">
                                <div class="text-gray-500 text-xs uppercase">Last Payment</div>
                                <div class="text-white font-semibold">${tenureSummary.lastPayment || 'N/A'}</div>
                            </div>
                        </div>
                        
                        ${tenureSummary.tenureDays > 0 ? `
                        <div class="mt-3 pt-3 border-t border-green-500/30">
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="text-gray-500 text-xs uppercase">Tenure Duration</div>
                                    <div class="text-white font-semibold">${tenureSummary.tenureDays} days (${tenureSummary.tenureWeeks} weeks)</div>
                                </div>
                                <div class="text-right">
                                    <div class="text-gray-500 text-xs uppercase">Coverage Through</div>
                                    <div class="text-white font-semibold">${tenureSummary.coverageEnd || 'N/A'}</div>
                                </div>
                            </div>
                            <div class="text-xs text-gray-500 mt-2">
                                Based on ${tenureSummary.paymentCount} ${tenureSummary.frequency} payment${tenureSummary.paymentCount !== 1 ? 's' : ''} (${tenureSummary.daysPerCycle} days each)
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    
                    <!-- Warning -->
                    <div class="bg-yellow-900/30 border border-yellow-500/30 rounded-xl p-4 mb-4">
                        <div class="flex items-start gap-3">
                            <svg class="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            <div>
                                <div class="text-yellow-400 font-bold text-sm">This will:</div>
                                <ul class="text-yellow-200/80 text-sm mt-1 space-y-1">
                                    <li>• Archive ${renterName}'s tenure to payment history</li>
                                    <li>• Clear renter name, phone, notes, and payment schedule</li>
                                    <li>• Mark property as <span class="text-green-400 font-semibold">Available</span></li>
                                    <li>• Begin tracking vacancy period</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Remove Keys checkbox -->
                    <label class="flex items-center gap-3 cursor-pointer mb-3 bg-gray-800 p-3 rounded-lg border border-gray-700">
                        <input type="checkbox" id="confirmKeysRemoved" class="w-5 h-5 rounded border-gray-600 text-amber-500 focus:ring-amber-500 bg-gray-700">
                        <div>
                            <span class="text-amber-400 font-semibold">🔑 Keys Removed</span>
                            <p class="text-gray-400 text-xs">Confirm renter has returned all keys/access</p>
                        </div>
                    </label>
                    
                    <!-- Confirmation checkbox -->
                    <label class="flex items-center gap-3 cursor-pointer mb-4">
                        <input type="checkbox" id="confirmLeaseComplete" class="w-5 h-5 rounded border-gray-600 text-green-500 focus:ring-green-500 bg-gray-700">
                        <span class="text-gray-300">I confirm ${renterName} is moving out and the lease is complete</span>
                    </label>
                    
                    <!-- Actions -->
                    <div class="flex gap-3">
                        <button onclick="closeCompleteLeaseModal()" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-xl font-bold transition">
                            Cancel
                        </button>
                        <button id="completeLeaseBtn" onclick="completeLease(${propertyId})" disabled class="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl font-bold transition opacity-50 cursor-not-allowed flex items-center justify-center gap-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                            Complete Lease
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add checkbox listeners - both must be checked to enable button
    const keysCheckbox = document.getElementById('confirmKeysRemoved');
    const confirmCheckbox = document.getElementById('confirmLeaseComplete');
    const btn = document.getElementById('completeLeaseBtn');
    
    const updateButtonState = () => {
        if (keysCheckbox.checked && confirmCheckbox.checked) {
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
            btn.classList.add('hover:from-green-600', 'hover:to-emerald-700');
        } else {
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed');
            btn.classList.remove('hover:from-green-600', 'hover:to-emerald-700');
        }
    };
    
    keysCheckbox.addEventListener('change', updateButtonState);
    confirmCheckbox.addEventListener('change', updateButtonState);
};

/**
 * Show the Eviction modal
 * For non-payment evictions with final message to renter
 */
window.showEvictionModal = async function(propertyId) {
    // Prevent opening multiple modals
    if (document.getElementById('evictionModal')) {
        console.warn('[Eviction] Modal already open');
        return;
    }
    
    const p = properties.find(prop => prop.id === propertyId);
    if (!p) return;
    
    const renterName = PropertyDataService.getValue(propertyId, 'renterName', p.renterName || '');
    
    if (!renterName) {
        showToast('No renter assigned to this property.', 'error');
        viewPropertyStats(propertyId);
        return;
    }
    
    // Generate eviction message
    const evictionMessage = `Hey ${renterName}, thank you for renting with us. Unfortunately, due to non-payment your property has been cleaned out and placed back on the market for rent. If you have any questions or believe this was done in error, please contact me.`;
    
    const modalHTML = `
        <div id="evictionModal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onclick="if(event.target === this) closeEvictionModal()">
            <div class="bg-gray-900 rounded-2xl max-w-lg w-full border border-red-500/50 shadow-2xl overflow-hidden" onclick="event.stopPropagation()">
                <!-- Header -->
                <div class="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
                    <h3 class="text-xl font-bold text-white flex items-center gap-3">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                        Evict Renter
                    </h3>
                    <p class="text-red-100 text-sm mt-1">${p.title}</p>
                </div>
                
                <!-- Content -->
                <div class="p-6">
                    <!-- Renter Info -->
                    <div class="bg-gray-800 rounded-xl p-4 mb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-lg">
                                ${renterName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div class="text-white font-bold">${renterName}</div>
                                <div class="text-red-400 text-sm">Being evicted for non-payment</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Eviction Message -->
                    <div class="bg-red-900/30 border border-red-500/30 rounded-xl p-4 mb-4">
                        <div class="flex items-center justify-between mb-2">
                            <h4 class="text-red-400 font-bold flex items-center gap-2">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                                Eviction Message
                            </h4>
                            <button onclick="copyEvictionMessage()" class="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded-lg font-semibold transition flex items-center gap-1">
                                📋 Copy
                            </button>
                        </div>
                        <textarea id="evictionMessageText" class="w-full bg-gray-800 text-gray-200 rounded-lg p-3 text-sm resize-none" rows="4">${evictionMessage}</textarea>
                    </div>
                    
                    <!-- Warning -->
                    <div class="bg-yellow-900/30 border border-yellow-500/30 rounded-xl p-4 mb-4">
                        <div class="flex items-start gap-3">
                            <svg class="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            <div>
                                <div class="text-yellow-400 font-bold text-sm">This will:</div>
                                <ul class="text-yellow-200/80 text-sm mt-1 space-y-1">
                                    <li>• Record eviction in payment history</li>
                                    <li>• Clear renter name, phone, notes, and payment schedule</li>
                                    <li>• Mark property as <span class="text-green-400 font-semibold">Available</span></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Remove Keys checkbox -->
                    <label class="flex items-center gap-3 cursor-pointer mb-3 bg-gray-800 p-3 rounded-lg border border-gray-700">
                        <input type="checkbox" id="confirmEvictionKeysRemoved" class="w-5 h-5 rounded border-gray-600 text-amber-500 focus:ring-amber-500 bg-gray-700">
                        <div>
                            <span class="text-amber-400 font-semibold">🔑 Keys Removed / Changed Locks</span>
                            <p class="text-gray-400 text-xs">Confirm renter no longer has access</p>
                        </div>
                    </label>
                    
                    <!-- Confirmation checkbox -->
                    <label class="flex items-center gap-3 cursor-pointer mb-4">
                        <input type="checkbox" id="confirmEviction" class="w-5 h-5 rounded border-gray-600 text-red-500 focus:ring-red-500 bg-gray-700">
                        <span class="text-gray-300">I confirm ${renterName} is being evicted for non-payment</span>
                    </label>
                    
                    <!-- Actions -->
                    <div class="flex gap-3">
                        <button onclick="closeEvictionModal()" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-xl font-bold transition">
                            Cancel
                        </button>
                        <button id="evictBtn" onclick="processEviction(${propertyId})" disabled class="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-4 rounded-xl font-bold transition opacity-50 cursor-not-allowed flex items-center justify-center gap-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                            Evict Renter
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add checkbox listeners - both must be checked to enable button
    const keysCheckbox = document.getElementById('confirmEvictionKeysRemoved');
    const confirmCheckbox = document.getElementById('confirmEviction');
    const btn = document.getElementById('evictBtn');
    
    const updateButtonState = () => {
        if (keysCheckbox.checked && confirmCheckbox.checked) {
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
            btn.classList.add('hover:from-red-700', 'hover:to-red-800');
        } else {
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed');
            btn.classList.remove('hover:from-red-700', 'hover:to-red-800');
        }
    };
    
    keysCheckbox.addEventListener('change', updateButtonState);
    confirmCheckbox.addEventListener('change', updateButtonState);
};

/**
 * Close eviction modal
 */
window.closeEvictionModal = function() {
    const modal = document.getElementById('evictionModal');
    if (modal) modal.remove();
};

/**
 * Copy eviction message to clipboard
 */
window.copyEvictionMessage = function() {
    const textarea = document.getElementById('evictionMessageText');
    if (textarea) {
        navigator.clipboard.writeText(textarea.value).then(() => {
            showToast('Eviction message copied!', 'success');
        }).catch(() => {
            textarea.select();
            document.execCommand('copy');
            showToast('Eviction message copied!', 'success');
        });
    }
};

/**
 * Process eviction - same as completeLease but with eviction flag
 */
window.processEviction = async function(propertyId) {
    const btn = document.getElementById('evictBtn');
    btn.disabled = true;
    btn.innerHTML = '<svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Processing...';
    
    try {
        const p = properties.find(prop => prop.id === propertyId);
        const renterName = PropertyDataService.getValue(propertyId, 'renterName', '');
        
        // Record eviction in payment history
        await recordPaymentHistory(propertyId, {
            renterName: renterName,
            type: 'eviction',
            amount: 0,
            paymentDate: new Date().toISOString().split('T')[0],
            note: 'Evicted for non-payment'
        });
        
        // Clear renter info (same as completeLease)
        await PropertyDataService.write(propertyId, 'renterName', '');
        await PropertyDataService.write(propertyId, 'renterPhone', '');
        await PropertyDataService.write(propertyId, 'renterNotes', '');
        await PropertyDataService.write(propertyId, 'lastPaymentDate', '');
        await PropertyDataService.write(propertyId, 'paymentFrequency', '');
        
        // Mark as available
        state.availability[propertyId] = true;
        await saveAvailability(propertyId, true);
        
        closeEvictionModal();
        showToast(`${renterName} has been evicted. Property marked as available.`, 'success');
        
        // Refresh the page
        viewPropertyStats(propertyId);
        renderOwnerDashboard();
        
    } catch (error) {
        console.error('[Eviction] Error:', error);
        showToast('Error processing eviction. Please try again.', 'error');
        btn.disabled = false;
        btn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg> Evict Renter';
    }
};

/**
 * Calculate tenure summary from payment history
 * Properly accounts for payment frequency to determine actual tenure duration
 */
async function calculateTenureSummary(propertyId, renterName) {
    const payments = await getPaymentHistory(propertyId);
    const p = properties.find(prop => prop.id === propertyId);
    
    // Get current payment frequency
    const paymentFrequency = PropertyDataService.getValue(propertyId, 'paymentFrequency', p?.paymentFrequency || 'weekly');
    
    // Filter payments for this renter (case-insensitive match)
    const renterPayments = payments.filter(pay => 
        pay.renterName && pay.renterName.toLowerCase() === renterName.toLowerCase()
    );
    
    if (renterPayments.length === 0) {
        return {
            totalCollected: 0,
            paymentCount: 0,
            firstPayment: null,
            lastPayment: null,
            tenureDays: 0,
            tenureWeeks: 0,
            frequency: paymentFrequency,
            avgPayment: 0
        };
    }
    
    // Sort by paymentDate
    renterPayments.sort((a, b) => new Date(a.paymentDate) - new Date(b.paymentDate));
    
    const totalCollected = renterPayments.reduce((sum, pay) => sum + (pay.amount || 0), 0);
    const firstDate = new Date(renterPayments[0].paymentDate);
    const lastPaymentDate = new Date(renterPayments[renterPayments.length - 1].paymentDate);
    
    // Calculate days per payment cycle based on frequency
    let daysPerCycle = 7; // default weekly
    if (paymentFrequency === 'daily') daysPerCycle = 1;
    else if (paymentFrequency === 'weekly') daysPerCycle = 7;
    else if (paymentFrequency === 'biweekly') daysPerCycle = 14;
    else if (paymentFrequency === 'monthly') daysPerCycle = 30;
    
    // Calculate actual tenure: from first payment through end of last payment period
    // If they paid once biweekly, they stayed for 2 weeks (14 days)
    // Tenure = (number of payments) × (days per payment cycle)
    const tenureDays = renterPayments.length * daysPerCycle;
    const tenureWeeks = Math.round(tenureDays / 7 * 10) / 10; // Round to 1 decimal
    
    // Calculate the coverage end date (when the last payment period ends)
    const coverageEndDate = new Date(lastPaymentDate);
    coverageEndDate.setDate(coverageEndDate.getDate() + daysPerCycle);
    
    // Average payment amount
    const avgPayment = Math.round(totalCollected / renterPayments.length);
    
    return {
        totalCollected: totalCollected,
        paymentCount: renterPayments.length,
        firstPayment: firstDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        lastPayment: lastPaymentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        coverageEnd: coverageEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        tenureDays: tenureDays,
        tenureWeeks: tenureWeeks,
        frequency: paymentFrequency,
        daysPerCycle: daysPerCycle,
        avgPayment: avgPayment,
        payments: renterPayments
    };
}

/**
 * Complete the lease - archive tenure, clear renter, mark available
 */
window.completeLease = async function(propertyId) {
    const btn = document.getElementById('completeLeaseBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processing...';
    }
    
    try {
        const p = properties.find(prop => prop.id === propertyId);
        if (!p) throw new Error('Property not found');
        
        const renterName = PropertyDataService.getValue(propertyId, 'renterName', p.renterName || '');
        const renterPhone = PropertyDataService.getValue(propertyId, 'renterPhone', p.renterPhone || '');
        const paymentFrequency = PropertyDataService.getValue(propertyId, 'paymentFrequency', p.paymentFrequency || '');
        const renterNotes = PropertyDataService.getValue(propertyId, 'renterNotes', p.renterNotes || '');
        
        // Get tenure summary
        const tenureSummary = await calculateTenureSummary(propertyId, renterName);
        
        // Create tenure record with all details
        const tenureRecord = {
            id: Date.now().toString(),
            renterName: renterName,
            renterPhone: renterPhone,
            paymentFrequency: paymentFrequency,
            renterNotes: renterNotes,
            startDate: tenureSummary.firstPayment,
            endDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            coverageEnd: tenureSummary.coverageEnd,
            completedAt: new Date().toISOString(),
            totalCollected: tenureSummary.totalCollected,
            paymentCount: tenureSummary.paymentCount,
            avgPayment: tenureSummary.avgPayment,
            tenureDays: tenureSummary.tenureDays,
            tenureWeeks: tenureSummary.tenureWeeks,
            daysPerCycle: tenureSummary.daysPerCycle,
            status: 'completed'
        };
        
        // Save tenure to history
        await saveTenureHistory(propertyId, tenureRecord);
        
        // Clear renter data (this clears BOTH Firestore docs and all local caches)
        await clearRenterData(propertyId);
        
        // Mark property as available
        state.availability[propertyId] = true;
        await saveAvailability(propertyId, true);
        
        // Log vacancy start
        await logVacancyStart(propertyId);
        
        // Update button to show success (prevent double-click)
        if (btn) {
            btn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Completed!';
            btn.classList.remove('from-orange-500', 'to-red-500');
            btn.classList.add('from-green-500', 'to-green-600');
        }
        
        // Close modal and show success after a brief delay for Firestore to propagate
        setTimeout(async () => {
            closeCompleteLeaseModal();
            showToast(`✅ Lease completed for ${renterName}. Total collected: $${tenureSummary.totalCollected.toLocaleString()}`, 'success');
            
            // Force refresh ALL data - clear local property object
            const numericId = typeof propertyId === 'string' ? parseInt(propertyId) : propertyId;
            const prop = properties.find(p => p.id === numericId);
            if (prop) {
                prop.renterName = '';
                prop.renterPhone = '';
                prop.renterNotes = '';
                prop.paymentFrequency = '';
                prop.lastPaymentDate = '';
            }
            
            console.log('[CompleteLease] Pre-refresh state clear done');
            
            // Update all relevant UI components
            renderProperties(state.filteredProperties);
            if (state.currentUser === 'owner') renderOwnerDashboard();
            
            // Force re-render the stats page with guaranteed clean data
            renderPropertyStatsContent(propertyId);
        }, 1200);
        
    } catch (error) {
        console.error('[CompleteLease] Error:', error);
        showToast('Error completing lease: ' + error.message, 'error');
        
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Complete Lease';
        }
    }
};

/**
 * Save tenure record to Firestore
 */
async function saveTenureHistory(propertyId, tenureRecord) {
    try {
        const historyDoc = await db.collection('paymentHistory').doc(String(propertyId)).get();
        let data = historyDoc.exists ? historyDoc.data() : { payments: [] };
        
        // Initialize tenureHistory array if doesn't exist
        if (!data.tenureHistory) {
            data.tenureHistory = [];
        }
        
        // Add new tenure record
        data.tenureHistory.push(tenureRecord);
        
        // Save back
        await db.collection('paymentHistory').doc(String(propertyId)).set({
            ...data,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return true;
    } catch (error) {
        console.error('[TenureHistory] Error saving:', error);
        throw error;
    }
}

/**
 * Delete a tenure record from Firestore
 * @param {number} propertyId - The property ID
 * @param {string} tenureId - The tenure record ID to delete
 */
window.deleteTenureRecord = async function(propertyId, tenureId) {
    // Confirm deletion
    const confirmed = confirm('Are you sure you want to delete this tenure record?\n\nThis will remove the historical data for this renter\'s lease period.\n\nNote: This will also clear any associated vacancy tracking.\n\nThis action cannot be undone.');
    
    if (!confirmed) return;
    
    try {
        const historyDoc = await db.collection('paymentHistory').doc(String(propertyId)).get();
        if (!historyDoc.exists) {
            showToast('Error: Payment history not found', 'error');
            return;
        }
        
        let data = historyDoc.data();
        
        if (!data.tenureHistory || data.tenureHistory.length === 0) {
            showToast('Error: No tenure records found', 'error');
            return;
        }
        
        // Find the tenure record to get its completion date
        const tenureToDelete = data.tenureHistory.find(t => t.id === tenureId);
        
        // Find and remove the tenure record
        const originalLength = data.tenureHistory.length;
        data.tenureHistory = data.tenureHistory.filter(t => t.id !== tenureId);
        
        if (data.tenureHistory.length === originalLength) {
            showToast('Error: Tenure record not found', 'error');
            return;
        }
        
        // Also remove any ongoing vacancy period that was created when this lease completed
        // This helps with testing and data consistency
        if (data.vacancyPeriods && data.vacancyPeriods.length > 0) {
            // Remove ongoing vacancy periods (usually there should only be one)
            data.vacancyPeriods = data.vacancyPeriods.filter(v => v.status !== 'ongoing');
        }
        
        // Save back to Firestore
        await db.collection('paymentHistory').doc(String(propertyId)).set({
            ...data,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('✅ Tenure record deleted successfully', 'success');
        
        // Refresh the analytics section
        if (typeof renderPropertyAnalytics === 'function') {
            renderPropertyAnalytics(propertyId);
        }
        
        console.log('[TenureHistory] Deleted tenure:', tenureId, 'from property:', propertyId);
        
    } catch (error) {
        console.error('[TenureHistory] Error deleting:', error);
        showToast('Error deleting tenure record: ' + error.message, 'error');
    }
};

/**
 * Clear all renter-related data from property
 * UNIFIED ARCHITECTURE: All data writes to settings/properties
 */
async function clearRenterData(propertyId) {
    const fieldsToClean = [
        'renterName',
        'renterPhone', 
        'renterNotes',
        'paymentFrequency',
        'lastPaymentDate'
    ];
    
    const numericId = typeof propertyId === 'string' ? parseInt(propertyId) : propertyId;
    const prop = properties.find(p => p.id === numericId);
    
    console.log('[ClearRenterData] Starting clear for property:', numericId);
    
    // STEP 1: Clear local property object immediately
    if (prop) {
        prop.renterName = '';
        prop.renterPhone = '';
        prop.renterNotes = '';
        prop.paymentFrequency = '';
        prop.lastPaymentDate = '';
    }
    
    console.log('[ClearRenterData] Local state cleared');
    
    try {
        // UNIFIED: All properties write to settings/properties
        const updateData = {};
        fieldsToClean.forEach(field => {
            updateData[`${numericId}.${field}`] = '';
        });
        updateData[`${numericId}.updatedAt`] = firebase.firestore.FieldValue.serverTimestamp();
        updateData[`${numericId}.clearedBy`] = auth.currentUser?.email || 'system-clear';
        
        await db.collection('settings').doc('properties').update(updateData);
        
        console.log('[ClearRenterData] Successfully cleared all renter data for property:', numericId);
        console.log('[ClearRenterData] property object:', prop ? { renterName: prop.renterName, paymentFrequency: prop.paymentFrequency } : 'not found');
        
    } catch (error) {
        console.error('[ClearRenterData] Error clearing data:', error);
        throw error;
    }
}

/**
 * Log vacancy start date for tracking
 */
async function logVacancyStart(propertyId) {
    try {
        const historyDoc = await db.collection('paymentHistory').doc(String(propertyId)).get();
        let data = historyDoc.exists ? historyDoc.data() : { payments: [] };
        
        // Initialize vacancyPeriods array if doesn't exist
        if (!data.vacancyPeriods) {
            data.vacancyPeriods = [];
        }
        
        // Add new vacancy period (start only, endDate will be set when new renter moves in)
        data.vacancyPeriods.push({
            startDate: new Date().toISOString(),
            endDate: null,
            status: 'ongoing'
        });
        
        // Save back
        await db.collection('paymentHistory').doc(String(propertyId)).set({
            ...data,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        
    } catch (error) {
        console.warn('[VacancyLog] Error logging vacancy start:', error);
    }
}

/**
 * End vacancy period when new renter moves in
 */
async function endVacancyPeriod(propertyId) {
    try {
        const historyDoc = await db.collection('paymentHistory').doc(String(propertyId)).get();
        if (!historyDoc.exists) return;
        
        let data = historyDoc.data();
        if (!data.vacancyPeriods || data.vacancyPeriods.length === 0) return;
        
        // Find and update the ongoing vacancy period
        const ongoingIndex = data.vacancyPeriods.findIndex(v => v.status === 'ongoing');
        if (ongoingIndex !== -1) {
            data.vacancyPeriods[ongoingIndex].endDate = new Date().toISOString();
            data.vacancyPeriods[ongoingIndex].status = 'completed';
            
            // Calculate vacancy duration
            const startDate = new Date(data.vacancyPeriods[ongoingIndex].startDate);
            const endDate = new Date();
            data.vacancyPeriods[ongoingIndex].durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
            
            // Save back
            await db.collection('paymentHistory').doc(String(propertyId)).set({
                ...data,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
    } catch (error) {
        console.warn('[VacancyLog] Error ending vacancy period:', error);
    }
}

// Make endVacancyPeriod available globally for use in other files
window.endVacancyPeriod = endVacancyPeriod;

/**
 * Close the complete lease modal
 */
window.closeCompleteLeaseModal = function() {
    const modal = document.getElementById('completeLeaseModal');
    if (modal) modal.remove();
};

// Start the app
init();
