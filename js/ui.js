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
        if (mobileCreateBtn) mobileCreateBtn.className = 'block px-4 py-3 text-amber-400 hover:bg-gray-800 cursor-pointer font-semibold';
    } else {
        navBtn.textContent = 'Register / Sign In';
        navBtn.className = 'hidden md:block gradient-bg text-white px-6 py-3 rounded-xl hover:opacity-90 transition font-semibold shadow-lg';
        mobileBtn.textContent = 'Register / Sign In';
        mobileBtn.className = 'block w-full text-left px-4 py-3 text-purple-400 hover:bg-gray-800 font-semibold';
        hideElement($('navDashboardLink'));
        hideElement($('mobileDashboardLink'));
        // Hide Create Listing buttons completely (set className to hidden only, no md:block)
        if (navCreateBtn) navCreateBtn.className = 'hidden';
        if (mobileCreateBtn) mobileCreateBtn.className = 'hidden';
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
window.loadUsername = async function() {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        const doc = await db.collection('users').doc(user.uid).get();
        if (doc.exists) {
            if (doc.data().username) {
                $('ownerUsername').value = doc.data().username;
                // Pre-populate cache for this user
                window.ownerUsernameCache = window.ownerUsernameCache || {};
                window.ownerUsernameCache[user.email.toLowerCase()] = doc.data().username;
            }
            if (doc.data().phone) {
                // Sanitize phone - remove all non-digits
                $('ownerPhone').value = doc.data().phone.replace(/\D/g, '');
            }
        }
    } catch (error) {
        console.error('Error loading user settings:', error);
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

window.saveOwnerPhone = async function() {
    const user = auth.currentUser;
    if (!user) return;
    
    // Remove all non-digit characters from phone
    const phone = $('ownerPhone').value.replace(/\D/g, '');
    $('ownerPhone').value = phone; // Update the field to show cleaned number
    
    const btn = $('savePhoneBtn');
    const status = $('phoneStatus');
    
    if (!phone) {
        status.textContent = 'Please enter a phone number';
        status.className = 'text-yellow-400 text-sm mt-3';
        showElement(status);
        return;
    }
    
    btn.disabled = true;
    btn.textContent = 'Saving...';
    
    try {
        await db.collection('users').doc(user.uid).set({
            phone: phone,
            email: user.email,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        status.textContent = 'Phone number saved successfully!';
        status.className = 'text-green-400 text-sm mt-3';
        showElement(status);
        
        setTimeout(() => hideElement(status), 3000);
    } catch (error) {
        console.error('Error saving phone:', error);
        status.textContent = 'Error saving phone number. Please try again.';
        status.className = 'text-red-400 text-sm mt-3';
        showElement(status);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save Phone';
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
    const details = {
        weeklyPayers: [],   // Properties where renter pays weekly
        monthlyPayers: [],  // Properties where renter pays monthly
        available: []       // Available properties
    };
    
    let weeklyIncome = 0;
    let monthlyIncome = 0;
    
    ownerProps.forEach(p => {
        const weeklyPrice = PropertyDataService.getValue(p.id, 'weeklyPrice', p.weeklyPrice);
        const monthlyPrice = PropertyDataService.getValue(p.id, 'monthlyPrice', p.monthlyPrice);
        const paymentFrequency = PropertyDataService.getValue(p.id, 'paymentFrequency', p.paymentFrequency || 'weekly');
        const renterName = PropertyDataService.getValue(p.id, 'renterName', p.renterName || '');
        const isRented = state.availability[p.id] === false;
        
        const propInfo = {
            id: p.id,
            title: p.title,
            weeklyPrice,
            monthlyPrice,
            renterName,
            paymentFrequency
        };
        
        if (isRented) {
            if (paymentFrequency === 'monthly') {
                // Monthly payer contributes monthly rate
                monthlyIncome += monthlyPrice;
                // Weekly equivalent: monthly / 4
                weeklyIncome += Math.round(monthlyPrice / 4);
                details.monthlyPayers.push(propInfo);
            } else {
                // Weekly payer contributes weekly rate
                weeklyIncome += weeklyPrice;
                // Monthly equivalent: weekly * 4
                monthlyIncome += Math.round(weeklyPrice * 4);
                details.weeklyPayers.push(propInfo);
            }
        } else {
            details.available.push(propInfo);
        }
    });
    
    // Store details globally for the flip cards
    window.incomeDetails = details;
    
    return { weekly: weeklyIncome, monthly: monthlyIncome, details };
}

// Flip card toggle
window.flipCard = function(card) {
    card.classList.toggle('flipped');
};

// Update breakdown panels
function updateIncomeBreakdowns(details) {
    const weeklyEl = $('weeklyBreakdown');
    const monthlyEl = $('monthlyBreakdown');
    const unitsEl = $('unitsBreakdown');
    
    if (!weeklyEl || !monthlyEl || !unitsEl) return;
    
    // Weekly breakdown - shows what contributes to weekly total
    let weeklyHTML = '';
    let weeklyNum = 1;
    if (details.weeklyPayers.length > 0) {
        weeklyHTML += '<div class="font-bold text-blue-300 mb-1">Weekly Payers:</div>';
        details.weeklyPayers.forEach(p => {
            weeklyHTML += `<div class="flex justify-between py-0.5 border-b border-blue-700/30">
                <span class="truncate mr-2"><span class="text-blue-400 mr-1">${weeklyNum}.</span>${p.title}</span>
                <span class="text-green-300 font-bold">$${p.weeklyPrice.toLocaleString()}</span>
            </div>`;
            weeklyNum++;
        });
    }
    if (details.monthlyPayers.length > 0) {
        weeklyHTML += '<div class="font-bold text-blue-300 mt-2 mb-1">Monthly Payers (÷4):</div>';
        details.monthlyPayers.forEach(p => {
            const weeklyEquiv = Math.round(p.monthlyPrice / 4);
            weeklyHTML += `<div class="flex justify-between py-0.5 border-b border-blue-700/30">
                <span class="truncate mr-2"><span class="text-blue-400 mr-1">${weeklyNum}.</span>${p.title}</span>
                <span class="text-yellow-300">~$${weeklyEquiv.toLocaleString()}</span>
            </div>`;
            weeklyNum++;
        });
    }
    if (!weeklyHTML) weeklyHTML = '<div class="opacity-70">No rented properties</div>';
    weeklyEl.innerHTML = weeklyHTML;
    
    // Monthly breakdown - shows what contributes to monthly total
    let monthlyHTML = '';
    let monthlyNum = 1;
    if (details.monthlyPayers.length > 0) {
        monthlyHTML += '<div class="font-bold text-green-300 mb-1">Monthly Payers:</div>';
        details.monthlyPayers.forEach(p => {
            monthlyHTML += `<div class="flex justify-between py-0.5 border-b border-green-700/30">
                <span class="truncate mr-2"><span class="text-green-400 mr-1">${monthlyNum}.</span>${p.title}</span>
                <span class="text-green-300 font-bold">$${p.monthlyPrice.toLocaleString()}</span>
            </div>`;
            monthlyNum++;
        });
    }
    if (details.weeklyPayers.length > 0) {
        monthlyHTML += '<div class="font-bold text-green-300 mt-2 mb-1">Weekly Payers (×4):</div>';
        details.weeklyPayers.forEach(p => {
            const monthlyEquiv = Math.round(p.weeklyPrice * 4);
            monthlyHTML += `<div class="flex justify-between py-0.5 border-b border-green-700/30">
                <span class="truncate mr-2"><span class="text-green-400 mr-1">${monthlyNum}.</span>${p.title}</span>
                <span class="text-yellow-300">~$${monthlyEquiv.toLocaleString()}</span>
            </div>`;
            monthlyNum++;
        });
    }
    if (!monthlyHTML) monthlyHTML = '<div class="opacity-70">No rented properties</div>';
    monthlyEl.innerHTML = monthlyHTML;
    
    // Units breakdown
    let unitsHTML = '';
    let unitsNum = 1;
    const rented = [...details.weeklyPayers, ...details.monthlyPayers];
    if (rented.length > 0) {
        unitsHTML += '<div class="font-bold text-red-300 mb-1">🔴 Rented:</div>';
        rented.forEach(p => {
            unitsHTML += `<div class="flex justify-between py-0.5 border-b border-purple-700/30">
                <span class="truncate mr-2"><span class="text-purple-400 mr-1">${unitsNum}.</span>${p.title}</span>
                <span class="text-sky-300">${p.renterName || 'Unknown'}</span>
            </div>`;
            unitsNum++;
        });
    }
    if (details.available.length > 0) {
        unitsHTML += '<div class="font-bold text-green-300 mt-2 mb-1">🟢 Available:</div>';
        details.available.forEach(p => {
            unitsHTML += `<div class="py-0.5 border-b border-purple-700/30 truncate"><span class="text-purple-400 mr-1">${unitsNum}.</span>${p.title}</div>`;
            unitsNum++;
        });
    }
    if (!unitsHTML) unitsHTML = '<div class="opacity-70">No properties</div>';
    unitsEl.innerHTML = unitsHTML;
}

// ==================== RENDER FUNCTIONS ====================
function renderOwnerDashboard() {
    const ownerProps = getOwnerProperties();
    const totals = calculateTotals();
    $('weeklyIncomeDisplay').textContent = formatPrice(totals.weekly);
    $('monthlyIncomeDisplay').textContent = formatPrice(totals.monthly);
    $('unitsAvailableDisplay').textContent = `${getAvailableCount()}/${ownerProps.length}`;
    
    // Populate breakdown panels
    updateIncomeBreakdowns(totals.details);
    
    if (ownerProps.length === 0) {
        $('ownerPropertiesTable').innerHTML = `
            <tr>
                <td colspan="11" class="px-6 py-12 text-center text-gray-400">
                    <div class="text-4xl mb-4">🏠</div>
                    <p class="text-xl font-semibold">No properties assigned to this account</p>
                    <p class="text-sm mt-2">Contact the administrator to get properties assigned to your account.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    $('ownerPropertiesTable').innerHTML = ownerProps.map((p, index) => {
        // Get renter and payment info
        const renterName = PropertyDataService.getValue(p.id, 'renterName', p.renterName || '');
        const paymentFrequency = PropertyDataService.getValue(p.id, 'paymentFrequency', p.paymentFrequency || 'weekly');
        const lastPaymentDate = PropertyDataService.getValue(p.id, 'lastPaymentDate', p.lastPaymentDate || '');
        const weeklyPrice = PropertyDataService.getValue(p.id, 'weeklyPrice', p.weeklyPrice);
        const monthlyPrice = PropertyDataService.getValue(p.id, 'monthlyPrice', p.monthlyPrice);
        
        // Calculate next due date
        let nextDueDate = '';
        let daysUntilDue = null;
        let reminderScript = '';
        let dueDateDisplay = '';
        let dueStatusClass = 'text-gray-400';
        
        if (lastPaymentDate) {
            const lastDate = parseLocalDate(lastPaymentDate);
            const nextDate = new Date(lastDate);
            if (paymentFrequency === 'weekly') {
                nextDate.setDate(nextDate.getDate() + 7);
            } else {
                nextDate.setMonth(nextDate.getMonth() + 1);
            }
            nextDueDate = nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            nextDate.setHours(0, 0, 0, 0);
            daysUntilDue = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntilDue < 0) {
                dueDateDisplay = `<span class="text-red-400 font-bold">${Math.abs(daysUntilDue)}d overdue</span>`;
                dueStatusClass = 'bg-red-900/30';
            } else if (daysUntilDue === 0) {
                dueDateDisplay = `<span class="text-red-400 font-bold">Due today</span>`;
                dueStatusClass = 'bg-red-900/30';
            } else if (daysUntilDue === 1) {
                dueDateDisplay = `<span class="text-orange-400 font-bold">Due tomorrow</span>`;
                dueStatusClass = 'bg-orange-900/30';
            } else if (daysUntilDue <= 3) {
                dueDateDisplay = `<span class="text-yellow-400">${daysUntilDue}d left</span>`;
                dueStatusClass = 'bg-yellow-900/20';
            } else {
                dueDateDisplay = `<span class="text-green-400">${daysUntilDue}d left</span>`;
            }
            
            // Generate reminder script
            const amountDue = paymentFrequency === 'weekly' ? weeklyPrice : monthlyPrice;
            if (renterName && daysUntilDue <= 1) {
                const fullNextDate = nextDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                if (daysUntilDue === 1) {
                    reminderScript = `Hey ${renterName}! 👋 Just a friendly reminder that your ${paymentFrequency} rent payment of $${amountDue.toLocaleString()} is due tomorrow (${fullNextDate}). Let me know if you have any questions!`;
                } else if (daysUntilDue === 0) {
                    reminderScript = `Hey ${renterName}! 👋 Just a friendly reminder that your ${paymentFrequency} rent payment of $${amountDue.toLocaleString()} is due today (${fullNextDate}). Let me know if you have any questions!`;
                } else {
                    const daysOverdue = Math.abs(daysUntilDue);
                    reminderScript = `Hey ${renterName}, your ${paymentFrequency} rent payment of $${amountDue.toLocaleString()} was due on ${fullNextDate} (${daysOverdue} day${daysOverdue > 1 ? 's' : ''} ago). Please make your payment as soon as possible. Let me know if you need to discuss anything!`;
                }
            }
        }
        
        const lastPaidDisplay = lastPaymentDate ? formatDate(lastPaymentDate, { month: 'short', day: 'numeric' }) : '-';
        const isRented = state.availability[p.id] === false;
        
        // Store reminder for this property
        if (reminderScript) {
            window.dashboardReminders = window.dashboardReminders || {};
            window.dashboardReminders[p.id] = reminderScript;
        }
        
        return `
        <tr class="border-b border-gray-700/50 hover:bg-gray-700/50 transition">
            <td class="px-2 md:px-3 py-3 text-center text-gray-500 font-medium" rowspan="${isRented ? '2' : '1'}">${index + 1}</td>
            <td class="px-4 md:px-6 py-3"><div class="toggle-switch ${state.availability[p.id] !== false ? 'active' : ''}" onclick="toggleAvailability(${p.id})" role="switch" aria-checked="${state.availability[p.id] !== false}" tabindex="0"></div></td>
            <td class="px-4 md:px-6 py-3">
                <span class="property-name-link font-bold text-gray-200" onclick="viewPropertyStats(${p.id})" role="button" tabindex="0" title="Click to view property stats">${sanitize(p.title)}</span>
            </td>
            <td class="px-4 md:px-6 py-3 text-gray-300 capitalize hidden md:table-cell">${p.type}</td>
            <td class="px-4 md:px-6 py-3 text-gray-300 hidden lg:table-cell editable-cell" onclick="startCellEdit(${p.id}, 'bedrooms', this, 'number')" title="Click to edit">
                <span class="cell-value">${PropertyDataService.getValue(p.id, 'bedrooms', p.bedrooms)}</span>
            </td>
            <td class="px-4 md:px-6 py-3 text-gray-300 hidden lg:table-cell editable-cell" onclick="startCellEdit(${p.id}, 'bathrooms', this, 'number')" title="Click to edit">
                <span class="cell-value">${PropertyDataService.getValue(p.id, 'bathrooms', p.bathrooms)}</span>
            </td>
            <td class="px-4 md:px-6 py-3 text-gray-300 hidden lg:table-cell editable-cell" onclick="startCellEdit(${p.id}, 'interiorType', this, 'select')" title="Click to edit">
                <span class="cell-value">${PropertyDataService.getValue(p.id, 'interiorType', p.interiorType)}</span>
            </td>
            <td class="px-4 md:px-6 py-3 text-gray-300 hidden lg:table-cell editable-cell" onclick="startCellEdit(${p.id}, 'storage', this, 'number')" title="Click to edit">
                <span class="cell-value">${PropertyDataService.getValue(p.id, 'storage', p.storage).toLocaleString()}</span>
            </td>
            <td class="px-4 md:px-6 py-3 text-green-400 font-bold editable-cell" onclick="startCellEdit(${p.id}, 'weeklyPrice', this, 'number')" title="Click to edit">
                <span class="cell-value">${weeklyPrice.toLocaleString()}</span>
            </td>
            <td class="px-4 md:px-6 py-3 text-purple-400 font-bold editable-cell" onclick="startCellEdit(${p.id}, 'monthlyPrice', this, 'number')" title="Click to edit">
                <span class="cell-value">${monthlyPrice.toLocaleString()}</span>
            </td>
            <td class="px-2 md:px-3 py-3 text-center" rowspan="${isRented ? '2' : '1'}">
                <button onclick="confirmDeleteProperty(${p.id}, '${sanitize(p.title).replace(/'/g, "\\'")}')" class="text-red-400 hover:text-red-300 hover:bg-red-900/30 p-2 rounded-lg transition" title="Delete property">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </td>
        </tr>
        ${isRented ? `
        <tr class="border-b border-gray-700 ${dueStatusClass} transition">
            <td colspan="9" class="px-4 md:px-6 py-2">
                <div class="flex flex-wrap items-center gap-3 md:gap-6 text-sm">
                    <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        <span class="text-gray-400">Renter:</span>
                        <span class="text-white font-semibold">${renterName || '<span class="text-gray-500 italic">Not set</span>'}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        <span class="text-gray-400">Paid:</span>
                        <span class="text-white font-semibold">${lastPaidDisplay}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-gray-400">Due:</span>
                        <span class="font-semibold">${nextDueDate || '<span class="text-gray-500">-</span>'}</span>
                        ${dueDateDisplay ? `<span class="ml-1">(${dueDateDisplay})</span>` : ''}
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-gray-400 capitalize">${paymentFrequency}</span>
                    </div>
                    ${reminderScript ? `
                    <button onclick="copyDashboardReminder(${p.id}, this)" class="ml-auto bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-lg font-bold text-xs hover:opacity-90 transition flex items-center gap-1" title="Copy reminder - text in city for fastest response">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                        📋 Copy Text
                    </button>
                    ` : ''}
                </div>
            </td>
        </tr>
        ` : ''}
    `;
    }).join('');
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
    $('propertiesGrid').innerHTML = list.filter(p => p && p.images && p.images.length > 0).map(p => {
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
                <button onclick="event.stopPropagation(); openContactModal('offer', '${sanitize(p.title)}', ${p.id})" class="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold hover:opacity-90 transition shadow-lg text-sm md:text-base">Make an Offer</button>
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
    
    // Explicitly clear all input values to prevent browser autocomplete
    const inputs = ['newListingTitle', 'newListingLocation', 'newListingBedrooms', 
                    'newListingBathrooms', 'newListingStorage', 'newListingWeekly', 
                    'newListingMonthly', 'newListingImages'];
    inputs.forEach(id => {
        const el = $(id);
        if (el) el.value = '';
    });
    
    // Reset selects to first option
    const typeSelect = $('newListingType');
    if (typeSelect) typeSelect.selectedIndex = 0;
    const interiorSelect = $('newListingInterior');
    if (interiorSelect) interiorSelect.selectedIndex = 0;
    
    // Reset buttons to initial state
    const createBtn = $('createListingBtn');
    if (createBtn) {
        createBtn.disabled = false;
        createBtn.textContent = '🏠 Create Listing';
    }
    const cancelBtn = $('cancelListingBtn');
    if (cancelBtn) showElement(cancelBtn);
    
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
            
            // Debug logging
            console.log('[CreateListing] Form values:', {
                title, type, location, bedrooms, bathrooms, storage, 
                interiorType, weeklyPrice, monthlyPrice
            });
            
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
            
            // Hide cancel button immediately to prevent accidental clicks
            const cancelBtn = $('cancelListingBtn');
            if (cancelBtn) hideElement(cancelBtn);
            
            try {
                // Generate new ID (find max ID + 1)
                const maxId = properties.reduce((max, p) => Math.max(max, p.id), 0);
                const newId = maxId + 1;
                
                // Get owner email first (lowercase for consistency)
                const ownerEmail = (auth.currentUser?.email || 'richard2019201900@gmail.com').toLowerCase();
                
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
                    features: false,
                    ownerEmail: ownerEmail // Store owner email in property
                };
                
                // Add to local properties array
                properties.push(newProperty);
                
                // Add to owner map
                if (!ownerPropertyMap[ownerEmail]) {
                    ownerPropertyMap[ownerEmail] = [];
                }
                ownerPropertyMap[ownerEmail].push(newId);
                propertyOwnerEmail[newId] = ownerEmail;
                
                // Set availability to true
                state.availability[newId] = true;
                await db.collection('settings').doc('propertyAvailability').set({ [newId]: true }, { merge: true });
                
                // CRITICAL: Clear any stale property overrides for this ID
                // The overrides are stored in flat format: "15.bedrooms", "15.storage", etc.
                console.log('[CreateListing] Clearing overrides for property', newId);
                console.log('[CreateListing] Current state.propertyOverrides[' + newId + ']:', state.propertyOverrides[newId]);
                delete state.propertyOverrides[newId];
                
                // Get all fields that need to be deleted (all possible override fields)
                const overrideFields = ['bedrooms', 'bathrooms', 'storage', 'weeklyPrice', 'monthlyPrice', 
                                       'interiorType', 'renterName', 'renterPhone', 'renterNotes',
                                       'lastPaymentDate', 'paymentFrequency', 'title', 'location', 
                                       'type', 'customReminderScript', 'ownerName', 'ownerPhone'];
                const deleteUpdates = {};
                overrideFields.forEach(field => {
                    deleteUpdates[`${newId}.${field}`] = firebase.firestore.FieldValue.delete();
                });
                
                console.log('[CreateListing] Deleting these fields from Firestore:', Object.keys(deleteUpdates));
                await db.collection('settings').doc('propertyOverrides').update(deleteUpdates).catch(err => {
                    // Ignore if fields don't exist
                    console.log('[CreateListing] No stale overrides to clean up for property', newId, err?.message);
                });
                console.log('[CreateListing] Override cleanup complete');
                
                // Save property to Firestore
                await db.collection('settings').doc('properties').set({
                    [newId]: newProperty
                }, { merge: true });
                
                // Save owner property map to Firestore
                await db.collection('settings').doc('ownerPropertyMap').set({
                    [ownerEmail]: ownerPropertyMap[ownerEmail]
                }, { merge: true });
                
                // Update filtered properties
                state.filteredProperties = [...properties];
                
                // Re-render
                renderProperties(state.filteredProperties);
                renderOwnerDashboard();
                
                successDiv.textContent = '✓ Listing created successfully!';
                showElement(successDiv);
                
                // Change button to show success
                btn.textContent = '✓ Created!';
                btn.classList.remove('from-amber-500', 'to-yellow-500');
                btn.classList.add('from-green-500', 'to-emerald-500');
                
                // Close modal after delay
                setTimeout(() => {
                    closeModal('createListingModal');
                    goToDashboard();
                    // Reset button state for next time
                    btn.disabled = false;
                    btn.textContent = '🏠 Create Listing';
                    btn.classList.remove('from-green-500', 'to-emerald-500');
                    btn.classList.add('from-amber-500', 'to-yellow-500');
                }, 1500);
                
            } catch (error) {
                console.error('Error creating listing:', error);
                errorDiv.textContent = 'Failed to create listing. Please try again.';
                showElement(errorDiv);
                // Show cancel button again on error
                const cancelBtn = $('cancelListingBtn');
                if (cancelBtn) showElement(cancelBtn);
                // Reset button on error
                btn.disabled = false;
                btn.textContent = '🏠 Create Listing';
            }
        });
    }
});

// ==================== DELETE PROPERTY ====================
window.confirmDeleteProperty = function(propertyId, propertyTitle) {
    // Store the property info for deletion
    window.pendingDeleteProperty = { id: propertyId, title: propertyTitle };
    
    // Update modal content
    $('deletePropertyName').textContent = propertyTitle;
    
    // Show the modal
    openModal('deleteConfirmModal');
};

window.cancelDelete = function() {
    window.pendingDeleteProperty = null;
    closeModal('deleteConfirmModal');
};

window.executeDeleteProperty = async function() {
    if (!window.pendingDeleteProperty) return;
    
    const propertyId = window.pendingDeleteProperty.id;
    const btn = $('confirmDeleteBtn');
    
    btn.disabled = true;
    btn.textContent = 'Deleting...';
    
    try {
        // Remove from local properties array
        const propIndex = properties.findIndex(p => p.id === propertyId);
        if (propIndex !== -1) {
            properties.splice(propIndex, 1);
        }
        
        // Remove from owner map
        const ownerEmail = (auth.currentUser?.email || '').toLowerCase();
        if (ownerPropertyMap[ownerEmail]) {
            const idx = ownerPropertyMap[ownerEmail].indexOf(propertyId);
            if (idx !== -1) {
                ownerPropertyMap[ownerEmail].splice(idx, 1);
            }
        }
        delete propertyOwnerEmail[propertyId];
        
        // Remove from availability
        delete state.availability[propertyId];
        
        // Remove from local propertyOverrides
        delete state.propertyOverrides[propertyId];
        
        // Remove from Firestore - properties doc
        await db.collection('settings').doc('properties').update({
            [propertyId]: firebase.firestore.FieldValue.delete()
        });
        
        // Update owner map in Firestore
        await db.collection('settings').doc('ownerPropertyMap').set({
            [ownerEmail]: ownerPropertyMap[ownerEmail]
        }, { merge: true });
        
        // Remove availability
        await db.collection('settings').doc('propertyAvailability').update({
            [propertyId]: firebase.firestore.FieldValue.delete()
        });
        
        // CRITICAL: Remove propertyOverrides for this property
        // The overrides are stored in flat format: "15.bedrooms", "15.storage", etc.
        const overrideFields = ['bedrooms', 'bathrooms', 'storage', 'weeklyPrice', 'monthlyPrice', 
                               'interiorType', 'renterName', 'renterPhone', 'renterNotes',
                               'lastPaymentDate', 'paymentFrequency', 'title', 'location',
                               'type', 'customReminderScript', 'ownerName', 'ownerPhone'];
        const deleteUpdates = {};
        overrideFields.forEach(field => {
            deleteUpdates[`${propertyId}.${field}`] = firebase.firestore.FieldValue.delete();
        });
        
        await db.collection('settings').doc('propertyOverrides').update(deleteUpdates).catch(err => {
            // Ignore if fields don't exist
            console.log('[Delete] No overrides to clean up for property', propertyId);
        });
        
        // Update filtered properties
        state.filteredProperties = [...properties];
        
        // Re-render
        renderProperties(state.filteredProperties);
        renderOwnerDashboard();
        
        // Close modal and go to dashboard
        closeModal('deleteConfirmModal');
        window.pendingDeleteProperty = null;
        
        // If we're on the stats page for this property, go back to dashboard
        if (state.currentPropertyId === propertyId) {
            goToDashboard();
        }
        
    } catch (error) {
        console.error('Error deleting property:', error);
        alert('Failed to delete property. Please try again.');
    } finally {
        btn.disabled = false;
        btn.textContent = '🗑️ Yes, Delete';
    }
};

// ==================== COPY DASHBOARD REMINDER ====================
window.copyDashboardReminder = function(propertyId, btn) {
    const reminderText = window.dashboardReminders && window.dashboardReminders[propertyId];
    if (!reminderText) {
        alert('No reminder text found.');
        return;
    }
    
    const originalHtml = btn.innerHTML;
    
    navigator.clipboard.writeText(reminderText).then(() => {
        // Show success feedback
        btn.innerHTML = `
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            ✓ Copied!
        `;
        btn.classList.remove('from-blue-500', 'to-blue-600');
        btn.classList.add('from-green-500', 'to-emerald-500');
        
        setTimeout(() => {
            btn.innerHTML = originalHtml;
            btn.classList.remove('from-green-500', 'to-emerald-500');
            btn.classList.add('from-blue-500', 'to-blue-600');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = reminderText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            btn.innerHTML = `
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                ✓ Copied!
            `;
            btn.classList.remove('from-blue-500', 'to-blue-600');
            btn.classList.add('from-green-500', 'to-emerald-500');
            setTimeout(() => {
                btn.innerHTML = originalHtml;
                btn.classList.remove('from-green-500', 'to-emerald-500');
                btn.classList.add('from-blue-500', 'to-blue-600');
            }, 2000);
        } catch (e) {
            alert('Failed to copy. Please copy manually.');
        }
        document.body.removeChild(textArea);
    });
};
