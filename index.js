/* ==========================================================================
   ICTU INVENTORY SYSTEM - MASTER JAVASCRIPT LOGIC
   ========================================================================== */

/* ============================================================== */
/* 1. GLOBAL CONFIG & STATE MEMORY                                */
/* ============================================================== */
const API_BASE_URL = "https://localhost:7040/api";
let selectedPRData = null;
let selectedItemData = null;
let selectedMonData = null;
let selectedUserData = null;

/* ============================================================== */
/* 2. CORE API UTILITY                                            */
/* ============================================================== */
async function apiFetch(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        window.location.href = "log.html";
        throw new Error("No authorization token found.");
    }

    const headers = { 'Authorization': `Bearer ${token}` };
    if (body) headers['Content-Type'] = 'application/json';

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Server Error: ${response.status}`);
    }

    return response.json();
}

/* ============================================================== */
/* 3. GLOBAL UI & SYSTEM HELPERS                                  */
/* ============================================================== */

// --- Sidebar & Fullscreen ---
function toggleSidebar() {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown && dropdown.classList.contains('show')) window.forceCloseDropdown(); 
    
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const mainContent = document.querySelector('main');
    const headerContent = document.querySelector('header');

    if (sidebar) {
        const isOpening = !sidebar.classList.contains('active');
        sidebar.classList.toggle('active');
        if (mainContent) mainContent.inert = isOpening;
        if (headerContent) headerContent.inert = isOpening;
    }

    if (overlay) {
        if (overlay.classList.contains('active')) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.style.display = 'none', 300);
        } else {
            overlay.style.display = 'block';
            setTimeout(() => overlay.classList.add('active'), 10);
        }
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.log(`Error: ${err.message}`));
    } else {
        document.exitFullscreen();
    }
}

document.addEventListener('fullscreenchange', () => {
    const fsIcon = document.querySelector('.fullscreen-icon');
    if (fsIcon) {
        if (document.fullscreenElement) { fsIcon.classList.remove('fa-expand'); fsIcon.classList.add('fa-compress'); } 
        else { fsIcon.classList.remove('fa-compress'); fsIcon.classList.add('fa-expand'); }
    }
});

// --- Dropdown Menu Logic ---
window.toggleProfileDropdown = function() {}; // Neutralize inline HTML click

window.forceCloseDropdown = function() {
    const dropdown = document.getElementById('profileDropdown');
    const arrow = document.querySelector('.dropdown-arrow');
    const profileContainer = document.querySelector('.user-profile-container');
    const overlay = document.getElementById('profileOverlay');
    const header = document.querySelector('.concept-header');

    if (dropdown && dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        dropdown.style.zIndex = ''; 
        if (arrow) arrow.classList.remove('open');
        if (profileContainer) { profileContainer.classList.remove('active'); profileContainer.style.zIndex = ''; }
        if (header) header.style.zIndex = '';
        if (overlay) overlay.style.display = 'none';
    }

    const notifDropdown = document.getElementById('notificationDropdown');
    if (notifDropdown && notifDropdown.classList.contains('show')) {
        notifDropdown.classList.remove('show');
    }
};

window.addEventListener('click', function(event) {
    const profileContainer = event.target.closest('.user-profile-container');
    const dropdown = document.getElementById('profileDropdown');
    const arrow = document.querySelector('.dropdown-arrow');
    const header = document.querySelector('.concept-header');

    let overlay = document.getElementById('profileOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'profileOverlay';
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: rgba(0,0,0,0.5); z-index: 1040; display: none; transition: opacity 0.3s ease;';
        document.body.appendChild(overlay);
    }

    if (!dropdown) return;

    if (profileContainer) {
        if (event.target.closest('.profile-dropdown')) return;

        if (dropdown.classList.contains('show')) {
            window.forceCloseDropdown();
        } else {
            window.forceCloseDropdown(); 
            
            if (header) { header.style.position = 'relative'; header.style.zIndex = '1050'; }
            profileContainer.style.position = 'relative';
            profileContainer.style.zIndex = '1051';
            dropdown.style.zIndex = '1052'; 

            dropdown.classList.add('show');
            if (arrow) arrow.classList.add('open');
            profileContainer.classList.add('active');
            overlay.style.display = 'block';
        }
    } else {
        window.forceCloseDropdown();
    }
});

// --- Password Visibility Toggle ---
window.togglePassword = function(inputId, iconElement) {
    const input = document.getElementById(inputId);
    if (input.type === "password") {
        input.type = "text";
        iconElement.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = "password";
        iconElement.classList.replace('fa-eye-slash', 'fa-eye');
    }
};

// --- Auto Show/Hide Eye Icon on Typing ---
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.password-wrapper input').forEach(input => {
        const icon = input.nextElementSibling; 
        if (icon && icon.classList.contains('password-toggle-icon')) {
            icon.style.display = input.value.length > 0 ? 'block' : 'none';
            input.addEventListener('input', function() {
                icon.style.display = this.value.length > 0 ? 'block' : 'none';
            });
        }
    });
});

// --- Notification Center Logic ---
window.toggleNotificationDropdown = function(event) {
    event.stopPropagation();
    const drop = document.getElementById('notificationDropdown');
    const badge = document.getElementById('notifBadge');
    
    if (drop.classList.contains('show')) {
        drop.classList.remove('show');
    } else {
        window.forceCloseDropdown();
        drop.classList.add('show');
        
        if (badge) { 
            badge.style.display = 'none'; 
            badge.innerText = '0'; 
            sessionStorage.setItem('unreadNotifs', '0');
        }
    }
};

function updateNotificationUI() {
    const history = JSON.parse(sessionStorage.getItem('notifHistory')) || [];
    const unreadCount = parseInt(sessionStorage.getItem('unreadNotifs')) || 0;
    const notifBody = document.getElementById('notifBody');
    const badge = document.getElementById('notifBadge');

    if (!notifBody) return;
    notifBody.innerHTML = '';

    if (history.length === 0) {
        notifBody.innerHTML = '<div class="notif-empty">No recent activity during this session.</div>';
    } else {
        history.forEach(n => {
            const timeString = new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            notifBody.innerHTML += `
                <div class="notif-item">
                    <i class="fa-solid ${n.icon}" style="color: ${n.iconColor}; font-size: 16px; margin-top: 2px;"></i>
                    <div>
                        <strong>${n.type === 'delete' ? 'Deleted' : 'Action'}:</strong> ${n.message}
                        <span class="notif-time">${timeString}</span>
                    </div>
                </div>`;
        });
    }

    if (badge) {
        if (unreadCount > 0) {
            badge.innerText = unreadCount;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
            badge.innerText = '0';
        }
    }
}
document.addEventListener('DOMContentLoaded', updateNotificationUI);

// --- Theme Engine ---
function toggleTheme() {
    document.documentElement.classList.toggle('dark-mode');
    const isDark = document.documentElement.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    updateThemeUI(isDark);
}

function applyTheme() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) document.documentElement.classList.add('dark-mode');
    else document.documentElement.classList.remove('dark-mode');
    updateThemeUI(isDark);
}

function updateThemeUI(isDark) {
    const themeText = document.getElementById('themeText');
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) { if (isDark) { themeIcon.classList.replace('fa-moon', 'fa-sun'); } else { themeIcon.classList.replace('fa-sun', 'fa-moon'); } }
    if (themeText) { if (isDark) { themeText.innerText = 'Light Mode'; } else { themeText.innerText = 'Dark Mode'; } }
}

// --- Notifications & Soft Delete Engine ---
function showNotification(message, type = 'success', undoConfig = null) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;
    let icon = type === 'error' ? 'fa-circle-exclamation' : (type === 'delete' ? 'fa-trash-can' : 'fa-circle-check');
    let iconColor = type === 'error' ? '#dc3545' : (type === 'delete' ? '#ff9800' : '#28a745');

    let html = `<div class="d-flex align-items-center w-100"><i class="fa-solid ${icon}" style="color: ${iconColor}; font-size: 18px; margin-right: 10px;"></i> <span class="flex-grow-1">${message}</span>`;
    if (undoConfig) html += `<button class="btn btn-sm ms-3 undo-btn" style="border-radius: 4px; font-weight: bold; font-size: 11px; letter-spacing: 0.5px;">UNDO</button>`;
    html += `</div>`;
    
    toast.innerHTML = html;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);

    if (undoConfig) {
        let timeLeft = 5;
        const msgSpan = toast.querySelector('.flex-grow-1');

        msgSpan.innerText = `${message} in ${timeLeft}s...`;
        
        const timerId = setInterval(async () => {
            timeLeft--;
            if (timeLeft > 0) {
                msgSpan.innerText = `${message} in ${timeLeft}s...`;
            } else {
                clearInterval(timerId);
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 500);
                await undoConfig.executeApiDelete(); 
            }
        }, 1000);

        toast.querySelector('.undo-btn').addEventListener('click', () => {
            clearInterval(timerId);
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
            showNotification(`${undoConfig.itemName} deletion reversed!`, 'success');
        });
    } else {
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 500); }, 3000);
    }

    if (type !== 'error' && !undoConfig) {
        let history = JSON.parse(sessionStorage.getItem('notifHistory')) || [];
        history.unshift({ message, type, icon, iconColor, time: new Date().toISOString() });
        if (history.length > 10) history.pop();
        sessionStorage.setItem('notifHistory', JSON.stringify(history));

        const drop = document.getElementById('notificationDropdown');
        if (!drop || !drop.classList.contains('show')) {
            let unread = parseInt(sessionStorage.getItem('unreadNotifs')) || 0;
            sessionStorage.setItem('unreadNotifs', unread + 1);
        }
        if (typeof updateNotificationUI === 'function') updateNotificationUI();
    }
}

// --- Formatter ---
function formatLongText(text) {
    if (!text) return '';
    const safeText = text.replace(/"/g, '&quot;');
    return `<span title="${safeText}" style="cursor: help; border-bottom: 1px dashed #9ca3af;">${text}</span>`;
}

// --- Idle Timeout & Auto-Logout ---
let idleTime = 0;
let idleInterval = null;
let countdownInterval = null;
let countdownValue = 60;
const MAX_IDLE_MINUTES = 15;

function initIdleTimeout() {
    if (window.location.pathname.includes('log.html') || document.body.classList.contains('login-body')) return;

    const resetIdle = () => {
        const timeoutModal = document.getElementById('timeoutModal');
        if (timeoutModal && timeoutModal.classList.contains('show')) return; 
        idleTime = 0;
    };

    ['mousemove', 'keydown', 'scroll', 'click'].forEach(evt => document.addEventListener(evt, resetIdle));

    idleInterval = setInterval(() => {
        idleTime++;
        if (idleTime >= MAX_IDLE_MINUTES) {
            showTimeoutWarning();
        }
    }, 60000); 
}

function showTimeoutWarning() {
    if (!document.getElementById('timeoutModal')) {
        const modalHTML = `
        <div class="modal fade" id="timeoutModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" style="z-index: 1060;">
            <div class="modal-dialog modal-dialog-centered modal-sm">
                <div class="modal-content border-0 shadow-lg text-center p-4" style="border-radius: 16px;">
                    <i class="fa-solid fa-user-clock mb-3" style="font-size: 3.5rem; color: #f59e0b;"></i>
                    <h4 class="fw-bold" style="color: #1e293b;">Are you still there?</h4>
                    <p class="text-muted mb-4" style="font-size: 14px;">For your security, you will be logged out automatically in <br><strong id="timeoutCountdown" class="fs-1" style="color: #ef4444;">60</strong> seconds.</p>
                    <button class="btn btn-primary w-100 fw-bold py-2" onclick="stayLoggedIn()" style="border-radius: 8px;">I'm still here</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    const openModals = document.querySelectorAll('.modal.show');
    openModals.forEach(modal => {
        const modalInstance = bootstrap.Modal.getInstance(modal);
        if (modalInstance) modalInstance.hide();
    });

    countdownValue = 60;
    document.getElementById('timeoutCountdown').innerText = countdownValue;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('timeoutModal')).show();

    countdownInterval = setInterval(() => {
        countdownValue--;
        document.getElementById('timeoutCountdown').innerText = countdownValue;
        if (countdownValue <= 0) {
            clearInterval(countdownInterval);
            bootstrap.Modal.getInstance(document.getElementById('timeoutModal')).hide();
            logout();
        }
    }, 1000);
}

window.stayLoggedIn = function() {
    clearInterval(countdownInterval);
    idleTime = 0;
    bootstrap.Modal.getInstance(document.getElementById('timeoutModal')).hide();
};

document.addEventListener('DOMContentLoaded', initIdleTimeout);

// --- Bulk CSV Import Engine ---
document.addEventListener('DOMContentLoaded', () => {
    if (!window.Papa) {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js";
        document.head.appendChild(script);
    }
});

window.processImport = function(event, type) {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = ''; 

    Papa.parse(file, {
        skipEmptyLines: true,
        complete: async function(results) {
            let rawData = results.data;
            if (rawData.length === 0) { showNotification("CSV file is empty.", "error"); return; }

            let headerIndex = 0;
            for (let i = 0; i < Math.min(5, rawData.length); i++) {
                const rowText = rawData[i].join('').toLowerCase();
                if (rowText.includes('purchase number') || rowText.includes('serial') || rowText.includes('pr num') || rowText.includes('item name')) {
                    headerIndex = i; break;
                }
            }

            const headers = rawData[headerIndex].map(h => h.replace(/^\uFEFF/, '').trim());
            const dataRows = rawData.slice(headerIndex + 1);

            const getVal = (row, ...possibleHeaders) => {
                for (let ph of possibleHeaders) {
                    const idx = headers.findIndex(h => h.toLowerCase() === ph.toLowerCase());
                    if (idx !== -1 && row[idx]) return row[idx].trim();
                }
                return '';
            };

            const parseApiDate = (dateStr) => {
                if (!dateStr) return new Date().toISOString();
                const d = new Date(dateStr);
                return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
            };

            showNotification(`Importing ${dataRows.length} records... Please wait.`, 'success');
            let successCount = 0; let errorCount = 0;

            for (const row of dataRows) {
                try {
                    if (type === 'purchase') {
                        const prNumRaw = getVal(row, 'prNum', 'Purchase Number', 'PR Number');
                        const prNum = parseInt(prNumRaw, 10);
                        const prDesc = getVal(row, 'prDescription', 'Description');
                        
                        if (isNaN(prNum) && !prDesc) continue; // Skip totally blank rows

                        await apiFetch('/PurchaseRequests', 'POST', {
                            prNum: isNaN(prNum) ? 0 : prNum,
                            prDate: parseApiDate(getVal(row, 'prDate', 'Date')),
                            prDescription: prDesc || ''
                        });
                    } else if (type === 'item') {
                        const serial = getVal(row, 'itemSerial', 'Serial Number', 'Serial');
                        if (!serial) continue;
                        
                        await apiFetch(`/Inventory/${serial}`, 'POST', {
                            itemName: getVal(row, 'itemName', 'Item Name') || '',
                            itemStatus: getVal(row, 'itemStatus', 'Status') || 'Working',
                            dateChecked: parseApiDate(getVal(row, 'dateChecked', 'Date Checked', 'Date')),
                            remarks: getVal(row, 'remarks', 'Remarks') || ''
                        });
                    } else if (type === 'monitor') {
                        const serial = getVal(row, 'itemSerial', 'Item Serial', 'Serial');
                        if (!serial) continue;

                        await apiFetch(`/ItemStatus/${serial}`, 'POST', {
                            personnelName: getVal(row, 'personnelName', 'Personnel Name', 'Assigned To') || '',
                            division: getVal(row, 'division', 'Division') || 'NCR',
                            section: getVal(row, 'section', 'Section') || 'ICTU',
                            dateAwarded: parseApiDate(getVal(row, 'dateAwarded', 'Date Awarded', 'Date'))
                        });
                    }
                    successCount++;
                } catch (e) { errorCount++; console.error(`Row import failed:`, row, e); }
            }

            showNotification(`Import Complete: ${successCount} added, ${errorCount} failed.`, successCount > 0 ? 'success' : 'error');
            
            if (type === 'purchase') loadPurchaseRequests();
            else if (type === 'item') loadInventoryItems();
            else if (type === 'monitor') loadStatusRecords();
        }
    });
};

// --- Skeleton Loader Helper ---
window.showSkeleton = function(targetId, cols, rows = 4) {
    // 1. If the target is a DataTables grid and library is loaded
    if ($.fn.DataTable && $.fn.DataTable.isDataTable(`#${targetId}`)) {
        const dt = $(`#${targetId}`).DataTable();
        dt.clear();
        for (let i = 0; i < rows; i++) {
            let rowData = [];
            for (let c = 0; c < cols; c++) {
                rowData.push(`<div class="skeleton-line" style="width: ${40 + Math.random() * 50}%"></div>`);
            }
            dt.row.add(rowData);
        }
        dt.draw(false);
    } 
    // 2. If the target is a plain HTML tbody
    else {
        const tbody = document.getElementById(targetId);
        if (!tbody) return;
        let html = '';
        for (let i = 0; i < rows; i++) {
            html += '<tr>';
            for (let c = 0; c < cols; c++) {
                html += `<td class="border-0 py-3"><div class="skeleton-line" style="width: ${40 + Math.random() * 50}%"></div></td>`;
            }
            html += '</tr>';
        }
        tbody.innerHTML = html;
    }
};

/* ============================================================== */
/* 4. AUTHENTICATION & RBAC                                       */
/* ============================================================== */
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) { return null; }
}

async function login() {
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;
    const loginBtn = document.querySelector('.btn-login');

    if (loginBtn.disabled) return;
    if (!user || !pass) { showNotification('Please enter both username and password.', 'error'); return; }

    loginBtn.innerText = "Authenticating..."; loginBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/Auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Username: user, Password: pass })
        });

        const data = await response.json();

        // 1. TEMPORARY PASSWORD CHECK
        if (response.status === 403 && data.forceReset) {
            // Fix: Changed from 'loginUser' to 'forceResetUsername' to properly pass data to the modal
            document.getElementById('forceResetUsername').value = user;
            document.getElementById('forceResetTempPassword').value = pass;
            bootstrap.Modal.getOrCreateInstance(document.getElementById('forceResetModal')).show();
            
            // Fix: Re-enable the button in case they cancel the modal
            loginBtn.innerText = "Log In"; loginBtn.disabled = false;
            return; 
        }

        // 2. INVALID CREDENTIALS OR LOCKOUT
        if (!response.ok) {
            showNotification(data.message || "Login failed.", "error");
            
            // Fix: Re-enable the button so they can try again!
            loginBtn.innerText = "Log In"; loginBtn.disabled = false;
            return;
        }

        // 3. SUCCESSFUL LOGIN
        if (response.ok) {
            localStorage.setItem('jwtToken', data.token);
            const decoded = parseJwt(data.token);
            const userRole = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded.role || decoded.Role || 'Staff';
            const userName = decoded['http://schemas.xmlsoap.org/ws/2005/06/identity/claims/name'] || decoded.unique_name || decoded.name || user;
            const fullName = decoded.FullName || userName;

            const activeUser = { name: fullName, username: user, position: userRole, division: decoded.Division || 'N/A', section: decoded.Section || 'N/A' };
            localStorage.setItem('activeUser', JSON.stringify(activeUser));
            
            window.location.href = "inside.html";
        }
    } catch (error) {
        console.error("API Error:", error);
        showNotification("Could not connect to the server. Is your API running?", "error");
        
        // Fix: Re-enable the button on server crash
        loginBtn.innerText = "Log In"; loginBtn.disabled = false;
    }
}

function logout() {
    localStorage.removeItem('activeUser');
    localStorage.removeItem('jwtToken');
    window.location.href = "log.html";
}

function loadUser() {
    const activeUserStr = localStorage.getItem('activeUser');
    if (activeUserStr) {
        const activeUser = JSON.parse(activeUserStr);
        ['displayHeaderName', 'dropName'].forEach(id => { if (document.getElementById(id)) document.getElementById(id).innerText = activeUser.name; });
        if (document.getElementById('dropRole')) document.getElementById('dropRole').innerText = activeUser.position;
        if (document.getElementById('dropDiv')) document.getElementById('dropDiv').innerText = activeUser.division;
        if (document.getElementById('dropSec')) document.getElementById('dropSec').innerText = activeUser.section;
    }
}

function applyRoleBasedAccess() {
    const activeUserStr = localStorage.getItem('activeUser');
    if (!activeUserStr) return; 

    const role = JSON.parse(activeUserStr).position;
    const currentPath = window.location.pathname.toLowerCase();

    if (currentPath.includes('admin.html') && role !== 'Master') { window.location.href = 'inside.html'; return; }

    if (role === 'Guest') {
        document.querySelectorAll('.nav-item').forEach(item => {
            const href = item.getAttribute('href');
            if (href !== 'inside.html' && !(item.getAttribute('onclick') || '').includes('toggleTheme')) item.style.display = 'none';
        });
        if (currentPath.includes('purchase.html') || currentPath.includes('item.html') || currentPath.includes('monitor.html')) {
            window.location.href = 'inside.html'; return;
        }
        if (currentPath.includes('inside.html') || currentPath === '/' || currentPath.endsWith('//')) {
            document.querySelectorAll('.modern-card a.text-secondary').forEach(arrow => arrow.style.display = 'none');
            const prCard = document.querySelector('.pr-card');
            if (prCard) { prCard.removeAttribute('onclick'); prCard.style.cursor = 'default'; }
        }
    }

    if (['Employee', 'Staff', 'Guest'].includes(role)) {
        document.querySelectorAll('.btn-add-modern, .btn-edit-modern, .btn-delete-modern').forEach(btn => btn.style.display = 'none');
    }

    if (role !== 'Master') {
        document.querySelectorAll('.admin-only-link').forEach(link => link.style.display = 'none');
    }
}

/* ============================================================== */
/* 5. DATATABLES ENGINE                                           */
/* ============================================================== */
function getExportButtons() {
    return [
        { extend: 'excelHtml5', className: 'btn btn-sm btn-light border shadow-sm', text: '<i class="fa-solid fa-file-excel text-success"></i>', titleAttr: 'Export to Excel', title: '', exportOptions: { columns: ':visible' } },
        { extend: 'pdfHtml5', className: 'btn btn-sm btn-light border shadow-sm', text: '<i class="fa-solid fa-file-pdf text-danger"></i>', titleAttr: 'Export to PDF', exportOptions: { columns: ':visible' } },
        { extend: 'print', className: 'btn btn-sm btn-light border shadow-sm', text: '<i class="fa-solid fa-print text-dark"></i>', titleAttr: 'Print Table', title: '', exportOptions: { columns: ':visible' } }
    ];
}

function injectExportButtons(tableId, containerId, importType = null) {
    const header = $(`#${tableId}`).closest('.modern-card').find('.btn-add-modern').parent();
    header.addClass('d-flex gap-2 align-items-center');
    
    const activeUser = JSON.parse(localStorage.getItem('activeUser')) || {};
    const role = activeUser.position || 'Guest';
    const canImport = !['Employee', 'Staff', 'Guest'].includes(role);
    
    if ($(`#${containerId}`).length === 0) {
        let html = `<div id="${containerId}" class="d-flex gap-1 border-end pe-2 border-secondary-subtle"></div>`;
        
        if (importType && canImport) {
            html += `
            <div class="d-flex gap-1 border-end pe-2 border-secondary-subtle">
                <input type="file" id="importFile_${importType}" accept=".csv" style="display:none;" onchange="processImport(event, '${importType}')">
                <button class="btn btn-sm btn-light border shadow-sm text-primary" title="Import CSV" onclick="document.getElementById('importFile_${importType}').click()">
                    <i class="fa-solid fa-file-import"></i>
                </button>
            </div>`;
        }
        header.prepend(html);
    }
    $(`#${tableId}`).DataTable().buttons().container().appendTo(`#${containerId}`);
}

function bindRowSelection(tbodyId, editBtnId, deleteBtnId, extractDataCallback) {
    const tbody = document.getElementById(tbodyId);
    const btnEdit = document.getElementById(editBtnId);
    const btnDelete = document.getElementById(deleteBtnId);
    if (!tbody) return;

    tbody.addEventListener('click', function(e) {
        const targetRow = e.target.closest('tr');
        if (!targetRow) return;
        tbody.querySelectorAll('tr').forEach(row => row.classList.remove('table-active'));
        targetRow.classList.add('table-active');
        if (btnEdit) btnEdit.disabled = false;
        if (btnDelete) btnDelete.disabled = false;
        extractDataCallback(targetRow.querySelectorAll('td'));
    });

    tbody.addEventListener('dblclick', function(e) {
        const targetRow = e.target.closest('tr');
        if (!targetRow) return;
        
        tbody.querySelectorAll('tr').forEach(row => row.classList.remove('table-active'));
        targetRow.classList.add('table-active');
        if (btnEdit) btnEdit.disabled = false;
        if (btnDelete) btnDelete.disabled = false;
        extractDataCallback(targetRow.querySelectorAll('td'));

        if (btnEdit && window.getComputedStyle(btnEdit).display !== 'none') {
            btnEdit.click();
        }
    });

    document.addEventListener('click', function(e) {
        if (tbody.contains(e.target) || (btnEdit && btnEdit.contains(e.target)) || (btnDelete && btnDelete.contains(e.target)) || e.target.closest('.modal')) return;
        tbody.querySelectorAll('tr').forEach(row => row.classList.remove('table-active'));
        if (btnEdit) btnEdit.disabled = true;
        if (btnDelete) btnDelete.disabled = true;
        extractDataCallback(null); 
    });
}

// Master Initialization Block
if (typeof $ !== 'undefined') {
    $(document).ready(async function() {
        try {
            if (document.getElementById('dashTotalWorking')) {
                await loadDashboardData();
                setInterval(() => loadDashboardData(true), 30000);
            }
            else if ($('#purchaseTable').length) {
                $('#purchaseTable').DataTable({
                    "scrollX": true, "order": [[1, "desc"]], "autoWidth": false, "buttons": getExportButtons(),
                    "columnDefs": [{ "width": "20%", "targets": 0, "className": "text-center"}, { "width": "20%", "targets": 1, "className": "text-center"}, { "width": "60%", "targets": 2, "className": "text-start" }]
                });
                injectExportButtons('purchaseTable', 'exportPr', 'purchase');
                await loadPurchaseRequests();
                bindRowSelection('purchaseBody', 'btnEditAction', 'btnDeleteAction', (cells) => { selectedPRData = cells ? { prNumber: cells[0].innerText, date: cells[1].innerText, description: cells[2].innerText } : null; });
            } 
            else if ($('#itemTable').length) {
                $('#itemTable').DataTable({
                    "scrollX": true, "order": [[3, "desc"]], "autoWidth": false, "buttons": getExportButtons(),
                    "columnDefs": [{ "width": "12%", "targets": [0,2,3], "className": "text-center" }, { "width": "25%", "targets": 1, "className": "text-start" }, { "width": "39%", "targets": 4, "className": "text-start" }],
                    "initComplete": function () {
                        this.api().columns(2).every(function () {
                            let column = this;
                            let select = document.createElement('select');
                            select.className = 'form-select form-select-sm d-inline-block ms-3 w-auto';
                            select.style.cursor = 'pointer';
                            select.add(new Option('All Statuses', ''));
                            ['Working', 'Under Repair', 'Missing', 'Condemned', 'Returned'].forEach(status => {
                                select.add(new Option(status, status));
                            });
                            $('.dataTables_filter').append(select);
                            select.addEventListener('change', function () {
                                let val = $.fn.dataTable.util.escapeRegex(select.value);
                                column.search(val ? val : '', false, false).draw();
                            });
                        });
                    }
                });
                injectExportButtons('itemTable', 'exportItem', 'item');
                await loadInventoryItems();
                bindRowSelection('itemBody', 'btnEditItemAction', 'btnDeleteItemAction', (cells) => { selectedItemData = cells ? { serial: cells[0].innerText, name: cells[1].innerText, status: cells[2].innerText, date: cells[3].innerText, remarks: cells[4].innerText } : null; });
            }
            else if ($('#monitorTable').length) {
                $('#monitorTable').DataTable({
                    "scrollX": true, "order": [[6, "desc"]], "autoWidth": false, "buttons": getExportButtons(),
                    "columnDefs": [{ "width": "8%", "targets": 0, "className": "text-center" }, { "width": "14%", "targets": [1,4,6], "className": "text-center" }, { "width": "20%", "targets": [2,3], "className": "text-start" }, { "width": "10%", "targets": 5, "className": "text-center" }]
                });
                injectExportButtons('monitorTable', 'exportMon', 'monitor');
                await loadStatusRecords();
                bindRowSelection('monitorBody', 'btnEditMonAction', 'btnDeleteMonAction', (cells) => { selectedMonData = cells ? { id: cells[0].innerText, serial: cells[1].innerText, name: cells[2].innerText, personnel: cells[3].innerText, division: cells[4].innerText, section: cells[5].innerText, date: cells[6].innerText } : null; });
            }
            else if ($('#usersTable').length) {
                $('#usersTable').DataTable({
                    "scrollX": true, "autoWidth": false, "buttons": getExportButtons()
                });
                injectExportButtons('usersTable', 'exportUsr');

                await loadAdminData(); 
                
                setInterval(refreshAuditLogs, 10000); 
                bindRowSelection('usersTableBody', 'btnEditUserAction', 'btnDeleteUserAction', (cells) => { 
                    if (cells) { const divSec = cells[3].innerText.split(' / '); selectedUserData = { username: cells[0].innerText, fullName: cells[1].innerText, role: cells[2].innerText, division: divSec[0].trim(), section: divSec[1] ? divSec[1].trim() : '' }; } 
                    else selectedUserData = null; 
                });
            }
        } catch (error) { console.error("Initialization Error:", error); }

        $(document).on('draw.dt', function() { $('.page-link, .paginate_button').removeAttr('href').css('cursor', 'pointer'); });
        applyRoleBasedAccess();
        document.body.classList.add('page-loaded'); 
    });
}

/* ============================================================== */
/* 6. KEYBOARD & EVENT LISTENERS                                  */
/* ============================================================== */
document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('login-body')) document.body.classList.add('page-loaded');

    const resetModalEl = document.getElementById('resetPassModal');
    if (resetModalEl) {
        resetModalEl.addEventListener('hidden.bs.modal', function () {
            const userModal = document.getElementById('userModal');
            if (userModal && userModal.classList.contains('show')) {
                document.body.classList.add('modal-open');
                userModal.focus();
            }
        });
    }

    // Make 'Enter' key trigger saves inside Modals
    document.querySelectorAll('.modal').forEach(modalElement => {
        modalElement.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                if (event.target.tagName === 'TEXTAREA' || event.target.tagName === 'BUTTON') return;
                event.preventDefault();
                const actionBtn = modalElement.querySelector('#btnSaveModal, #btnSaveItem, #btnSaveMon, #btnSaveUser');
                if (actionBtn) actionBtn.click();
            }
        });
    });

    // Login Enter Key logic
    const loginPassField = document.getElementById('loginPass');
    if (loginPassField) loginPassField.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); login(); } });

    // Temp Password Enter key logic (Admin Page)
    const tempPassField = document.getElementById('newTempPassword');
    if (tempPassField) tempPassField.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); confirmPasswordReset(); } });
});

document.addEventListener('keydown', function(event) {
    const activeTag = document.activeElement.tagName.toLowerCase();
    const isTyping = activeTag === 'input' || activeTag === 'textarea';
    const isModalOpen = document.body.classList.contains('modal-open');
    const isSidebarOpen = document.getElementById('sidebar') && document.getElementById('sidebar').classList.contains('active');
    const collapseDropdown = () => { window.forceCloseDropdown(); };

    if (event.key === 'Escape') {
        const resetModal = document.getElementById('resetPassModal');
        if (resetModal && resetModal.classList.contains('show')) { bootstrap.Modal.getInstance(resetModal).hide(); event.preventDefault(); event.stopPropagation(); return; }
        if (isModalOpen) { if (isTyping) event.stopPropagation(); return; }

        document.querySelectorAll('tbody tr.table-active').forEach(row => row.classList.remove('table-active'));
        document.querySelectorAll('.btn-edit-modern, .btn-delete-modern').forEach(btn => btn.disabled = true);
        selectedPRData = null; selectedItemData = null; selectedMonData = null; selectedUserData = null;
        collapseDropdown(); toggleSidebar(); return;
    }

    const role = localStorage.getItem('activeUser') ? JSON.parse(localStorage.getItem('activeUser')).position : 'Guest';
    
    const hasCrudAccess = !['Employee', 'Staff', 'Guest'].includes(role); 

    if (!isTyping && !isModalOpen) {
        if (['1','2','3','4','5','0'].includes(event.key)) collapseDropdown(); 
        if (event.key === '1') { window.location.href = 'inside.html'; return; }
        if (role !== 'Guest') {
            if (event.key === '2') { window.location.href = 'purchase.html'; return; }
            if (event.key === '3') { window.location.href = 'item.html'; return; }
            if (event.key === '4') { window.location.href = 'monitor.html'; return; }
        }
        if (role === 'Master' && event.key === '5') { window.location.href = 'admin.html'; return; }
        if (event.key === '0') { toggleTheme(); return; }
    }

    if (isTyping || isSidebarOpen) return; 

    if (event.key === '+' && hasCrudAccess) {
        event.preventDefault(); collapseDropdown();
        if (document.getElementById('purchaseTable')) openModal('add');
        if (document.getElementById('itemTable')) openItemModal('add');
        if (document.getElementById('monitorTable')) openMonModal('add');
        if (document.getElementById('usersTable')) openUserModal('add');
        return;
    }

    if (event.key === 'Enter' && !isModalOpen && hasCrudAccess) {
        collapseDropdown();
        if (selectedPRData && document.getElementById('purchaseTable')) { event.preventDefault(); openModal('edit'); }
        if (selectedItemData && document.getElementById('itemTable')) { event.preventDefault(); openItemModal('edit'); }
        if (selectedMonData && document.getElementById('monitorTable')) { event.preventDefault(); openMonModal('edit'); }
        if (selectedUserData && document.getElementById('usersTable')) { event.preventDefault(); openUserModal('edit'); }
        return;
    }

    if ((event.key === 'Backspace' || event.key === 'Delete') && !isModalOpen && hasCrudAccess) {
        collapseDropdown();
        if (selectedPRData && document.getElementById('purchaseTable')) { event.preventDefault(); openModal('delete'); }
        if (selectedItemData && document.getElementById('itemTable')) { event.preventDefault(); openItemModal('delete'); }
        if (selectedMonData && document.getElementById('monitorTable')) { event.preventDefault(); openMonModal('delete'); }
        if (selectedUserData && document.getElementById('usersTable')) { event.preventDefault(); openUserModal('delete'); }
        return;
    }
}, true);


/* ============================================================== */
/* 7. MODULE: DASHBOARD                                           */
/* ============================================================== */
function animateValue(id, start, end, duration) {
    if (start === end) { document.getElementById(id).innerText = end; return; }
    const obj = document.getElementById(id);
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 4); 
        obj.innerHTML = Math.floor(easeOut * (end - start) + start);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

let dashGlobalItems = [];
let statusChartInstance = null; 

async function loadDashboardData(isBackgroundRefresh = false) {
    const dateElement = document.getElementById('dashCurrentDate');
    if (dateElement) dateElement.innerText = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    try {
        if (!isBackgroundRefresh) {
            showSkeleton('dashActivityFeed', 3, 3);
            showSkeleton('dashRecentPRs', 3, 3);
            showSkeleton('dashRecentItems', 3, 4);
        }

        const [items, prs, statuses] = await Promise.all([ apiFetch('/Inventory'), apiFetch('/PurchaseRequests'), apiFetch('/ItemStatus') ]);
        dashGlobalItems = items;

        const counts = { working: 0, repair: 0, missing: 0, condemned: 0, returned: 0 };
        items.forEach(i => {
            if (i.itemStatus === 'Working') counts.working++;
            else if (i.itemStatus === 'Under Repair') counts.repair++;
            else if (i.itemStatus === 'Missing') counts.missing++;
            else if (i.itemStatus === 'Condemned') counts.condemned++;
            else if (i.itemStatus === 'Returned') counts.returned++;
        });

        if(statusChartInstance) {
            document.getElementById('dashTotalWorking').innerText = counts.working;
            document.getElementById('dashTotalRepair').innerText = counts.repair;
            document.getElementById('dashTotalMissing').innerText = counts.missing;
            document.getElementById('dashTotalPRs').innerText = prs.length;
        } else {
            animateValue('dashTotalWorking', 0, counts.working, 1200);
            animateValue('dashTotalRepair', 0, counts.repair, 1200);
            animateValue('dashTotalMissing', 0, counts.missing, 1200);
            animateValue('dashTotalPRs', 0, prs.length, 1200);
        }

        if (statusChartInstance) {
            statusChartInstance.data.datasets[0].data = [counts.working, counts.repair, counts.missing, counts.condemned, counts.returned];
            statusChartInstance.update();
        } else {
            statusChartInstance = new Chart(document.getElementById('statusChart').getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Working', 'Under Repair', 'Missing', 'Condemned', 'Returned'],
                    datasets: [{ data: [counts.working, counts.repair, counts.missing, counts.condemned, counts.returned], backgroundColor: ['#198754', '#fd7e14', '#dc3545', '#343a40', '#0dcaf0'], borderWidth: 0, hoverOffset: 4 }]
                },
                options: { 
                    responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 12 } } },
                    onClick: (event, elements) => { if (elements.length > 0) openStatusModal(['Working', 'Under Repair', 'Missing', 'Condemned', 'Returned'][elements[0].index]); }
                }
            });
        }

        populateFeed('dashActivityFeed', statuses.sort((a, b) => b.assignedID - a.assignedID).slice(0, 3), (s) => `
            <td class="fw-bold border-0" style="font-size: 13px;">${formatLongText(s.itemName)}</td>
            <td class="border-0" style="font-size: 13px;"><i class="fa-solid fa-user text-muted me-1"></i> ${s.personnelName}</td>
            <td class="text-muted border-0" style="font-size: 12px;">${new Date(s.dateAwarded).toLocaleDateString()}</td>
        `, 'No assignments found.');

        populateFeed('dashRecentPRs', [...prs].sort((a, b) => b.prNum - a.prNum).slice(0, 3), (p) => `
            <td class="fw-bold border-0" style="font-size: 13px;">${p.prNum}</td>
            <td class="text-muted border-0" style="font-size: 12px;">${new Date(p.prDate).toLocaleDateString()}</td>
            <td class="border-0" style="font-size: 13px;">${formatLongText(p.prDescription)}</td>
        `, 'No PRs found.');

        populateFeed('dashRecentItems', [...items].sort((a, b) => new Date(b.dateChecked) - new Date(a.dateChecked)).slice(0, 4), (i) => `
            <td class="fw-bold border-0" style="font-size: 13px;">${i.itemSerial}</td>
            <td class="border-0" style="font-size: 13px;">${formatLongText(i.itemName)}</td>
            <td class="border-0">${getStatusBadge(i.itemStatus)}</td>
        `, 'No items found.');

    } catch (error) { console.error("Dashboard Load Error:", error); }
}

function populateFeed(elementId, dataArray, rowTemplate, emptyMsg) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = '';
    if (dataArray.length === 0) el.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-3">${emptyMsg}</td></tr>`;
    else dataArray.forEach(item => el.innerHTML += `<tr>${rowTemplate(item)}</tr>`);
}

function getStatusBadge(status) {
    let badgeClass = 'status-condemned';
    if(status === 'Working') badgeClass = 'status-working';
    else if(status === 'Under Repair') badgeClass = 'status-repair';
    else if(status === 'Missing') badgeClass = 'status-missing';
    else if(status === 'Returned') badgeClass = 'status-returned';
    return `<span class="status-badge ${badgeClass}" style="font-size: 11px; padding: 4px 8px;">${status}</span>`;
}

function openStatusModal(statusType) {
    const tbody = document.getElementById('dashModalBody');
    document.getElementById('dashModalTitle').innerText = `${statusType} Items`;
    tbody.innerHTML = '';
    
    const filteredItems = dashGlobalItems.filter(i => i.itemStatus === statusType).sort((a, b) => new Date(b.dateChecked) - new Date(a.dateChecked));
    if (filteredItems.length === 0) tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">No items currently marked as ${statusType}.</td></tr>`;
    else filteredItems.forEach(i => {
        tbody.innerHTML += `
            <tr>
                <td class="fw-bold border-0" style="font-size: 13px; padding-left: 20px;">${i.itemSerial}</td>
                <td class="border-0" style="font-size: 13px;">${formatLongText(i.itemName)}</td>
                <td class="border-0">${getStatusBadge(i.itemStatus)}</td>
                <td class="text-muted border-0" style="font-size: 12px;">${new Date(i.dateChecked).toLocaleDateString()}</td>
            </tr>`;
    });
    bootstrap.Modal.getOrCreateInstance(document.getElementById('dashboardDetailsModal')).show();
}

/* ============================================================== */
/* 8. MODULE: PURCHASE REQUESTS                                   */
/* ============================================================== */
async function loadPurchaseRequests() {
    try {
        showSkeleton('purchaseTable', 3, 5);

        const prs = await apiFetch('/PurchaseRequests');
        const table = $('#purchaseTable').DataTable();
        table.clear();
        prs.forEach(pr => table.row.add([pr.prNum, pr.prDate.split('T')[0], formatLongText(pr.prDescription)]));
        table.draw(false);
    } catch (error) { showNotification("Failed to load Purchase Requests.", "error"); }
}

function openModal(actionType) {
    document.getElementById('createUpdateModal').setAttribute('data-current-action', actionType);
    const title = document.getElementById('modalTitle');
    const prContainer = document.getElementById('prFieldContainer');
    const prField = document.getElementById('modalPrField');
    const dateField = document.getElementById('modalDateField');
    const descField = document.getElementById('modalDescField');
    const saveBtn = document.getElementById('btnSaveModal');
    const cancelBtn = document.getElementById('btnCancelModal');
    const legacyCheck = document.getElementById('modalLegacyCheck'); 

    prField.readOnly = false; 
    dateField.readOnly = false; 
    descField.readOnly = false;
    dateField.classList.remove('bg-light'); 
    descField.classList.remove('bg-light');
    if (legacyCheck) legacyCheck.disabled = false; 

    if (actionType === 'add') {
        title.textContent = "Add Purchase Request"; prContainer.style.display = 'block';
        prField.value = ""; dateField.value = ""; descField.value = "";
        document.getElementById('legacyCheckContainer').style.display = 'block';
        if (legacyCheck) legacyCheck.checked = false;
        
        saveBtn.textContent = "Save"; saveBtn.className = "btn btn-modern btn-success px-4";
        cancelBtn.textContent = "Cancel"; cancelBtn.className = "btn btn-modern btn-danger px-4";
        
    } else if (actionType === 'edit') {
        title.textContent = "Edit Purchase Request"; prContainer.style.display = 'block';
        document.getElementById('legacyCheckContainer').style.display = 'none';
        
        prField.value = selectedPRData.prNumber; 
        dateField.value = selectedPRData.date; 
        descField.value = selectedPRData.description;

        prField.readOnly = true;
        dateField.readOnly = false; 
        descField.readOnly = false;
        if (legacyCheck) legacyCheck.disabled = true;
        
        saveBtn.textContent = "Save Changes"; saveBtn.className = "btn btn-modern btn-success px-4";
        cancelBtn.textContent = "Cancel"; cancelBtn.className = "btn btn-modern btn-danger px-4";
        
    } else if (actionType === 'delete') {
        title.textContent = "Delete Purchase Request"; prContainer.style.display = 'block';
        document.getElementById('legacyCheckContainer').style.display = 'none'; 
        
        prField.value = selectedPRData.prNumber; 
        dateField.value = selectedPRData.date; 
        descField.value = selectedPRData.description;
        
        prField.readOnly = true; 
        dateField.readOnly = true; 
        descField.readOnly = true;
        if (legacyCheck) legacyCheck.disabled = true;
        
        saveBtn.textContent = "Delete"; saveBtn.className = "btn btn-modern btn-danger px-4";
        cancelBtn.textContent = "Cancel"; cancelBtn.className = "btn btn-modern btn-secondary px-4";
    }
    
    bootstrap.Modal.getOrCreateInstance(document.getElementById('createUpdateModal')).show();
}

function closeModal() { bootstrap.Modal.getInstance(document.getElementById('createUpdateModal'))?.hide(); } 

async function savePurchase() {
    const prInput = document.getElementById('modalPrField').value.trim();
    const dateVal = document.getElementById('modalDateField').value;
    const desc = document.getElementById('modalDescField').value.trim();
    const isLegacy = document.getElementById('modalLegacyCheck')?.checked;
    const actionType = document.getElementById('createUpdateModal').getAttribute('data-current-action');
    const table = $('#purchaseTable').DataTable();
    const btnSave = document.getElementById('btnSaveModal');
    const originalText = btnSave.textContent;
    const pr = selectedPRData?.prNumber;

    if (actionType === 'delete') {
        closeModal(); 
        
        showNotification(`Deleting Purchase Request ${pr}`, 'delete', {
            itemName: `Purchase Request ${pr}`, 
            executeApiDelete: async () => {
                try {
                    await apiFetch(`/PurchaseRequests/${pr}`, 'DELETE');
                    
                    await loadPurchaseRequests(); 
                    
                    document.getElementById('btnEditAction').disabled = true; document.getElementById('btnDeleteAction').disabled = true;
                    selectedPRData = null; 
           
                    showNotification(`Deleted Purchase Request ${pr}`, 'success');

                    let history = JSON.parse(sessionStorage.getItem('notifHistory')) || [];
                    history.unshift({ message: `Deleted Purchase Request ${pr}`, type: 'delete', icon: 'fa-trash-can', iconColor: '#ff9800', time: new Date().toISOString() });
                    sessionStorage.setItem('notifHistory', JSON.stringify(history));
                    if (typeof updateNotificationUI === 'function') updateNotificationUI();
                } catch (error) { showNotification(error.message, 'error'); }
            }
        });
        return; 
    }

    if ((actionType === 'edit' && !pr) || !dateVal || !desc) { showNotification("Please fill out all required fields.", 'error'); return; }
    if (actionType === 'add' && !isLegacy && (!prInput || isNaN(prInput))) { showNotification("Please enter a valid Purchase Number, or check Auto-Generate.", 'error'); return; }

    btnSave.textContent = "Saving..."; btnSave.disabled = true;
    
    try {
        if (actionType === 'add') {
            const response = await apiFetch('/PurchaseRequests', 'POST', { prNum: isLegacy ? 0 : parseInt(prInput), prDate: dateVal, prDescription: desc });
            table.row.add([response.newPRNum, dateVal, formatLongText(desc)]).draw(false);
            showNotification('Purchase Request Added!', 'success');
        } else if (actionType === 'edit') {
            await apiFetch(`/PurchaseRequests/${pr}`, 'PUT', { prNum: parseInt(pr), prDate: dateVal, prDescription: desc });
            const activeRow = document.querySelector('#purchaseBody tr.table-active');
            if (activeRow) { 
                table.row(activeRow).data([pr, dateVal, formatLongText(desc)]).draw(false); 
                selectedPRData = { prNumber: pr, date: dateVal, description: desc };
                showNotification('Purchase Request Updated!', 'success'); 
            }
        }
        closeModal();
    } catch (error) { showNotification(error.message, 'error'); } 
    finally { btnSave.textContent = originalText; btnSave.disabled = false; }
}

document.addEventListener('DOMContentLoaded', () => {
    const legacyCheck = document.getElementById('modalLegacyCheck');
    const prField = document.getElementById('modalPrField');
    if (legacyCheck && prField) {
        legacyCheck.addEventListener('change', function() {
            if (this.checked) { prField.value = "Auto-Generated"; prField.readOnly = true; } 
            else { prField.value = ""; prField.readOnly = false; }
        });
    }
});

/* ============================================================== */
/* 9. MODULE: INVENTORY ITEMS                                     */
/* ============================================================== */
async function loadInventoryItems() {
    try {
        showSkeleton('itemTable', 5, 5);

        const items = await apiFetch('/Inventory');
        const table = $('#itemTable').DataTable();
        table.clear();
        items.forEach(i => table.row.add([i.itemSerial, i.itemName, getStatusBadge(i.itemStatus), i.dateChecked.split('T')[0], formatLongText(i.remarks)]));
        table.draw(false);
    } catch (error) { showNotification("Failed to load Inventory Items.", "error"); }
}

function openItemModal(actionType) {
    document.getElementById('itemActionModal').setAttribute('data-current-action', actionType);
    const title = document.getElementById('itemModalTitle');
    const serialLabel = document.getElementById('itemSerialLabel');
    const serialField = document.getElementById('modalItemSerial');
    const nameField = document.getElementById('modalItemName');
    const statusField = document.getElementById('modalItemStatus');
    const dateField = document.getElementById('modalItemDate');
    const remarksField = document.getElementById('modalItemRemarks');
    const saveBtn = document.getElementById('btnSaveItem');
    const cancelBtn = document.getElementById('btnCancelItem');
    const validationText = document.getElementById('prValidationText');
    if (validationText) validationText.textContent = "";

    [serialField, nameField, statusField, dateField, remarksField].forEach(el => { el.readOnly = false; el.disabled = false; });

    if (actionType === 'add') {
        title.textContent = "Add Inventory Item"; serialLabel.textContent = "Purchase Number:";
        serialField.placeholder = "Enter Purchase Number..."; serialField.value = ""; nameField.value = ""; statusField.value = "Working"; dateField.value = ""; remarksField.value = "";
        saveBtn.textContent = "Save"; saveBtn.className = "btn btn-modern btn-success px-4";
        cancelBtn.textContent = "Cancel"; cancelBtn.className = "btn btn-modern btn-danger px-4";
    } else if (actionType === 'edit') {
        title.textContent = "Edit Inventory Item"; serialLabel.textContent = "Serial Number:";
        serialField.value = selectedItemData.serial; nameField.value = selectedItemData.name; statusField.value = selectedItemData.status; dateField.value = selectedItemData.date; remarksField.value = selectedItemData.remarks;
        serialField.readOnly = true; 
        saveBtn.textContent = "Save Changes"; saveBtn.className = "btn btn-modern btn-success px-4";
        cancelBtn.textContent = "Cancel"; cancelBtn.className = "btn btn-modern btn-danger px-4";
    } else if (actionType === 'delete') {
        title.textContent = "Delete Inventory Item"; serialLabel.textContent = "Serial Number:"; 
        serialField.value = selectedItemData.serial; nameField.value = selectedItemData.name; statusField.value = selectedItemData.status; dateField.value = selectedItemData.date; remarksField.value = selectedItemData.remarks;
        [serialField, nameField, statusField, dateField, remarksField].forEach(el => { el.readOnly = true; if (el.tagName === 'SELECT') el.disabled = true; });
        saveBtn.textContent = "Delete"; saveBtn.className = "btn btn-modern btn-danger px-4";
        cancelBtn.textContent = "Cancel"; cancelBtn.className = "btn btn-modern btn-secondary px-4";
    }
    bootstrap.Modal.getOrCreateInstance(document.getElementById('itemActionModal')).show();
}

function closeItemModal() { bootstrap.Modal.getInstance(document.getElementById('itemActionModal'))?.hide(); }

async function saveItemRecord() {
    const btnSave = document.getElementById('btnSaveItem');
    const originalText = btnSave.textContent;
    btnSave.textContent = "Saving..."; btnSave.disabled = true;

    try {
        const inputId = document.getElementById('modalItemSerial').value.trim(); 
        const name = document.getElementById('modalItemName').value.trim();
        const status = document.getElementById('modalItemStatus').value;
        const date = document.getElementById('modalItemDate').value;
        const remarks = document.getElementById('modalItemRemarks').value.trim();
        const actionType = document.getElementById('itemActionModal').getAttribute('data-current-action');
        const table = $('#itemTable').DataTable();

        if (actionType === 'delete') {
            closeItemModal(); 
            
            showNotification(`Deleting Item ${inputId}`, 'delete', { 
                itemName: `Item ${inputId}`,
                executeApiDelete: async () => {
                    try {
                        await apiFetch(`/Inventory/${inputId}`, 'DELETE');
                        
                        await loadInventoryItems();

                        document.getElementById('btnEditItemAction').disabled = true; document.getElementById('btnDeleteItemAction').disabled = true;
                        selectedItemData = null;

                        showNotification(`Deleted Item ${inputId}`, 'success');

                        let history = JSON.parse(sessionStorage.getItem('notifHistory')) || [];
                        history.unshift({ message: `Permanently deleted Item ${inputId}`, type: 'delete', icon: 'fa-trash-can', iconColor: '#ff9800', time: new Date().toISOString() });
                        sessionStorage.setItem('notifHistory', JSON.stringify(history));
                        if (typeof updateNotificationUI === 'function') updateNotificationUI();
                    } catch (error) { showNotification(error.message, 'error'); }
                }
            });
            return;
        }

        if (!inputId || !name || !date) { showNotification("Please fill out all required fields.", 'error'); return; }

        if (actionType === 'add') {
            const response = await apiFetch(`/Inventory/${inputId}`, 'POST', { itemName: name, itemStatus: status, dateChecked: date, remarks: remarks });
            table.row.add([response.newItemSerial, name, getStatusBadge(status), date, formatLongText(remarks)]).draw(false);
            showNotification('Item Record Added!', 'success');
        } else if (actionType === 'edit') {
            await apiFetch(`/Inventory/${inputId}`, 'PUT', { itemSerial: inputId, itemName: name, itemStatus: status, dateChecked: date, remarks: remarks });
            const activeRow = document.querySelector('#itemBody tr.table-active');
            if (activeRow) { 
                table.row(activeRow).data([inputId, name, getStatusBadge(status), date, formatLongText(remarks)]).draw(false); 
                selectedItemData = { serial: inputId, name: name, status: status, date: date, remarks: remarks };
                showNotification('Item Record Updated!', 'success'); 
            }
        }
        closeItemModal();
    } catch (error) { showNotification(error.message || "An unexpected error occurred.", 'error'); } 
    finally { btnSave.textContent = originalText; btnSave.disabled = false; }
}

document.addEventListener('DOMContentLoaded', () => {
    const itemSerialInput = document.getElementById('modalItemSerial');
    if (itemSerialInput) {
        let prTimer;
        itemSerialInput.addEventListener('input', function(e) {
            clearTimeout(prTimer);
            
            const prVal = e.target.value.trim();
            const validationText = document.getElementById('prValidationText');
            const actionType = document.getElementById('itemActionModal').getAttribute('data-current-action');

            if (actionType === 'add' && validationText) {
                if (prVal.length > 0) { 
                    prTimer = setTimeout(async () => {
                        try { 
                            await apiFetch(`/PurchaseRequests/${encodeURIComponent(prVal)}`); 
                            validationText.textContent = "✓ Valid Purchase Number found."; 
                            validationText.className = "text-success fw-bold mt-1"; 
                        } 
                        catch (error) { 
                            validationText.textContent = "✗ Purchase Number not found."; 
                            validationText.className = "text-danger fw-bold mt-1"; 
                        }
                    }, 500);
                } else {
                    validationText.textContent = "";
                }
            }
        });
    }
});

/* ============================================================== */
/* 10. MODULE: ITEM STATUS (MONITOR)                              */
/* ============================================================== */
async function loadStatusRecords() {
    try {
        showSkeleton('monitorTable', 7, 5);

        const records = await apiFetch('/ItemStatus');
        const table = $('#monitorTable').DataTable();
        table.clear();
        records.forEach(r => table.row.add([r.assignedID, r.itemSerial, r.itemName, r.personnelName, r.division, r.section, r.dateAwarded.split('T')[0]]));
        table.draw(false);
    } catch (error) { showNotification("Failed to load Item Status.", "error"); }
}

function openMonModal(actionType) {
    document.getElementById('monActionModal').setAttribute('data-current-action', actionType);
    const title = document.getElementById('monModalTitle');
    const idContainer = document.getElementById('monIdContainer');
    const nameContainer = document.getElementById('monNameContainer');
    const idField = document.getElementById('modalMonId');
    const serialField = document.getElementById('modalMonSerial');
    const nameField = document.getElementById('modalMonName');
    const personnelField = document.getElementById('modalMonPersonnel');
    const divisionField = document.getElementById('modalMonDivision');
    const sectionField = document.getElementById('modalMonSection');
    const dateField = document.getElementById('modalMonDate');
    const saveBtn = document.getElementById('btnSaveMon');
    const cancelBtn = document.getElementById('btnCancelMon');

    [serialField, personnelField, divisionField, sectionField, dateField].forEach(el => { el.readOnly = false; el.disabled = false; });

    if (actionType === 'add') {
        title.textContent = "Add Status Record"; idContainer.style.display = 'none'; nameContainer.style.display = 'block';
        serialField.value = ""; nameField.value = ""; personnelField.value = ""; divisionField.value = "NCR"; sectionField.value = "ICTU"; dateField.value = "";
        saveBtn.textContent = "Save"; saveBtn.className = "btn btn-modern btn-success px-4"; cancelBtn.textContent = "Cancel"; cancelBtn.className = "btn btn-modern btn-danger px-4";
    } else if (actionType === 'edit') {
        title.textContent = "Edit Status Record"; idContainer.style.display = 'block'; nameContainer.style.display = 'block'; 
        idField.value = selectedMonData.id; serialField.value = selectedMonData.serial; nameField.value = selectedMonData.name; personnelField.value = selectedMonData.personnel; divisionField.value = selectedMonData.division; sectionField.value = selectedMonData.section; dateField.value = selectedMonData.date;
        serialField.readOnly = true;
        saveBtn.textContent = "Save Changes"; saveBtn.className = "btn btn-modern btn-success px-4"; cancelBtn.textContent = "Cancel"; cancelBtn.className = "btn btn-modern btn-danger px-4";
    } else if (actionType === 'delete') {
        title.textContent = "Delete Status Record"; idContainer.style.display = 'block'; nameContainer.style.display = 'block';
        idField.value = selectedMonData.id; serialField.value = selectedMonData.serial; nameField.value = selectedMonData.name; personnelField.value = selectedMonData.personnel; divisionField.value = selectedMonData.division; sectionField.value = selectedMonData.section; dateField.value = selectedMonData.date;
        [serialField, personnelField, dateField].forEach(el => el.readOnly = true); [divisionField, sectionField].forEach(el => el.disabled = true);
        saveBtn.textContent = "Delete"; saveBtn.className = "btn btn-modern btn-danger px-4"; cancelBtn.textContent = "Cancel"; cancelBtn.className = "btn btn-modern btn-secondary px-4";
    }
    bootstrap.Modal.getOrCreateInstance(document.getElementById('monActionModal')).show();
}

function closeMonModal() { bootstrap.Modal.getInstance(document.getElementById('monActionModal'))?.hide(); }

async function saveMonRecord() {
    const btnSave = document.getElementById('btnSaveMon');
    const originalText = btnSave.textContent;
    btnSave.textContent = "Saving..."; btnSave.disabled = true;

    try {
        const id = document.getElementById('modalMonId').value;
        const serial = document.getElementById('modalMonSerial').value.trim();
        const name = document.getElementById('modalMonName').value.trim();
        const personnel = document.getElementById('modalMonPersonnel').value.trim();
        const division = document.getElementById('modalMonDivision').value;
        const section = document.getElementById('modalMonSection').value;
        const date = document.getElementById('modalMonDate').value;
        const actionType = document.getElementById('monActionModal').getAttribute('data-current-action');
        const table = $('#monitorTable').DataTable();

        if (actionType === 'delete') {
            closeMonModal(); 
            
            showNotification(`Deleting Status Record`, 'delete', {
                itemName: `Status Record`,
                executeApiDelete: async () => {
                    try {
                        await apiFetch(`/ItemStatus/${id}`, 'DELETE');
                        
                        await loadStatusRecords();

                        document.getElementById('btnEditMonAction').disabled = true; document.getElementById('btnDeleteMonAction').disabled = true;
                        selectedMonData = null;

                        showNotification(`Deleted Status Record for ${serial}`, 'success');

                        let history = JSON.parse(sessionStorage.getItem('notifHistory')) || [];
                        history.unshift({ message: `Permanently deleted Status Record for ${serial}`, type: 'delete', icon: 'fa-trash-can', iconColor: '#ff9800', time: new Date().toISOString() });
                        sessionStorage.setItem('notifHistory', JSON.stringify(history));
                        if (typeof updateNotificationUI === 'function') updateNotificationUI();
                    } catch (error) { showNotification(error.message, 'error'); }
                }
            });
            return; 
        }

        if (!serial || !personnel || !date) { showNotification("Please fill out all required fields.", 'error'); return; }
        if (actionType === 'add' && !name) { showNotification("Please enter a valid Serial Number to fetch an Item.", 'error'); return; }

        if (actionType === 'add') {
            const response = await apiFetch(`/ItemStatus/${serial}`, 'POST', { personnelName: personnel, division: division, section: section, dateAwarded: date });
            const exactSerial = response.trueSerial || response.TrueSerial || serial;
            table.row.add([response.newAssignedId, exactSerial, name, personnel, division, section, date]).draw(false);
            showNotification('Status Record Added!', 'success');
        } else if (actionType === 'edit') {
            await apiFetch(`/ItemStatus/${id}`, 'PUT', { assignedID: id, personnelName: personnel, division: division, section: section, dateAwarded: date });
            const activeRow = document.querySelector('#monitorBody tr.table-active');
            if (activeRow) { 
                table.row(activeRow).data([id, serial, selectedMonData.name, personnel, division, section, date]).draw(false); 
                selectedMonData = { id: id, serial: serial, name: selectedMonData.name, personnel: personnel, division: division, section: section, date: date };
                showNotification('Status Record Updated!', 'success'); 
            }
        }
        closeMonModal();
    } catch (error) { showNotification(error.message || "An unexpected error occurred.", 'error'); } 
    finally { btnSave.textContent = originalText; btnSave.disabled = false; }
}

document.addEventListener('DOMContentLoaded', () => {
    // Live fetch for Serial Number
    const serialInput = document.getElementById('modalMonSerial');
    if (serialInput) {
        let serialTimer;
        serialInput.addEventListener('input', function(e) {
            clearTimeout(serialTimer); 
            
            const serialVal = e.target.value.trim();
            const nameContainer = document.getElementById('monNameContainer');
            const nameField = document.getElementById('modalMonName');
            const actionType = document.getElementById('monActionModal').getAttribute('data-current-action');

            if (actionType === 'add') {
                if (serialVal.length >= 4) {
                    serialTimer = setTimeout(async () => {
                        try { 
                            const itemData = await apiFetch(`/Inventory/${encodeURIComponent(serialVal)}`); 
                            nameField.value = itemData.itemName; 
                        } 
                        catch (error) { 
                            nameField.value = "Serial Not Found"; 
                        }
                    }, 500);
                } else { 
                    nameField.value = ""; 
                }
            }
        });
    }

    // Auto-fill for Personnel 
    const personnelInput = document.getElementById('modalMonPersonnel');
    if (personnelInput) {
        let personnelTimer;
        personnelInput.addEventListener('input', function(e) {
            clearTimeout(personnelTimer); 
            const userVal = e.target.value.trim();
            if (document.getElementById('monActionModal').getAttribute('data-current-action') === 'add' && userVal.length >= 3) {
                personnelTimer = setTimeout(async () => {
                    try {
                        const userData = await apiFetch(`/Auth/user-info/${encodeURIComponent(userVal)}`);
                        const divSelect = document.getElementById('modalMonDivision');
                        const secSelect = document.getElementById('modalMonSection');
                        divSelect.value = Array.from(divSelect.options).some(o => o.value === userData.division) ? userData.division : "Other";
                        secSelect.value = Array.from(secSelect.options).some(o => o.value === userData.section) ? userData.section : "Other";
                    } catch (error) { /* Ignore silently */ }
                }, 500);
            }
        });
    }
});


/* ============================================================== */
/* 11. MODULE: MASTER CONTROL CENTER (ADMIN)                      */
/* ============================================================== */
async function loadAdminData() {
    try {
        showSkeleton('usersTable', 4, 5);

        const users = await apiFetch('/Admin/users');
        const usrTableObj = $('#usersTable').DataTable();
        
        usrTableObj.clear();
        users.forEach(u => {
            let roleBadge = 'bg-secondary';
            if (u.role === 'Master') roleBadge = 'bg-danger';
            if (u.role === 'Administrator') roleBadge = 'bg-primary';
            if (u.role === 'Employee') roleBadge = 'bg-success';
            usrTableObj.row.add([u.username, u.fullName, `<span class="badge ${roleBadge}">${u.role}</span>`, `<span class="text-muted">${u.division} / ${u.section}</span>`]);
        });
        usrTableObj.draw(false);
        
        await refreshAuditLogs();

    } catch (error) { console.error("Admin Load Error:", error); showNotification("Failed to load secure admin data.", "error"); }
}

async function refreshAuditLogs() {
    try {
        const logs = await apiFetch('/Admin/logs');
        const logTbody = document.getElementById('logsTableBody');
        if (!logTbody) return;

        logTbody.innerHTML = '';
        logs.forEach(l => {
            let actionColor = '#94a3b8';
            if (l.actionType.includes('CREATE')) actionColor = '#4ade80'; 
            if (l.actionType.includes('UPDATE')) actionColor = '#fbbf24'; 
            if (l.actionType.includes('DELETE')) actionColor = '#f87171'; 
            logTbody.innerHTML += `<tr style="border-bottom: 1px solid rgba(255,255,255,0.05);"><td style="width: 25%; color: #64748b;">[${new Date(l.timestamp).toLocaleString()}]</td><td style="width: 15%; color: #38bdf8; font-weight: bold;">${l.username}</td><td style="width: 15%; color: ${actionColor};">${l.actionType}</td><td style="width: 45%;">${l.description}</td></tr>`;
        });
    } catch (error) { 
    }
}

function openUserModal(actionType) {
    document.getElementById('userModal').setAttribute('data-current-action', actionType);
    const title = document.querySelector('#userModal .modal-title');
    const [userField, passField, nameField, roleField, divField, secField] = ['modUserUsername', 'modUserPassword', 'modUserFullName', 'modUserRole', 'modUserDiv', 'modUserSec'].map(id => document.getElementById(id));
    const [saveBtn, cancelBtn, resetBtn] = ['btnSaveUser', 'btnCancelUser', 'btnResetPass'].map(id => document.getElementById(id));

    [userField, passField, nameField, roleField, divField, secField].forEach(el => { el.readOnly = false; el.disabled = false; });
    
    if (actionType === 'add') {
        title.textContent = "Create New Account";
        userField.value = ''; passField.value = ''; nameField.value = ''; roleField.value = 'Guest'; divField.value = 'NCR'; secField.value = 'ICTU';
        passField.closest('.col-md-6').style.display = 'block';
        document.getElementById('confirmPassContainer').style.display = 'block'; 
        saveBtn.textContent = "Create User"; saveBtn.className = "btn btn-modern btn-success px-4"; cancelBtn.textContent = "Cancel"; cancelBtn.className = "btn btn-modern btn-danger px-4";
        if(resetBtn) resetBtn.style.display = 'none';
    } else if (actionType === 'edit') {
        title.textContent = "Edit User Privileges";
        userField.value = selectedUserData.username; userField.readOnly = true; nameField.value = selectedUserData.fullName; roleField.value = selectedUserData.role; divField.value = selectedUserData.division; secField.value = selectedUserData.section;
        passField.closest('.col-md-6').style.display = 'none';
        document.getElementById('confirmPassContainer').style.display = 'none'; 
        saveBtn.textContent = "Save Changes"; saveBtn.className = "btn btn-modern btn-success px-4"; cancelBtn.textContent = "Cancel"; cancelBtn.className = "btn btn-modern btn-danger px-4";
        if(resetBtn) resetBtn.style.display = 'block';
    } else if (actionType === 'delete') {
        title.textContent = "Terminate Account";
        userField.value = selectedUserData.username; nameField.value = selectedUserData.fullName; roleField.value = selectedUserData.role; divField.value = selectedUserData.division; secField.value = selectedUserData.section;
        passField.closest('.col-md-6').style.display = 'none'; 
        document.getElementById('confirmPassContainer').style.display = 'none'; 
        [userField, nameField, roleField, divField, secField].forEach(el => { el.readOnly = true; el.disabled = true; });
        saveBtn.textContent = "Delete User"; saveBtn.className = "btn btn-modern btn-danger px-4"; cancelBtn.textContent = "Cancel"; cancelBtn.className = "btn btn-modern btn-secondary px-4";
        if(resetBtn) resetBtn.style.display = 'none';
    }
    bootstrap.Modal.getOrCreateInstance(document.getElementById('userModal')).show();
}

async function saveUserRecord() {
    const actionType = document.getElementById('userModal').getAttribute('data-current-action');
    const username = document.getElementById('modUserUsername').value;
    const role = document.getElementById('modUserRole').value;
    const btnSave = document.getElementById('btnSaveUser');
    const originalText = btnSave.textContent;
    btnSave.textContent = "Processing..."; btnSave.disabled = true;

    try {
        if (actionType === 'delete') {
            bootstrap.Modal.getInstance(document.getElementById('userModal')).hide(); 
            
            showNotification(`Terminating User ${username}`, 'delete', {
                itemName: `User Account ${username}`,
                executeApiDelete: async () => {
                    try {
                        await apiFetch(`/Admin/users/${username}`, 'DELETE');
                        document.getElementById('btnEditUserAction').disabled = true; 
                        document.getElementById('btnDeleteUserAction').disabled = true;
                        
                        await loadAdminData();
                        showNotification(`Terminated user ${username}`, 'success');

                        let history = JSON.parse(sessionStorage.getItem('notifHistory')) || [];
                        history.unshift({ message: `Permanently terminated user ${username}`, type: 'delete', icon: 'fa-trash-can', iconColor: '#ff9800', time: new Date().toISOString() });
                        sessionStorage.setItem('notifHistory', JSON.stringify(history));
                        if (typeof updateNotificationUI === 'function') updateNotificationUI();
                    } catch (error) { showNotification(error.message, 'error'); }
                }
            });
            return;
        } else {
            const passValue = document.getElementById('modUserPassword') ? document.getElementById('modUserPassword').value : '';
            
            const payload = { 
                Username: username, 
                Password: passValue, 
                FullName: document.getElementById('modUserFullName').value, 
                Role: role, 
                Division: document.getElementById('modUserDiv').value, 
                Section: document.getElementById('modUserSec').value 
            };

            if (actionType === 'add') {
                const confirmPass = document.getElementById('modUserConfirmPassword').value;

                if (passValue !== confirmPass) {
                    showNotification("Passwords do not match!", "error");
                    return;
                }
                if (!payload.Username || !payload.Password) throw new Error("Username and Password are required!");
                
                const response = await apiFetch('/Auth/seed-admin', 'POST', payload);
                showNotification(response.message, 'success');
            } else if (actionType === 'edit') {
                const response = await apiFetch(`/Admin/users/${username}`, 'PUT', payload);
                showNotification(response.message, 'success');
            }
        }
        
        bootstrap.Modal.getInstance(document.getElementById('userModal')).hide();
        await loadAdminData();
        
    } catch (error) { 
        showNotification(error.message, "error"); 
    } finally { 
        btnSave.textContent = originalText; btnSave.disabled = false; 
    }
}

function resetUserPassword() {
    document.getElementById('newTempPassword').value = '';
    bootstrap.Modal.getOrCreateInstance(document.getElementById('resetPassModal')).show();
}

async function confirmPasswordReset() {
    const username = document.getElementById('modUserUsername').value.trim();
    const newPassword = document.getElementById('newTempPassword').value;
    const confirmBtn = document.getElementById('btnConfirmReset');
    const confirmPassword = document.getElementById('confirmTempPassword').value;

    if (!newPassword || newPassword !== confirmPassword) { 
        showNotification("Passwords cannot be empty and must match.", 'error'); 
        return; 
    }

    const originalText = confirmBtn.textContent;
    confirmBtn.textContent = "Resetting..."; confirmBtn.disabled = true;

    try {
        const response = await apiFetch(`/Admin/users/${username}/reset-password`, 'PATCH', { NewPassword: newPassword });
        showNotification(response.message, 'success');
        bootstrap.Modal.getInstance(document.getElementById('resetPassModal')).hide();
        bootstrap.Modal.getInstance(document.getElementById('userModal')).hide();
        await loadAdminData(); 
    } catch (error) { showNotification("Error: " + error.message, 'error'); } 
    finally { confirmBtn.textContent = originalText; confirmBtn.disabled = false; }
}

// ==========================================
// NEW: SELF-SERVICE PASSWORD RESET (DASHBOARD)
// ==========================================
async function changeMyPassword() {
    const oldPass = document.getElementById('selfOldPass').value;
    const newPass = document.getElementById('selfNewPass').value;
    const confirmPass = document.getElementById('selfConfirmPass').value;
    const btnSave = document.getElementById('btnSaveSelfPass');

    if (!oldPass || !newPass) { showNotification("Please fill out all fields.", "error"); return; }
    if (newPass !== confirmPass) { showNotification("New passwords do not match.", "error"); return; }

    const originalText = btnSave.textContent;
    btnSave.textContent = "Updating..."; btnSave.disabled = true;

    try {
        const response = await apiFetch('/Auth/change-password', 'POST', { OldPassword: oldPass, NewPassword: newPass });
        showNotification(response.message, 'success');
        
        document.getElementById('selfOldPass').value = '';
        document.getElementById('selfNewPass').value = '';
        document.getElementById('selfConfirmPass').value = '';
        bootstrap.Modal.getInstance(document.getElementById('selfChangePassModal')).hide();
        
    } catch (error) { 
        showNotification("Error: " + error.message, 'error'); 
    } finally { 
        btnSave.textContent = originalText; btnSave.disabled = false; 
    }
}

// ==========================================
// NEW: MANDATORY FORCE RESET (LOGIN SCREEN)
// ==========================================
async function submitForceReset() {
    const user = document.getElementById('loginUser').value;
    const tempPass = document.getElementById('forceResetTempPassword').value;
    const newPass = document.getElementById('forceNewPassword').value;
    const confirmPass = document.getElementById('forceConfirmPassword').value;
    const btnSubmit = document.getElementById('btnSubmitForceReset');

    if (!newPass) { showNotification("Please enter a new password.", "error"); return; }
    if (newPass !== confirmPass) { showNotification("Passwords do not match.", "error"); return; }

    // Frontend Complexity Check (Matches Backend)
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_\-+={[}\]|\\:;"'<,>.?/~]).{12,}$/;
    if (!passRegex.test(newPass)) {
        showNotification("Password must be at least 12 characters with uppercase, lowercase, and a special character.", "error");
        return;
    }

    const originalText = btnSubmit.textContent;
    btnSubmit.textContent = "Securing..."; btnSubmit.disabled = true;

    try {
        // NOTE: Use your actual absolute API URL if apiFetch isn't available on the login screen
        const response = await fetch(`${API_BASE_URL}/Auth/force-reset`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Username: user, TempPassword: tempPass, NewPassword: newPass })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.message || "Failed to reset password.");

        showNotification("Account secured! Please log in with your new password.", "success");
        bootstrap.Modal.getInstance(document.getElementById('forceResetModal')).hide();
        
        // Clear the login form so they have to type the new password
        document.getElementById('loginUser').value = '';
        document.getElementById('loginPass').value = '';

    } catch (error) {
        showNotification(error.message, "error");
    } finally {
        btnSubmit.textContent = originalText; btnSubmit.disabled = false;
    }
}