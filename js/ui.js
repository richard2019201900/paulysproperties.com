// ==================== NAVIGATION ====================
function updateAuthButton(isLoggedIn) {
    const navBtn = $('navAuthBtn');
    const mobileBtn = $('mobileAuthBtn');
    const navCreateBtn = $('navCreateListingBtn');
    const mobileCreateBtn = $('mobileCreateListingBtn');
    
    if (isLoggedIn) {
        navBtn.textContent = 'Logout';
        navBtn.className = 'hidden md:block bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-3 rounded-xl hover:opacity-90 transition font-semibold shadow-lg';
        mobileBtn.textContent = 'Logout';
        mobileBtn.className = 'block w-full text-left px-4 py-3 text-red-400 hover:bg-gray-800 font-semibold';
        showElement($('navDashboardLink'));
        showElement($('mobileDashboardLink'));
        // Show Create Listing buttons
        if (navCreateBtn) navCreateBtn.className = 'hidden md:block bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 px-5 py-2.5 rounded-xl hover:opacity-90 transition font-bold shadow-lg';
        if (mobileCreateBtn) showElement(mobileCreateBtn);
    } else {
        navBtn.textContent = 'Register / Sign In';
        navBtn.className = 'hidden md:block gradient-bg text-white px-6 py-3 rounded-xl hover:opacity-90 transition font-semibold shadow-lg';
        mobileBtn.textContent = 'Register / Sign In';
        mobileBtn.className = 'block w-full text-left px-4 py-3 text-purple-400 hover:bg-gray-800 font-semibold';
        hideElement($('navDashboardLink'));
        hideElement($('mobileDashboardLink'));
        // Hide Create Listing buttons
        if (navCreateBtn) hideElement(navCreateBtn);
        if (mobileCreateBtn) hideElement(mobileCreateBtn);
    }
}

window.handleAuthClick = function() {
    hideElement($('mobileMenu'));
    state.currentUser === 'owner' ? logout() : openModal('loginModal');
};

window.goToDashboard = function() {
    hideElement($('mobileMenu'));
    if (state.currentUser === 'owner') {
        hideElement($('renterSection'));
        hideElement($('propertyDetailPage'));
        hideElement($('propertyStatsPage'));
        showElement($('ownerDashboard'));
        renderOwnerDashboard();
        window.scrollTo(0, 0);
    }
};

window.backToDashboard = function() {
    hideElement($('propertyStatsPage'));
    showElement($('ownerDashboard'));
    window.scrollTo(0, 0);
};

window.goHome = function() {
    hideElement($('ownerDashboard'));
    hideElement($('propertyDetailPage'));
    hideElement($('propertyStatsPage'));
    showElement($('renterSection'));
    window.scrollTo(0, 0);
};

window.navigateTo = function(section) {
    hideElement($('mobileMenu'));
    hideElement($('ownerDashboard'));
    hideElement($('propertyDetailPage'));
    hideElement($('propertyStatsPage'));
    showElement($('renterSection'));
    setTimeout(() => $(section)?.scrollIntoView({ behavior: 'smooth' }), 100);
};

window.goBack = function() {
    hideElement($('propertyDetailPage'));
    showElement($('renterSection'));
    $('properties').scrollIntoView({ behavior: 'smooth' });
};

// ==================== USERNAME FUNCTIONS ====================
async function loadUsername() {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        const doc = await db.collection('users').doc(user.uid).get();
        if (doc.exists && doc.data().username) {
            $('ownerUsername').value = doc.data().username;
        }
    } catch (error) {
        console.error('Error loading username:', error);
    }
}

window.saveUsername = async function() {
    const user = auth.currentUser;
    if (!user) return;
    
    const username = $('ownerUsername').value.trim();
    const btn = $('saveUsernameBtn');
    const status = $('usernameStatus');
    
    if (!username) {
        status.textContent = 'Please enter a display name';
        status.className = 'text-yellow-400 text-sm mt-3';
        showElement(status);
        return;
    }
    
    btn.disabled = true;
    btn.textContent = 'Saving...';
    
    try {
        await db.collection('users').doc(user.uid).set({
            username: username,
            email: user.email,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        status.textContent = 'Display name saved successfully!';
        status.className = 'text-green-400 text-sm mt-3';
        showElement(status);
        
        setTimeout(() => hideElement(status), 3000);
    } catch (error) {
        console.error('Error saving username:', error);
        status.textContent = 'Error saving display name. Please try again.';
        status.className = 'text-red-400 text-sm mt-3';
        showElement(status);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save Name';
    }
};

// ==================== AUTH FUNCTIONS ====================
window.showOwnerLoginForm = function() {
    hideElement($('loginOptions'));
    showElement($('ownerLoginForm'));
    hideElement($('loginError'));
};

window.hideOwnerLoginForm = function() {
    showElement($('loginOptions'));
    hideElement($('ownerLoginForm'));
};

window.loginAsRenter = function() {
    state.currentUser = 'renter';
    closeModal('loginModal');
    window.goHome();
};

window.logout = function() {
    state.currentUser = null;
    updateAuthButton(false);
    // Clear username field and status
    $('ownerUsername').value = '';
    hideElement($('usernameStatus'));
    auth.signOut().then(() => window.goHome()).catch(() => window.goHome());
};

// ==================== CALCULATIONS ====================
function getAvailableCount() {
    const ownerProps = getOwnerProperties();
    return ownerProps.filter(p => state.availability[p.id] !== false).length;
}

function calculateTotals() {
    const ownerProps = getOwnerProperties();
    return ownerProps.reduce((acc, p) => {
        if (state.availability[p.id] === false) {
            acc.weekly += PropertyDataService.getValue(p.id, 'weeklyPrice', p.weeklyPrice);
            acc.monthly += PropertyDataService.getValue(p.id, 'monthlyPrice', p.monthlyPrice);
        }
        return acc;
    }, { weekly: 0, monthly: 0 });
}

// ==================== RENDER FUNCTIONS ====================
function renderOwnerDashboard() {
    const ownerProps = getOwnerProperties();
    const totals = calculateTotals();
    $('weeklyIncomeDisplay').textContent = formatPrice(totals.weekly);
    $('monthlyIncomeDisplay').textContent = formatPrice(totals.monthly);
    $('unitsAvailableDisplay').textContent = `${getAvailableCount()}/${ownerProps.length}`;
    
    if (ownerProps.length === 0) {
        $('ownerPropertiesTable').innerHTML = `
            <tr>
                <td colspan="9" class="px-6 py-12 text-center text-gray-400">
                    <div class="text-4xl mb-4">🏠</div>
                    <p class="text-xl font-semibold">No properties assigned to this account</p>
                    <p class="text-sm mt-2">Contact the administrator to get properties assigned to your account.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    $('ownerPropertiesTable').innerHTML = ownerProps.map(p => `
        <tr class="border-b border-gray-700 hover:bg-gray-700 transition">
            <td class="px-4 md:px-6 py-4"><div class="toggle-switch ${state.availability[p.id] !== false ? 'active' : ''}" onclick="toggleAvailability(${p.id})" role="switch" aria-checked="${state.availability[p.id] !== false}" tabindex="0"></div></td>
            <td class="px-4 md:px-6 py-4">
                <span class="property-name-link font-bold text-gray-200" onclick="viewPropertyStats(${p.id})" role="button" tabindex="0" title="Click to view property stats">${sanitize(p.title)}</span>
            </td>
            <td class="px-4 md:px-6 py-4 text-gray-300 capitalize hidden md:table-cell">${p.type}</td>
            <td class="px-4 md:px-6 py-4 text-gray-300 hidden lg:table-cell editable-cell" onclick="startCellEdit(${p.id}, 'bedrooms', this, 'number')" title="Click to edit">
                <span class="cell-value">${PropertyDataService.getValue(p.id, 'bedrooms', p.bedrooms)}</span>
            </td>
            <td class="px-4 md:px-6 py-4 text-gray-300 hidden lg:table-cell editable-cell" onclick="startCellEdit(${p.id}, 'bathrooms', this, 'number')" title="Click to edit">
                <span class="cell-value">${PropertyDataService.getValue(p.id, 'bathrooms', p.bathrooms)}</span>
            </td>
            <td class="px-4 md:px-6 py-4 text-gray-300 hidden lg:table-cell editable-cell" onclick="startCellEdit(${p.id}, 'interiorType', this, 'select')" title="Click to edit">
                <span class="cell-value">${PropertyDataService.getValue(p.id, 'interiorType', p.interiorType)}</span>
            </td>
            <td class="px-4 md:px-6 py-4 text-gray-300 hidden lg:table-cell editable-cell" onclick="startCellEdit(${p.id}, 'storage', this, 'number')" title="Click to edit">
                <span class="cell-value">${PropertyDataService.getValue(p.id, 'storage', p.storage).toLocaleString()}</span>
            </td>
            <td class="px-4 md:px-6 py-4 text-green-400 font-bold editable-cell" onclick="startCellEdit(${p.id}, 'weeklyPrice', this, 'number')" title="Click to edit">
                <span class="cell-value">${PropertyDataService.getValue(p.id, 'weeklyPrice', p.weeklyPrice).toLocaleString()}</span>
            </td>
            <td class="px-4 md:px-6 py-4 text-purple-400 font-bold editable-cell" onclick="startCellEdit(${p.id}, 'monthlyPrice', this, 'number')" title="Click to edit">
                <span class="cell-value">${PropertyDataService.getValue(p.id, 'monthlyPrice', p.monthlyPrice).toLocaleString()}</span>
            </td>
        </tr>
    `).join('');
}

// ==================== INLINE CELL EDITING ====================
window.startCellEdit = function(propertyId, field, cell, type) {
    // Don't start if already editing
    if (cell.querySelector('input, select')) return;
    
    const currentValue = PropertyDataService.getValue(propertyId, field, properties.find(p => p.id === propertyId)?.[field]);
    const originalHTML = cell.innerHTML;
    
    cell.dataset.originalHTML = originalHTML;
    cell.dataset.propertyId = propertyId;
    cell.dataset.field = field;
    
    if (type === 'select' && field === 'interiorType') {
        cell.innerHTML = `
            <select class="cell-input bg-gray-800 border border-purple-500 rounded px-2 py-1 text-white text-sm w-full" 
                    onchange="saveCellEdit(this, ${propertyId}, '${field}')"
                    onblur="setTimeout(() => cancelCellEdit(this), 150)">
                <option value="Instance" ${currentValue === 'Instance' ? 'selected' : ''}>Instance</option>
                <option value="Walk-in" ${currentValue === 'Walk-in' ? 'selected' : ''}>Walk-in</option>
            </select>
        `;
    } else {
        cell.innerHTML = `
            <input type="number" 
                   class="cell-input bg-gray-800 border border-purple-500 rounded px-2 py-1 text-white text-sm w-20" 
                   value="${currentValue}"
                   onkeydown="handleCellKeydown(event, this, ${propertyId}, '${field}')"
                   onblur="saveCellEdit(this, ${propertyId}, '${field}')">
        `;
    }
    
    const input = cell.querySelector('input, select');
    input.focus();
    if (input.select) input.select();
};

window.handleCellKeydown = function(event, input, propertyId, field) {
    if (event.key === 'Enter') {
        event.preventDefault();
        saveCellEdit(input, propertyId, field);
    } else if (event.key === 'Escape') {
        cancelCellEdit(input);
    }
};

window.saveCellEdit = async function(input, propertyId, field) {
    const cell = input.closest('td');
    const newValue = field === 'interiorType' ? input.value : parseInt(input.value);
    const originalHTML = cell.dataset.originalHTML;
    
    if (!newValue && newValue !== 0) {
        cell.innerHTML = originalHTML;
        return;
    }
    
    // Show saving state
    cell.innerHTML = `<span class="text-gray-500">Saving...</span>`;
    
    try {
        await PropertyDataService.write(propertyId, field, newValue);
        
        // Re-render dashboard to show updated values
        renderOwnerDashboard();
        renderProperties(state.filteredProperties);
        
    } catch (error) {
        console.error('Save failed:', error);
        cell.innerHTML = originalHTML;
        alert('Failed to save. Please try again.');
    }
};

window.cancelCellEdit = function(input) {
    if (!input) return;
    const cell = input.closest('td');
    if (cell && cell.dataset.originalHTML) {
        cell.innerHTML = cell.dataset.originalHTML;
    }
};

async function renderProperties(list) {
    // Update property count
    $('propertyCount').textContent = `(${list.length})`;
    
    // First render with placeholder owner
    $('propertiesGrid').innerHTML = list.map(p => {
        const available = state.availability[p.id] !== false;
        return `
        <article class="property-card bg-gray-800 rounded-2xl shadow-xl overflow-hidden cursor-pointer border border-gray-700" onclick="viewProperty(${p.id})">
            <div class="relative">
                ${!available ? '<div class="unavailable-overlay"><div class="unavailable-text">UNAVAILABLE</div></div>' : ''}
                <img src="${p.images[0]}" alt="${sanitize(p.title)}" class="w-full h-64 md:h-72 object-cover" loading="lazy">
                ${p.videoUrl ? '<div class="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-pink-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full font-bold text-xs md:text-sm shadow-lg flex items-center space-x-1 md:space-x-2"><svg class="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"></path></svg><span>Video Tour</span></div>' : ''}
            </div>
            <div class="p-5 md:p-6">
                <div class="flex justify-between items-start gap-2 mb-3">
                    <h4 class="text-xl md:text-2xl font-bold text-white min-h-[3.5rem] md:min-h-[4rem] line-clamp-2">${sanitize(p.title)}</h4>
                    <span class="badge text-white text-xs font-bold px-2 md:px-3 py-1 rounded-full uppercase shrink-0">${p.type}</span>
                </div>
                <p class="text-gray-300 mb-2 font-medium text-sm md:text-base">Location: ${sanitize(p.location)}</p>
                <p class="text-xs md:text-sm text-gray-400 mb-2 font-semibold">Interior: ${PropertyDataService.getValue(p.id, 'interiorType', p.interiorType)}</p>
                <p id="owner-${p.id}" class="text-xs md:text-sm text-blue-400 mb-4 font-semibold">Owner: Loading...</p>
                <div class="grid grid-cols-3 gap-2 mb-4 text-xs md:text-sm text-gray-300 font-semibold">
                    <div>${PropertyDataService.getValue(p.id, 'bedrooms', p.bedrooms)} Beds</div>
                    <div>${PropertyDataService.getValue(p.id, 'bathrooms', p.bathrooms)} Baths</div>
                    <div>${PropertyDataService.getValue(p.id, 'storage', p.storage).toLocaleString()}</div>
                </div>
                <div class="mb-4">
                    <div class="text-gray-400 font-semibold text-sm"><span class="font-bold text-gray-300">Weekly:</span> ${PropertyDataService.getValue(p.id, 'weeklyPrice', p.weeklyPrice).toLocaleString()}</div>
                    <div class="text-purple-400 font-black text-xl md:text-2xl mt-1">${PropertyDataService.getValue(p.id, 'monthlyPrice', p.monthlyPrice).toLocaleString()}<span class="text-xs md:text-sm font-semibold text-gray-400">/month</span></div>
                </div>
                <button onclick="viewProperty(${p.id})" class="w-full gradient-bg text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold hover:opacity-90 transition shadow-lg mb-2 text-sm md:text-base">View Details</button>
                <button onclick="event.stopPropagation(); openContactModal('offer', '${sanitize(p.title)}')" class="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold hover:opacity-90 transition shadow-lg text-sm md:text-base">Make an Offer</button>
            </div>
        </article>`;
    }).join('');
    
    // Then fetch and update owner names asynchronously
    for (const p of list) {
        const username = await getPropertyOwnerUsername(p.id);
        const ownerEl = $(`owner-${p.id}`);
        if (ownerEl) {
            ownerEl.textContent = `Owner: ${username}`;
        }
    }
}

// ==================== CREATE LISTING ====================
window.openCreateListingModal = function() {
    hideElement($('mobileMenu'));
    // Reset form
    const form = $('createListingForm');
    if (form) form.reset();
    hideElement($('createListingError'));
    hideElement($('createListingSuccess'));
    openModal('createListingModal');
};

// Handle create listing form submission
document.addEventListener('DOMContentLoaded', function() {
    const createForm = $('createListingForm');
    if (createForm) {
        createForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const errorDiv = $('createListingError');
            const successDiv = $('createListingSuccess');
            const btn = $('createListingBtn');
            
            hideElement(errorDiv);
            hideElement(successDiv);
            
            // Get form values
            const title = $('newListingTitle').value.trim();
            const type = $('newListingType').value;
            const location = $('newListingLocation').value.trim();
            const bedrooms = parseInt($('newListingBedrooms').value);
            const bathrooms = parseInt($('newListingBathrooms').value);
            const storage = parseInt($('newListingStorage').value) || 600;
            const interiorType = $('newListingInterior').value;
            const weeklyPrice = parseInt($('newListingWeekly').value);
            const monthlyPrice = parseInt($('newListingMonthly').value);
            const imagesText = $('newListingImages').value.trim();
            
            // Parse images
            const images = imagesText 
                ? imagesText.split('\n').map(url => url.trim()).filter(url => url)
                : ['images/placeholder.jpg'];
            
            // Validate
            if (!title || !type || !location || !bedrooms || !bathrooms || !weeklyPrice || !monthlyPrice) {
                errorDiv.textContent = 'Please fill in all required fields.';
                showElement(errorDiv);
                return;
            }
            
            btn.disabled = true;
            btn.textContent = 'Creating...';
            
            try {
                // Generate new ID (find max ID + 1)
                const maxId = properties.reduce((max, p) => Math.max(max, p.id), 0);
                const newId = maxId + 1;
                
                // Create new property object
                const newProperty = {
                    id: newId,
                    title: title,
                    type: type,
                    location: location,
                    bedrooms: bedrooms,
                    bathrooms: bathrooms,
                    storage: storage,
                    interiorType: interiorType,
                    weeklyPrice: weeklyPrice,
                    monthlyPrice: monthlyPrice,
                    images: images,
                    videoUrl: null,
                    features: false
                };
                
                // Add to local properties array
                properties.push(newProperty);
                
                // Add to owner map
                const ownerEmail = auth.currentUser?.email || 'richard2019201900@gmail.com';
                if (!ownerPropertyMap[ownerEmail]) {
                    ownerPropertyMap[ownerEmail] = [];
                }
                ownerPropertyMap[ownerEmail].push(newId);
                propertyOwnerEmail[newId] = ownerEmail;
                
                // Set availability to true
                state.availability[newId] = true;
                await db.collection('settings').doc('propertyAvailability').set({ [newId]: true }, { merge: true });
                
                // Save property to Firestore
                await db.collection('settings').doc('properties').set({
                    [newId]: newProperty
                }, { merge: true });
                
                // Update filtered properties
                state.filteredProperties = [...properties];
                
                // Re-render
                renderProperties(state.filteredProperties);
                renderOwnerDashboard();
                
                successDiv.textContent = '✓ Listing created successfully!';
                showElement(successDiv);
                
                // Close modal after delay
                setTimeout(() => {
                    closeModal('createListingModal');
                    goToDashboard();
                }, 1500);
                
            } catch (error) {
                console.error('Error creating listing:', error);
                errorDiv.textContent = 'Failed to create listing. Please try again.';
                showElement(errorDiv);
            } finally {
                btn.disabled = false;
                btn.textContent = '🏠 Create Listing';
            }
        });
    }
});
