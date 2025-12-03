// ==================== VIEW PROPERTY ====================
window.viewProperty = function(id) {
    const p = properties.find(prop => prop.id === id);
    if (!p) return;
    
    state.currentPropertyId = id;
    state.currentImages = p.images;
    
    hideElement($('renterSection'));
    hideElement($('ownerDashboard'));
    hideElement($('propertyStatsPage'));
    showElement($('propertyDetailPage'));
    
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

    $('propertyDetailContent').innerHTML = `
        ${ownerTabs}
        ${p.videoUrl ? `
        <div class="p-4 md:p-6 bg-gradient-to-r from-red-900 to-pink-900 border-b border-gray-700">
            <div class="flex items-center space-x-3 mb-4">
                <svg class="w-6 h-6 md:w-8 md:h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"></path></svg>
                <h3 class="text-xl md:text-2xl font-black text-white">Virtual Video Tour</h3>
            </div>
            <video controls autoplay muted playsinline class="w-full rounded-xl shadow-2xl border border-gray-600" poster="${p.images[0]}">
                <source src="${p.videoUrl}" type="video/mp4">
            </video>
        </div>` : ''}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 p-4 md:p-6">
            ${p.images.map((img, i) => `
                <img src="${img}" alt="${sanitize(p.title)} - Image ${i+1}" onclick="openLightbox(state.currentImages, ${i})" class="img-clickable w-full h-60 md:h-80 object-cover rounded-xl shadow-lg border border-gray-600 ${i === 0 ? 'md:col-span-2' : ''}" loading="lazy">
            `).join('')}
        </div>
        <div class="p-5 md:p-8">
            <div class="flex flex-wrap justify-between items-start gap-4 mb-6">
                <div>
                    <h2 class="text-2xl md:text-4xl font-black text-white mb-2">✨ ${sanitize(p.title)}</h2>
                    <p class="text-lg md:text-xl text-gray-300 font-semibold">📍 Location: ${sanitize(p.location)}</p>
                    <p class="text-blue-400 font-semibold mt-1">👤 Owner: Loading...</p>
                </div>
                <span class="badge text-white text-sm font-bold px-4 py-2 rounded-full uppercase">${p.type}</span>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
                ${[
                    {icon:'Bed', val:PropertyDataService.getValue(id, 'bedrooms', p.bedrooms), label:'Bedrooms'},
                    {icon:'Bath', val:PropertyDataService.getValue(id, 'bathrooms', p.bathrooms), label:'Bathrooms'},
                    {icon:'Box', val:PropertyDataService.getValue(id, 'storage', p.storage).toLocaleString(), label:'Storage'},
                    {icon:'Home', val:PropertyDataService.getValue(id, 'interiorType', p.interiorType), label:'Interior'}
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
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                        <div class="text-gray-400 font-bold mb-2">Weekly Price</div>
                        <div class="text-2xl md:text-3xl font-black text-green-400">$${PropertyDataService.getValue(id, 'weeklyPrice', p.weeklyPrice).toLocaleString()}</div>
                    </div>
                    <div>
                        <div class="text-gray-400 font-bold mb-2">Monthly Price (Discounted)</div>
                        <div class="text-3xl md:text-4xl font-black text-purple-400">$${PropertyDataService.getValue(id, 'monthlyPrice', p.monthlyPrice).toLocaleString()}</div>
                    </div>
                </div>
            </div>
            <button onclick="openContactModal('rent', '${sanitize(p.title)}', ${id})" class="w-full gradient-bg text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-black text-lg md:text-xl hover:opacity-90 transition shadow-lg mb-4">Make an Offer to Rent</button>
            <button onclick="openContactModal('offer', '${sanitize(p.title)}', ${id})" class="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-black text-lg md:text-xl hover:opacity-90 transition shadow-lg">Make an Offer to Purchase</button>
        </div>`;
    
    displayReviews(id);
    
    // Load and display owner username
    getPropertyOwnerUsername(id).then(username => {
        const ownerEl = document.querySelector('#propertyDetailContent .text-blue-400');
        if (ownerEl) {
            ownerEl.textContent = `👤 Owner: ${username}`;
        }
    });
    
    window.scrollTo(0, 0);
};

// ==================== PROPERTY STATS PAGE ====================
/**
 * Renders the property stats page with EDITABLE tiles
 * All editable fields sync in real-time with Firestore
 */
window.viewPropertyStats = async function(id) {
    console.log('[viewPropertyStats] Opening stats page for property:', id);
    
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
    
    console.log('[viewPropertyStats] Access granted, loading property:', p.title);
    
    state.currentPropertyId = id;
    state.currentImages = p.images;
    
    // Fetch fresh data from Firestore
    try {
        const freshData = await PropertyDataService.read(id);
        if (freshData.exists) {
            state.propertyOverrides[id] = freshData.data;
        }
    } catch (error) {
        console.error('Error fetching property data:', error);
    }
    
    // Set up real-time listener for all property overrides
    PropertyDataService.subscribeAll((data) => {
        // Re-render when data changes from another source
        if (state.currentPropertyId === id) {
            console.log('Real-time update received, refreshing stats page');
            renderPropertyStatsContent(id);
            loadStatsOwnerName(id);
        }
    });
    
    renderPropertyStatsContent(id);
    loadStatsOwnerName(id);
    
    hideElement($('ownerDashboard'));
    hideElement($('renterSection'));
    hideElement($('propertyDetailPage'));
    showElement($('propertyStatsPage'));
    window.scrollTo(0, 0);
};

// Load owner name for stats page
async function loadStatsOwnerName(propertyId) {
    const ownerEl = $(`stats-owner-${propertyId}`);
    if (!ownerEl) return;
    
    try {
        // Use cached username lookup
        const username = await getPropertyOwnerUsername(propertyId);
        const spanEl = ownerEl.querySelector('span');
        if (spanEl) {
            spanEl.textContent = username;
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
    
    // Get effective values (overrides or defaults)
    const bedrooms = PropertyDataService.getValue(id, 'bedrooms', p.bedrooms);
    const bathrooms = PropertyDataService.getValue(id, 'bathrooms', p.bathrooms);
    const storage = PropertyDataService.getValue(id, 'storage', p.storage);
    const interiorType = PropertyDataService.getValue(id, 'interiorType', p.interiorType);
    const weeklyPrice = PropertyDataService.getValue(id, 'weeklyPrice', p.weeklyPrice);
    const monthlyPrice = PropertyDataService.getValue(id, 'monthlyPrice', p.monthlyPrice);
    
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
    const paymentFrequency = PropertyDataService.getValue(id, 'paymentFrequency', p.paymentFrequency || 'weekly');
    const lastPaymentDate = PropertyDataService.getValue(id, 'lastPaymentDate', p.lastPaymentDate || '');
    
    // Calculate next due date and days until due
    let nextDueDate = '';
    let daysUntilDue = null;
    let reminderScript = '';
    
    if (lastPaymentDate) {
        const lastDate = new Date(lastPaymentDate);
        const nextDate = new Date(lastDate);
        if (paymentFrequency === 'weekly') {
            nextDate.setDate(nextDate.getDate() + 7);
        } else {
            nextDate.setMonth(nextDate.getMonth() + 1);
        }
        nextDueDate = nextDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        nextDate.setHours(0, 0, 0, 0);
        daysUntilDue = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
        
        // Generate reminder script if 1 day away or overdue
        const amountDue = paymentFrequency === 'weekly' ? weeklyPrice : monthlyPrice;
        if (renterName && daysUntilDue <= 1) {
            if (daysUntilDue === 1) {
                reminderScript = `Hey ${renterName}! 👋 Just a friendly reminder that your ${paymentFrequency} rent payment of $${amountDue.toLocaleString()} is due tomorrow (${nextDueDate}). Let me know if you have any questions!`;
            } else if (daysUntilDue === 0) {
                reminderScript = `Hey ${renterName}! 👋 Just a friendly reminder that your ${paymentFrequency} rent payment of $${amountDue.toLocaleString()} is due today (${nextDueDate}). Let me know if you have any questions!`;
            } else {
                const daysOverdue = Math.abs(daysUntilDue);
                reminderScript = `Hey ${renterName}, your ${paymentFrequency} rent payment of $${amountDue.toLocaleString()} was due on ${nextDueDate} (${daysOverdue} day${daysOverdue > 1 ? 's' : ''} ago). Please make your payment as soon as possible. Let me know if you need to discuss anything!`;
            }
        }
    }
    
    const showReminderSection = renterName && (daysUntilDue !== null && daysUntilDue <= 1);
    
    $('propertyStatsContent').innerHTML = `
        <div class="glass-effect rounded-2xl shadow-2xl overflow-hidden mb-8">
            <!-- View Toggle Tabs -->
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
            </div>
            
            <div class="p-6 md:p-8">
                <div class="flex flex-wrap justify-between items-start gap-4 mb-6">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-2xl">✨</span>
                            <h2 id="editable-title-${id}" 
                                class="text-3xl md:text-4xl font-black text-white cursor-pointer hover:text-purple-300 transition inline-block"
                                onclick="startEditField('title', ${id}, this)"
                                title="Click to edit address">
                                ${sanitize(PropertyDataService.getValue(id, 'title', p.title))}
                            </h2>
                            <span class="text-purple-400 text-sm">✏️</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span>📍</span>
                            <span class="text-lg text-gray-300 font-semibold">Location:</span>
                            <span id="editable-location-${id}" 
                                  class="text-lg text-gray-300 font-semibold cursor-pointer hover:text-purple-300 transition"
                                  onclick="startEditField('location', ${id}, this)"
                                  title="Click to edit location">
                                ${sanitize(PropertyDataService.getValue(id, 'location', p.location))}
                            </span>
                            <span class="text-purple-400 text-sm">✏️</span>
                        </div>
                    </div>
                    <div class="flex flex-col items-end gap-2">
                        <span class="badge text-white text-sm font-bold px-4 py-2 rounded-full uppercase">${p.type}</span>
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
                        <div class="text-2xl mb-2">Bed</div>
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
                        <div class="text-2xl mb-2">Bath</div>
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
                        <div class="text-2xl mb-2">Box</div>
                        <div id="value-storage-${id}" class="text-xl font-bold text-white">${storage.toLocaleString()}</div>
                        <div class="text-sm text-amber-200">Storage</div>
                        <div class="text-xs text-amber-300 mt-1 opacity-70">Click to edit</div>
                    </div>
                    
                    <!-- Interior Type Tile -->
                    <div id="tile-interiorType-${id}" 
                         class="stat-tile text-center p-4 bg-gradient-to-br from-rose-600 to-rose-800 rounded-xl border border-rose-500 cursor-pointer"
                         onclick="startEditTile('interiorType', ${id}, 'select')"
                         data-field="interiorType"
                         data-original-value="${interiorType}">
                        <div class="text-2xl mb-2">Home</div>
                        <div id="value-interiorType-${id}" class="text-xl font-bold text-white">${interiorType}</div>
                        <div class="text-sm text-rose-200">Interior</div>
                        <div class="text-xs text-rose-300 mt-1 opacity-70">Click to edit</div>
                    </div>
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
                        <div class="flex items-center gap-3 mb-2">
                            <svg class="w-6 h-6 text-sky-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                            <span class="text-sky-200 font-semibold">Renter Name</span>
                        </div>
                        <div id="value-renterName-${id}" class="text-lg font-bold text-white">${renterName || '<span class="text-sky-300 opacity-70">Not set</span>'}</div>
                        <div class="text-xs text-sky-300 mt-2 opacity-70">Click to edit</div>
                    </div>
                    
                    <!-- Renter Phone -->
                    <div class="stat-tile p-4 bg-gradient-to-br from-pink-600 to-pink-800 rounded-xl border border-pink-500">
                        <div class="flex items-center justify-between mb-2">
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
                        <div class="flex items-center gap-3 mb-2">
                            <svg class="w-6 h-6 text-violet-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            <span class="text-violet-200 font-semibold">Notes</span>
                        </div>
                        <div id="value-renterNotes-${id}" class="text-sm font-medium text-white" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${renterNotes || '<span class="text-violet-300 opacity-70">Add notes...</span>'}</div>
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
                        <div id="value-paymentFrequency-${id}" class="text-lg font-bold text-white capitalize">${paymentFrequency}</div>
                        <div class="text-xs text-teal-300 mt-2 opacity-70">Click to edit</div>
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
                        <div id="value-lastPaymentDate-${id}" class="text-lg font-bold text-white">${lastPaymentDate ? new Date(lastPaymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '<span class="text-lime-300 opacity-70">Not set</span>'}</div>
                        <div class="text-xs text-lime-300 mt-2 opacity-70">Click to edit</div>
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
        
        <!-- EDITABLE Income Stats -->
        <h3 class="text-xl font-bold text-gray-200 mb-4">Pricing & Status <span class="text-sm text-purple-400">(Click to edit)</span></h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Weekly Rate Tile -->
            <div id="tile-weeklyPrice-${id}" 
                 class="stat-tile bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-xl p-6 text-white border border-blue-500 cursor-pointer"
                 onclick="startEditTile('weeklyPrice', ${id}, 'number')"
                 data-field="weeklyPrice"
                 data-original-value="${weeklyPrice}">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-sm font-bold opacity-90">Weekly Rate</h3>
                    <svg class="w-6 h-6 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div id="value-weeklyPrice-${id}" class="text-3xl font-black">${weeklyPrice.toLocaleString()}</div>
                <div class="text-xs text-blue-200 mt-2 opacity-70">Click to edit</div>
            </div>
            
            <!-- Monthly Rate Tile -->
            <div id="tile-monthlyPrice-${id}" 
                 class="stat-tile bg-gradient-to-br from-green-600 to-emerald-800 rounded-2xl shadow-xl p-6 text-white border border-green-500 cursor-pointer"
                 onclick="startEditTile('monthlyPrice', ${id}, 'number')"
                 data-field="monthlyPrice"
                 data-original-value="${monthlyPrice}">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-sm font-bold opacity-90">Monthly Rate</h3>
                    <svg class="w-6 h-6 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                </div>
                <div id="value-monthlyPrice-${id}" class="text-3xl font-black">${monthlyPrice.toLocaleString()}</div>
                <div class="text-xs text-green-200 mt-2 opacity-70">Click to edit</div>
            </div>
            
            <!-- Status Tile (toggles availability) -->
            <div id="tile-status-${id}" 
                 class="stat-tile bg-gradient-to-br ${isAvailable ? 'from-emerald-600 to-teal-800 border-emerald-500' : 'from-red-600 to-pink-800 border-red-500'} rounded-2xl shadow-xl p-6 text-white border cursor-pointer"
                 onclick="togglePropertyStatus(${id})">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-sm font-bold opacity-90">Status</h3>
                    <svg class="w-6 h-6 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div class="text-2xl font-black">${statusText}</div>
                <div class="text-sm opacity-80 mt-1">${isAvailable ? 'Accepting inquiries' : 'Currently rented'}</div>
                <div class="text-xs mt-2 opacity-70">Click to toggle</div>
            </div>
            
            <!-- Reviews Tile (read-only) -->
            <div class="bg-gradient-to-br from-amber-600 to-orange-800 rounded-2xl shadow-xl p-6 text-white border border-amber-500">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-sm font-bold opacity-90">Reviews</h3>
                    <svg class="w-6 h-6 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
                </div>
                <div class="text-2xl font-black">${avgRating} Star</div>
                <div class="text-sm opacity-80 mt-1">${propertyReviews.length} review${propertyReviews.length !== 1 ? 's' : ''}</div>
            </div>
        </div>
        
        <!-- Actions -->
        <div class="glass-effect rounded-2xl shadow-2xl p-6 md:p-8 mb-8">
            <h3 class="text-2xl font-bold text-gray-200 mb-6">⚡ Quick Actions</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onclick="toggleAvailability(${id}); setTimeout(() => renderPropertyStatsContent(${id}), 100);" class="flex items-center justify-center space-x-3 ${isAvailable ? 'bg-gradient-to-r from-red-500 to-pink-600' : 'bg-gradient-to-r from-green-500 to-emerald-600'} text-white px-6 py-4 rounded-xl font-bold hover:opacity-90 transition shadow-lg">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                    <span>${isAvailable ? 'Mark as Rented' : 'Mark as Available'}</span>
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
        
        <!-- Reviews Section -->
        <div class="glass-effect rounded-2xl shadow-2xl p-6 md:p-8">
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
                <option value="weekly" ${currentValue === 'weekly' ? 'selected' : ''}>Weekly</option>
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
        const phoneHandler = type === 'tel' ? 'oninput="this.value = this.value.replace(/\\D/g, \'\')"' : '';
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
    
    const originalValue = tile.dataset.originalValue;
    
    // Optimistic UI update
    tile.classList.remove('editing');
    tile.classList.add('saving');
    
    let displayValue;
    if (type === 'number') {
        displayValue = field === 'weeklyPrice' || field === 'monthlyPrice' ? `${newValue.toLocaleString()}` : newValue.toLocaleString();
    } else if ((field === 'ownerName' || field === 'ownerPhone' || field === 'renterName' || field === 'renterPhone') && !newValue) {
        displayValue = '<span class="opacity-70">Not set</span>';
    } else if (field === 'renterNotes' && !newValue) {
        displayValue = '<span class="opacity-70">Add notes...</span>';
    } else if (field === 'renterNotes' && newValue) {
        // Show full text - CSS line-clamp will handle overflow
        displayValue = newValue;
    } else if (type === 'date' && newValue) {
        displayValue = new Date(newValue).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } else if (type === 'frequency') {
        displayValue = newValue.charAt(0).toUpperCase() + newValue.slice(1);
    } else {
        displayValue = newValue || '<span class="opacity-70">Not set</span>';
    }
    valueEl.innerHTML = `<span class="opacity-70">${displayValue}</span><div class="text-xs mt-1">Saving...</div>`;
    
    try {
        // CRITICAL: Write to Firestore (includes fresh read before write)
        await PropertyDataService.write(propertyId, field, newValue);
        
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
        }, 1000);
        
        // Also refresh properties grid and dashboard if they're using this data
        renderProperties(state.filteredProperties);
        if (state.currentUser === 'owner') renderOwnerDashboard();
        
    } catch (error) {
        console.error('Save failed, rolling back:', error);
        
        // Rollback on failure
        tile.classList.remove('saving');
        tile.classList.add('error');
        
        const rollbackValue = type === 'number'
            ? (field === 'weeklyPrice' || field === 'monthlyPrice' ? `${parseInt(originalValue).toLocaleString()}` : parseInt(originalValue).toLocaleString())
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
 * Toggle property status (available/rented)
 */
window.togglePropertyStatus = async function(propertyId) {
    await toggleAvailability(propertyId);
    setTimeout(() => renderPropertyStatsContent(propertyId), 100);
};

// ==================== EVENT LISTENERS ====================
// Firebase login form
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = $('firebaseLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = $('ownerEmail').value;
            const password = $('ownerPassword').value;
            const btn = $('loginSubmitBtn');
            const errorDiv = $('loginError');
            
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
                        'auth/user-not-found': 'No account found with this email.',
                        'auth/wrong-password': 'Incorrect password. Please try again.',
                        'auth/invalid-credential': 'Invalid email or password.',
                        'auth/too-many-requests': 'Too many failed attempts. Please try again later.'
                    };
                    errorDiv.textContent = messages[error.code] || 'Invalid email or password. Please try again.';
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
            console.log('[Auth] User session restored:', user.email);
            state.currentUser = 'owner';
            updateAuthButton(true);
            renderOwnerDashboard();
            loadUsername();
        } else {
            // No user signed in
            console.log('[Auth] No active session');
            state.currentUser = null;
            updateAuthButton(false);
        }
    });
    
    renderProperties(properties);
}

// Start the app
init();
