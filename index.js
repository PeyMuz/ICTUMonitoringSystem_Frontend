/* ============================================================== */
/* 1. GLOBAL STATE MEMORY                                         */
/* ============================================================== */
const API_BASE_URL = "https://localhost:7040/api"
let selectedPRData = null;
let selectedItemData = null;
let selectedMonData = null;
let selectedUserData = null;

/* ============================================================== */
/* API COMMUNICATION UTILITY                                      */
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
/* 2. CORE UI & SYSTEM (Sidebar, Dropdown, Theme, Fullscreen)     */
/* ============================================================== */
function toggleSidebar() {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown && dropdown.classList.contains('show')) {
        window.forceCloseDropdown(); 
    }
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

window.toggleProfileDropdown = function() {};

window.forceCloseDropdown = function() {
    const dropdown = document.getElementById('profileDropdown');
    const arrow = document.querySelector('.dropdown-arrow');
    if (dropdown && dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        if (arrow) arrow.classList.remove('open');
    }
};

window.addEventListener('click', function(event) {
    const profileContainer = event.target.closest('.user-profile-container');
    const dropdown = document.getElementById('profileDropdown');
    const arrow = document.querySelector('.dropdown-arrow');

    if (!dropdown) return;

    if (profileContainer) {
        if (event.target.closest('.profile-dropdown')) return;

        if (dropdown.classList.contains('show')) {
            window.forceCloseDropdown();
        } else {
            dropdown.classList.add('show');
            if (arrow) arrow.classList.add('open');
        }
    } else {
        window.forceCloseDropdown();
    }
});

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

document.addEventListener('fullscreenchange', () => {
    const fsIcon = document.querySelector('.fullscreen-icon');
    if (fsIcon) {
        if (document.fullscreenElement) {
            fsIcon.classList.remove('fa-expand');
            fsIcon.classList.add('fa-compress');
        } else {
            fsIcon.classList.remove('fa-compress');
            fsIcon.classList.add('fa-expand');
        }
    }
});

function setupActiveSidebar() {
    const currentPath = window.location.pathname.split('/').pop();
    const navItems = document.querySelectorAll('.concept-sidebar .nav-item');
    navItems.forEach(item => {
        item.classList.remove('active-nav');
        const href = item.getAttribute('href');
        if (href === currentPath || (currentPath === '' && href === 'index.html')) item.classList.add('active-nav');
    });
}

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
    
    if (themeIcon) {
        if (isDark) { themeIcon.classList.replace('fa-moon', 'fa-sun'); } 
        else { themeIcon.classList.replace('fa-sun', 'fa-moon'); }
    }
    
    if (themeText) {
        if (isDark) { themeText.innerText = 'Light Mode'; } 
        else { themeText.innerText = 'Dark Mode'; }
    }
}

function showNotification(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;
    
    let icon = type === 'error' ? 'fa-circle-exclamation' : (type === 'delete' ? 'fa-trash-can' : 'fa-circle-check');
    let iconColor = type === 'error' ? '#dc3545' : (type === 'delete' ? '#ff9800' : '#28a745');

    toast.innerHTML = `<i class="fa-solid ${icon}" style="color: ${iconColor}; font-size: 18px;"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

/* ============================================================== */
/* 3. AUTHENTICATION & INITIALIZATION                             */
/* ============================================================== */
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

async function login() {
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;
    const loginBtn = document.querySelector('.btn-login');

    if (loginBtn.disabled) return;

    if (!user || !pass) {
        alert('Please enter both username and password.');
        return;
    }

    loginBtn.innerText = "Authenticating...";
    loginBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/Auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Username: user, Password: pass })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('jwtToken', data.token);

            const decoded = parseJwt(data.token);

            const userRole = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded.role || decoded.Role || 'Staff';
            const userName = decoded['http://schemas.xmlsoap.org/ws/2005/06/identity/claims/name'] || decoded.unique_name || decoded.name || user;

            const fullName = decoded.FullName || userName;
            const division = decoded.Division || 'N/A';
            const section = decoded.Section || 'N/A';

            const activeUser = { 
                name: fullName, 
                username: user, 
                position: userRole,
                division: division,
                section: section
            };
            localStorage.setItem('activeUser', JSON.stringify(activeUser));

            window.location.href = "inside.html";
        } else {
            alert(data.message || "Invalid credentials. Please try again.");
            loginBtn.innerText = "Log In"; 
            loginBtn.disabled = false;
        }
    } catch (error) {
        console.error("API Error:", error);
        alert("Could not connect to the server. Is your API running in Visual Studio?");
        loginBtn.innerText = "Log In"; 
        loginBtn.disabled = false;
    }
}

function logout() {
    localStorage.removeItem('activeUser');
    localStorage.removeItem('jwtToken');
    window.location.href = "log.html";
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

function loadUser() {
    const activeUserStr = localStorage.getItem('activeUser');
    if (activeUserStr) {
        const activeUser = JSON.parse(activeUserStr);
        
        const headerName = document.getElementById('displayHeaderName');
        if (headerName) headerName.innerText = activeUser.name;
        
        const dropName = document.getElementById('dropName');
        if (dropName) dropName.innerText = activeUser.name;
        
        const dropRole = document.getElementById('dropRole');
        if (dropRole) dropRole.innerText = activeUser.position;

        const dropDiv = document.getElementById('dropDiv');
        if (dropDiv) dropDiv.innerText = activeUser.division;

        const dropSec = document.getElementById('dropSec');
        if (dropSec) dropSec.innerText = activeUser.section;
    }
}

/* ============================================================== */
/* 4. UNIVERSAL TABLE LOGIC                                       */
/* ============================================================== */
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

    document.addEventListener('click', function(e) {
        if (tbody.contains(e.target) || 
           (btnEdit && btnEdit.contains(e.target)) || 
           (btnDelete && btnDelete.contains(e.target)) ||
           e.target.closest('.modal')) { return; }
           
        tbody.querySelectorAll('tr').forEach(row => row.classList.remove('table-active'));
        if (btnEdit) btnEdit.disabled = true;
        if (btnDelete) btnDelete.disabled = true;
        extractDataCallback(null); 
    });
}

function formatLongText(text) {
    if (!text) return '';
    const safeText = text.replace(/"/g, '&quot;');
    return `<span title="${safeText}" style="cursor: help; border-bottom: 1px dashed #9ca3af;">${text}</span>`;
}

/* ============================================================== */
/* 5. DATATABLES INITIALIZATION & PAGE REVEAL                     */
/* ============================================================== */
if (typeof $ !== 'undefined') {
    $(document).ready(async function() {
        
        try {
            if (document.getElementById('dashTotalWorking')) {
                await loadDashboardData();
            } 
            else if ($('#purchaseTable').length) {
                $('#purchaseTable').DataTable({
                    "scrollX": true, "order": [[1, "desc"]], "autoWidth": false,
                    "columnDefs": [
                        { "width": "20%", "targets": 0, "className": "text-center"},
                        { "width": "20%", "targets": 1, "className": "text-center"},
                        { "width": "60%", "targets": 2, "className": "text-start" }
                    ]
                });
                await loadPurchaseRequests();

                bindRowSelection('purchaseBody', 'btnEditAction', 'btnDeleteAction', (cells) => {
                    if (cells) selectedPRData = { prNumber: cells[0].innerText, date: cells[1].innerText, description: cells[2].innerText };
                    else selectedPRData = null;
                });
            } 
            else if ($('#itemTable').length) {
                $('#itemTable').DataTable({
                    "scrollX": true, "order": [[3, "desc"]], "autoWidth": false,
                    "columnDefs": [
                        { "width": "12%", "targets": 0, "className": "text-center" },
                        { "width": "25%", "targets": 1, "className": "text-start" },
                        { "width": "12%", "targets": 2, "className": "text-center" },
                        { "width": "12%", "targets": 3, "className": "text-center" },
                        { "width": "39%", "targets": 4, "className": "text-start" }
                    ]
                });
                await loadInventoryItems();

                bindRowSelection('itemBody', 'btnEditItemAction', 'btnDeleteItemAction', (cells) => {
                    if (cells) selectedItemData = { serial: cells[0].innerText, name: cells[1].innerText, status: cells[2].innerText, date: cells[3].innerText, remarks: cells[4].innerText };
                    else selectedItemData = null;
                });
            } 
            else if ($('#monitorTable').length) {
                $('#monitorTable').DataTable({
                    "scrollX": true, "order": [[6, "desc"]], "autoWidth": false,
                    "columnDefs": [
                        { "width": "8%", "targets": 0, "className": "text-center" },
                        { "width": "14%", "targets": 1, "className": "text-center" },
                        { "width": "20%", "targets": 2, "className": "text-start" },
                        { "width": "20%", "targets": 3, "className": "text-start" },
                        { "width": "14%", "targets": 4, "className": "text-center" },
                        { "width": "10%", "targets": 5, "className": "text-center" },
                        { "width": "14%", "targets": 6, "className": "text-center" }
                    ]
                });
                await loadStatusRecords();

                bindRowSelection('monitorBody', 'btnEditMonAction', 'btnDeleteMonAction', (cells) => {
                    if (cells) selectedMonData = { id: cells[0].innerText, serial: cells[1].innerText, name: cells[2].innerText, personnel: cells[3].innerText, division: cells[4].innerText, section: cells[5].innerText, date: cells[6].innerText };
                    else selectedMonData = null;
                });
            }
            else if ($('#usersTable').length) {
                await loadAdminData(); 
                
                bindRowSelection('usersTableBody', 'btnEditUserAction', 'btnDeleteUserAction', (cells) => {
                    if (cells) {
                        const divSec = cells[3].innerText.split(' / ');
                        selectedUserData = {
                            username: cells[0].innerText,
                            fullName: cells[1].innerText,
                            role: cells[2].innerText,
                            division: divSec[0].trim(),
                            section: divSec[1] ? divSec[1].trim() : ''
                        };
                    } else selectedUserData = null;
                });
            }

        } catch (error) {
            console.error("Initialization Error:", error);
        }

        $(document).on('draw.dt', function() {
            $('.page-link, .paginate_button').removeAttr('href').css('cursor', 'pointer');
        });

        applyRoleBasedAccess();

        document.body.classList.add('page-loaded');
    });
}

/* ============================================================== */
/* 6. MODULE: PURCHASE REQUESTS                                   */
/* ============================================================== */
async function loadPurchaseRequests() {
    try {
        const prs = await apiFetch('/PurchaseRequests');
        const table = $('#purchaseTable').DataTable();

        table.clear();

        prs.forEach(pr => {
            const formattedDate = pr.prDate.split('T')[0];
            table.row.add([pr.prNum, formattedDate, formatLongText(pr.prDescription)]);
        });

        table.draw(false);
    } catch (error) {
        console.error("Failed to load PRs:", error);
        showNotification("Failed to connect to database.", "error");
    }
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

    dateField.readOnly = false; descField.readOnly = false;
    dateField.classList.remove('bg-light'); descField.classList.remove('bg-light');

    if (actionType === 'add') {
        title.textContent = "Add Purchase Request";
        prContainer.style.display = 'block';
        
        prField.readOnly = false;
        prField.value = ""; 
        dateField.value = ""; 
        descField.value = "";
        
        document.getElementById('legacyCheckContainer').style.display = 'block';
        document.getElementById('modalLegacyCheck').checked = false;

        saveBtn.textContent = "Save"; saveBtn.className = "btn btn-modern btn-success px-4";
        cancelBtn.textContent = "Cancel"; cancelBtn.className = "btn btn-modern btn-danger px-4";
        
    } else if (actionType === 'edit') {
        title.textContent = "Edit Purchase Request";
        prContainer.style.display = 'block';
        
        document.getElementById('legacyCheckContainer').style.display = 'none';

        prField.value = selectedPRData.prNumber; 
        prField.readOnly = true;
        dateField.value = selectedPRData.date; 
        descField.value = selectedPRData.description;
        
        saveBtn.textContent = "Save"; saveBtn.className = "btn btn-modern btn-success px-4";
        cancelBtn.textContent = "Cancel"; cancelBtn.className = "btn btn-modern btn-danger px-4";

    } else if (actionType === 'delete') {
        title.textContent = "Delete Purchase Request";
        prContainer.style.display = 'block';
        prField.value = selectedPRData.prNumber; dateField.value = selectedPRData.date; descField.value = selectedPRData.description;
        dateField.readOnly = true; descField.readOnly = true;

        saveBtn.textContent = "Delete"; saveBtn.className = "btn btn-modern btn-danger px-4";
        cancelBtn.textContent = "Cancel"; cancelBtn.className = "btn btn-modern btn-secondary px-4";
    }
    bootstrap.Modal.getOrCreateInstance(document.getElementById('createUpdateModal')).show();
}

function closeModal() {
    const myModal = bootstrap.Modal.getInstance(document.getElementById('createUpdateModal'));
    if (myModal) myModal.hide();
} 

async function savePurchase() {
    const prInput = document.getElementById('modalPrField').value.trim();
    const dateVal = document.getElementById('modalDateField').value;
    const desc = document.getElementById('modalDescField').value.trim();
    const isLegacy = document.getElementById('modalLegacyCheck')?.checked;
    
    const actionType = document.getElementById('createUpdateModal').getAttribute('data-current-action');
    const table = $('#purchaseTable').DataTable();
    const btnSave = document.getElementById('btnSaveModal');
    
    const originalText = btnSave.textContent;

    if (actionType === 'delete') {
        btnSave.textContent = "Deleting..."; btnSave.disabled = true;
        try {
            await apiFetch(`/PurchaseRequests/${pr}`, 'DELETE');
            const activeRow = document.querySelector('#purchaseBody tr.table-active');
            if (activeRow) { table.row(activeRow).remove().draw(false); showNotification('Purchase Request Deleted!', 'delete'); }
            
            document.getElementById('btnEditAction').disabled = true; 
            document.getElementById('btnDeleteAction').disabled = true;
            selectedPRData = null; 
            closeModal(); 
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            btnSave.textContent = originalText; btnSave.disabled = false;
        }
        return; 
    }

    if ((actionType === 'edit' && !pr) || !dateVal || !desc) { showNotification("Please fill out all required fields.", 'error'); return; }

    if (actionType === 'add' && !isLegacy && (!prInput || isNaN(prInput))) {
        showNotification("Please enter a valid Purchase Number, or check Auto-Generate.", 'error');
        return;
    }
    if (!dateVal || !desc) { 
        showNotification("Please fill out all required fields.", 'error'); 
        return; 
    }

    btnSave.textContent = "Saving..."; btnSave.disabled = true;
    
    try {
        if (actionType === 'add') {
            const response = await apiFetch('/PurchaseRequests', 'POST', {
                prNum: isLegacy ? 0 : parseInt(prInput), 
                prDate: dateVal,
                prDescription: desc
            });
            
            table.row.add([response.newPRNum, dateVal, formatLongText(desc)]).draw(false);
            showNotification('Purchase Request Added!', 'success');
            
        } else if (actionType === 'edit') {
            await apiFetch(`/PurchaseRequests/${pr}`, 'PUT', {
                prNum: parseInt(pr),
                prDate: dateVal,
                prDescription: desc
            });
            const activeRow = document.querySelector('#purchaseBody tr.table-active');
            if (activeRow) { 
                table.row(activeRow).data([pr, dateVal, formatLongText(desc)]).draw(false); 
                
                selectedPRData = { prNumber: pr, date: dateVal, description: desc };

                showNotification('Purchase Request Updated!', 'success'); 
            }
        }
        closeModal();
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        btnSave.textContent = originalText; btnSave.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const legacyCheck = document.getElementById('modalLegacyCheck');
    const prField = document.getElementById('modalPrField');
    
    if (legacyCheck && prField) {
        legacyCheck.addEventListener('change', function() {
            if (this.checked) {
                prField.value = "Auto-Generated";
                prField.readOnly = true;
            } else {
                prField.value = "";
                prField.readOnly = false;
            }
        });
    }
});

/* ============================================================== */
/* 7. MODULE: INVENTORY ITEMS                                     */
/* ============================================================== */
async function loadInventoryItems() {
    try {
        const items = await apiFetch('/Inventory');
        const table = $('#itemTable').DataTable();
        
        table.clear();
        
        items.forEach(item => {
            const formattedDate = item.dateChecked.split('T')[0];
            
            let badgeClass = 'status-condemned';
            if(item.itemStatus === 'Working') badgeClass = 'status-working';
            else if(item.itemStatus === 'Under Repair') badgeClass = 'status-repair';
            else if(item.itemStatus === 'Missing') badgeClass = 'status-missing';
            else if(item.itemStatus === 'Returned') badgeClass = 'status-returned';
            const statusHtml = `<span class="status-badge ${badgeClass}">${item.itemStatus}</span>`;

            table.row.add([item.itemSerial, item.itemName, statusHtml, formattedDate, formatLongText(item.remarks)]);
        });
        
        table.draw(false);
    } catch (error) {
        console.error("Failed to load Items:", error);
        showNotification("Failed to connect to database.", "error");
    }
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
        serialField.placeholder = "Enter PR Number...";
        serialField.value = ""; nameField.value = ""; statusField.value = "Working"; dateField.value = ""; remarksField.value = "";
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

function closeItemModal() {
    const myModal = bootstrap.Modal.getInstance(document.getElementById('itemActionModal'));
    if (myModal) myModal.hide();
}

async function saveItemRecord() {
    const btnSave = document.getElementById('btnSaveItem');
    const originalText = btnSave.textContent;
    btnSave.textContent = "Saving..."; 
    btnSave.disabled = true;

    try {
        const inputId = document.getElementById('modalItemSerial').value.trim(); 
        const name = document.getElementById('modalItemName').value.trim();
        const status = document.getElementById('modalItemStatus').value;
        const date = document.getElementById('modalItemDate').value;
        const remarks = document.getElementById('modalItemRemarks').value.trim();
        
        const actionType = document.getElementById('itemActionModal').getAttribute('data-current-action');
        const table = $('#itemTable').DataTable();

        if (actionType === 'delete') {
            await apiFetch(`/Inventory/${inputId}`, 'DELETE');
            const activeRow = document.querySelector('#itemBody tr.table-active');
            if (activeRow) { table.row(activeRow).remove().draw(false); showNotification('Item Record Deleted!', 'delete'); }
            
            document.getElementById('btnEditItemAction').disabled = true; 
            document.getElementById('btnDeleteItemAction').disabled = true;
            selectedItemData = null; 
            closeItemModal(); 
            return;
        }

        if (!inputId || !name || !date) { 
            showNotification("Please fill out all required fields.", 'error'); 
            return; 
        }

        let badgeClass = 'status-condemned';
        if(status === 'Working') badgeClass = 'status-working';
        else if(status === 'Under Repair') badgeClass = 'status-repair';
        else if(status === 'Missing') badgeClass = 'status-missing';
        else if(status === 'Returned') badgeClass = 'status-returned';
        const statusHtml = `<span class="status-badge ${badgeClass}">${status}</span>`;

        if (actionType === 'add') {
            const response = await apiFetch(`/Inventory/${inputId}`, 'POST', {
                itemName: name,
                itemStatus: status,
                dateChecked: date,
                remarks: remarks
            });
            table.row.add([response.newItemSerial, name, statusHtml, date, formatLongText(remarks)]).draw(false);
            showNotification('Item Record Added!', 'success');
            
        } else if (actionType === 'edit') {
            await apiFetch(`/Inventory/${inputId}`, 'PUT', {
                itemSerial: inputId,
                itemName: name,
                itemStatus: status,
                dateChecked: date,
                remarks: remarks
            });
            
            const activeRow = document.querySelector('#itemBody tr.table-active');
            if (activeRow) { 
                table.row(activeRow).data([inputId, name, statusHtml, date, formatLongText(remarks)]).draw(false); 
                selectedItemData = { serial: inputId, name: name, status: status, date: date, remarks: remarks };
                showNotification('Item Record Updated!', 'success'); 
            }
        }
        
        closeItemModal();

    } catch (error) {
        console.error("API/JS Error: ", error);
        showNotification(error.message || "An unexpected error occurred.", 'error');
    } finally {

        btnSave.textContent = originalText; 
        btnSave.disabled = false;
    }
}

const itemSerialInput = document.getElementById('modalItemSerial');
if (itemSerialInput) {
    itemSerialInput.addEventListener('input', async function(e) {
        const prVal = e.target.value.trim();
        const validationText = document.getElementById('prValidationText');
        const actionType = document.getElementById('itemActionModal').getAttribute('data-current-action');

        if (actionType === 'add' && validationText) {
            if (prVal.length > 0) { 
                try {
                    await apiFetch(`/PurchaseRequests/${prVal}`);
                    
                    validationText.textContent = "✓ Valid Purchase Number found.";
                    validationText.className = "text-success fw-bold mt-1";
                } catch (error) {

                    validationText.textContent = "✗ Purchase Number not found.";
                    validationText.className = "text-danger fw-bold mt-1";
                }
            } else {
                validationText.textContent = "";
            }
        }
    });
}

/* ============================================================== */
/* 8. MODULE: ITEM STATUS (Monitor)                               */
/* ============================================================== */
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
        title.textContent = "Add Status Record";
        idContainer.style.display = 'none'; nameContainer.style.display = 'none';
        serialField.value = ""; personnelField.value = ""; divisionField.value = "NCR"; sectionField.value = "ICTU"; dateField.value = "";
        saveBtn.textContent = "Save"; saveBtn.className = "btn btn-modern btn-success px-4";
        cancelBtn.textContent = "Cancel"; cancelBtn.className = "btn btn-modern btn-danger px-4";
    } else if (actionType === 'edit') {
        title.textContent = "Edit Status Record";
        idContainer.style.display = 'block'; nameContainer.style.display = 'block'; 
        idField.value = selectedMonData.id; serialField.value = selectedMonData.serial; nameField.value = selectedMonData.name; personnelField.value = selectedMonData.personnel; divisionField.value = selectedMonData.division; sectionField.value = selectedMonData.section; dateField.value = selectedMonData.date;
        serialField.readOnly = true;
        saveBtn.textContent = "Save Changes"; saveBtn.className = "btn btn-modern btn-success px-4";
        cancelBtn.textContent = "Cancel"; cancelBtn.className = "btn btn-modern btn-danger px-4";
    } else if (actionType === 'delete') {
        title.textContent = "Delete Status Record";
        idContainer.style.display = 'block'; nameContainer.style.display = 'block';
        idField.value = selectedMonData.id; serialField.value = selectedMonData.serial; nameField.value = selectedMonData.name; personnelField.value = selectedMonData.personnel; divisionField.value = selectedMonData.division; sectionField.value = selectedMonData.section; dateField.value = selectedMonData.date;
        [serialField, personnelField, dateField].forEach(el => el.readOnly = true);
        [divisionField, sectionField].forEach(el => el.disabled = true);
        saveBtn.textContent = "Delete"; saveBtn.className = "btn btn-modern btn-danger px-4";
        cancelBtn.textContent = "Cancel"; cancelBtn.className = "btn btn-modern btn-secondary px-4";
    }
    bootstrap.Modal.getOrCreateInstance(document.getElementById('monActionModal')).show();
}

function closeMonModal() {
    const myModal = bootstrap.Modal.getInstance(document.getElementById('monActionModal'));
    if (myModal) myModal.hide();
}

// --- LIVE DATABASE FETCH ---
const serialInput = document.getElementById('modalMonSerial');
if (serialInput) {
    serialInput.addEventListener('input', async function(e) {
        const serialVal = e.target.value.trim();
        const nameContainer = document.getElementById('monNameContainer');
        const nameField = document.getElementById('modalMonName');
        const actionType = document.getElementById('monActionModal').getAttribute('data-current-action');

        if (actionType === 'add') {
            if (serialVal.length >= 4) { 
                try {
                    const itemData = await apiFetch(`/Inventory/${serialVal}`);
                    nameContainer.style.display = 'block';
                    nameField.value = itemData.itemName;
                } catch (error) {
                    nameContainer.style.display = 'none';
                    nameField.value = "";
                }
            } else {
                nameContainer.style.display = 'none';
                nameField.value = "";
            }
        }
    });
}

async function loadStatusRecords() {
    try {
        const records = await apiFetch('/ItemStatus');
        const table = $('#monitorTable').DataTable();
        
        table.clear();
        
        records.forEach(r => {
            const formattedDate = r.dateAwarded.split('T')[0];
            table.row.add([r.assignedID, r.itemSerial, r.itemName, r.personnelName, r.division, r.section, formattedDate]);
        });
        
        table.draw(false);
    } catch (error) {
        console.error("Failed to load Statuses:", error);
        showNotification("Failed to connect to database.", "error");
    }
}

async function saveMonRecord() {
    const btnSave = document.getElementById('btnSaveMon');
    const originalText = btnSave.textContent;
    btnSave.textContent = "Saving..."; 
    btnSave.disabled = true;

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
            await apiFetch(`/ItemStatus/${id}`, 'DELETE');
            const activeRow = document.querySelector('#monitorBody tr.table-active');
            if (activeRow) { table.row(activeRow).remove().draw(false); showNotification('Status Record Deleted!', 'delete'); }
            
            document.getElementById('btnEditMonAction').disabled = true; 
            document.getElementById('btnDeleteMonAction').disabled = true;
            selectedMonData = null; 
            closeMonModal(); 
            return; 
        }

        if (!serial || !personnel || !date) { showNotification("Please fill out all required fields.", 'error'); return; }
        if (actionType === 'add' && !name) { showNotification("Please enter a valid Serial Number to fetch an Item.", 'error'); return; }

        if (actionType === 'add') {
            const response = await apiFetch(`/ItemStatus/${serial}`, 'POST', {
                personnelName: personnel,
                division: division,
                section: section,
                dateAwarded: date
            });
            
            const exactSerial = response.trueSerial || response.TrueSerial || serial;

            table.row.add([response.newAssignedId, exactSerial, name, personnel, division, section, date]).draw(false);
            showNotification('Status Record Added!', 'success');
            
        } else if (actionType === 'edit') {
            await apiFetch(`/ItemStatus/${id}`, 'PUT', {
                assignedID: id,
                personnelName: personnel,
                division: division,
                section: section,
                dateAwarded: date
            });
            
            const activeRow = document.querySelector('#monitorBody tr.table-active');
            if (activeRow) { 
                table.row(activeRow).data([id, serial, selectedMonData.name, personnel, division, section, date]).draw(false); 
                selectedMonData = { id: id, serial: serial, name: selectedMonData.name, personnel: personnel, division: division, section: section, date: date };
                showNotification('Status Record Updated!', 'success'); 
            }
        }
        
        closeMonModal();

    } catch (error) {
        console.error("API/JS Error: ", error);
        showNotification(error.message || "An unexpected error occurred.", 'error');
    } finally {
        btnSave.textContent = originalText; 
        btnSave.disabled = false;
    }
}

// --- LIVE AUTO-FILL FOR PERSONNEL ---
const personnelInput = document.getElementById('modalMonPersonnel');
if (personnelInput) {
    let personnelTimer;
    
    personnelInput.addEventListener('input', function(e) {
        clearTimeout(personnelTimer); 
        
        const userVal = e.target.value.trim();
        const actionType = document.getElementById('monActionModal').getAttribute('data-current-action');

        if (actionType === 'add' && userVal.length >= 3) {
            
            personnelTimer = setTimeout(async () => {
                try {
                    const userData = await apiFetch(`/Auth/user-info/${encodeURIComponent(userVal)}`);
                    
                    const divSelect = document.getElementById('modalMonDivision');
                    const secSelect = document.getElementById('modalMonSection');
                    
                    if (Array.from(divSelect.options).some(o => o.value === userData.division)) {
                        divSelect.value = userData.division;
                    } else divSelect.value = "Other";

                    if (Array.from(secSelect.options).some(o => o.value === userData.section)) {
                        secSelect.value = userData.section;
                    } else secSelect.value = "Other";
                    
                } catch (error) {
                    
                }
            }, 500);
        }
    });
}

/* ============================================================== */
/* 9. GLOBAL KEYBOARD SHORTCUTS & EVENT LISTENERS                 */
/* ============================================================== */
document.addEventListener('DOMContentLoaded', () => {

    if (document.body.classList.contains('login-body')) {
        document.body.classList.add('page-loaded');
    }

    document.querySelectorAll('.modal').forEach(modalElement => {
        modalElement.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                if (event.target.tagName === 'TEXTAREA' || event.target.tagName === 'BUTTON') return;
                event.preventDefault();
                const actionBtn = modalElement.querySelector('#btnSaveModal, #btnSaveItem, #btnSaveMon');
                if (actionBtn) actionBtn.click();
            }
        });
    });
});

document.addEventListener('keydown', function(event) {
    const activeTag = document.activeElement.tagName.toLowerCase();
    const isTyping = activeTag === 'input' || activeTag === 'textarea';
    const isModalOpen = document.body.classList.contains('modal-open');
    const sidebar = document.getElementById('sidebar');
    const isSidebarOpen = sidebar && sidebar.classList.contains('active');

    const collapseDropdown = () => {
        const dropdown = document.getElementById('profileDropdown');
        if (dropdown && dropdown.classList.contains('show')) 
            window.forceCloseDropdown();
    };

    if (event.key === 'Escape') {
 
        const resetModal = document.getElementById('resetPassModal');
        if (resetModal && resetModal.classList.contains('show')) {
            bootstrap.Modal.getInstance(resetModal).hide();
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        if (isModalOpen) { if (isTyping) event.stopPropagation(); return; }

        document.querySelectorAll('tbody tr.table-active').forEach(row => row.classList.remove('table-active'));
        document.querySelectorAll('.btn-edit-modern, .btn-delete-modern').forEach(btn => btn.disabled = true);
        selectedPRData = null; selectedItemData = null; selectedMonData = null; selectedUserData = null;

        collapseDropdown(); 
        toggleSidebar(); 
        return;
    }

    if (!isTyping && !isModalOpen) {
        const activeUserStr = localStorage.getItem('activeUser');
        const role = activeUserStr ? JSON.parse(activeUserStr).position : 'Guest';

        if (['1','2','3','4','5','0'].includes(event.key)) collapseDropdown(); // Clear dropdown on navigation

        if (event.key === '1') { window.location.href = 'inside.html'; return; }
        
        if (role !== 'Guest') {
            if (event.key === '2') { window.location.href = 'purchase.html'; return; }
            if (event.key === '3') { window.location.href = 'item.html'; return; }
            if (event.key === '4') { window.location.href = 'monitor.html'; return; }
        }

        if (role === 'Master') {
            if (event.key === '5') { window.location.href = 'admin.html'; return; }
        }
        
        if (event.key === '0') { toggleTheme(); return; }
    }

    if (isTyping || isSidebarOpen) return; 

    if (event.key === '+') {
        event.preventDefault();
        collapseDropdown();
        if (document.getElementById('purchaseTable')) openModal('add');
        if (document.getElementById('itemTable')) openItemModal('add');
        if (document.getElementById('monitorTable')) openMonModal('add');
        if (document.getElementById('usersTable')) openUserModal('add');
        return;
    }

    if (event.key === 'Enter' && !isModalOpen) {
        collapseDropdown();
        if (selectedPRData && document.getElementById('purchaseTable')) { event.preventDefault(); openModal('edit'); }
        if (selectedItemData && document.getElementById('itemTable')) { event.preventDefault(); openItemModal('edit'); }
        if (selectedMonData && document.getElementById('monitorTable')) { event.preventDefault(); openMonModal('edit'); }
        if (selectedUserData && document.getElementById('usersTable')) { event.preventDefault(); openUserModal('edit'); }
        return;
    }

    if ((event.key === 'Backspace' || event.key === 'Delete') && !isModalOpen) {
        collapseDropdown();
        if (selectedPRData && document.getElementById('purchaseTable')) { event.preventDefault(); openModal('delete'); }
        if (selectedItemData && document.getElementById('itemTable')) { event.preventDefault(); openItemModal('delete'); }
        if (selectedMonData && document.getElementById('monitorTable')) { event.preventDefault(); openMonModal('delete'); }
        if (selectedUserData && document.getElementById('usersTable')) { event.preventDefault(); openUserModal('delete'); }
        return;
    }
}, true);

const loginPassField = document.getElementById('loginPass');
if (loginPassField) {
    loginPassField.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            login();
        }
    });
}

/* ============================================================== */
/* 10. MODULE: DASHBOARD                                          */
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

async function loadDashboardData() {
    if (!document.getElementById('dashTotalWorking')) return;

    const dateElement = document.getElementById('dashCurrentDate');
    if (dateElement) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.innerText = new Date().toLocaleDateString('en-US', options);
    }

    try {
        const [items, prs, statuses] = await Promise.all([
            apiFetch('/Inventory'), apiFetch('/PurchaseRequests'), apiFetch('/ItemStatus')
        ]);

        dashGlobalItems = items;

        const workingCount = items.filter(i => i.itemStatus === 'Working').length;
        const repairCount = items.filter(i => i.itemStatus === 'Under Repair').length;
        const missingCount = items.filter(i => i.itemStatus === 'Missing').length;
        const condemnedCount = items.filter(i => i.itemStatus === 'Condemned').length;
        const returnedCount = items.filter(i => i.itemStatus === 'Returned').length;

        animateValue('dashTotalWorking', 0, workingCount, 1200);
        animateValue('dashTotalRepair', 0, repairCount, 1200);
        animateValue('dashTotalMissing', 0, missingCount, 1200);
        animateValue('dashTotalPRs', 0, prs.length, 1200);

        new Chart(document.getElementById('statusChart').getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Working', 'Under Repair', 'Missing', 'Condemned', 'Returned'],
                datasets: [{ data: [workingCount, repairCount, missingCount, condemnedCount, returnedCount], backgroundColor: ['#198754', '#fd7e14', '#dc3545', '#343a40', '#0dcaf0'], borderWidth: 0, hoverOffset: 4 }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { legend: { position: 'right', labels: { boxWidth: 12 } } },

                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const idx = elements[0].index;
                        const statusLabels = ['Working', 'Under Repair', 'Missing', 'Condemned', 'Returned'];
                        openStatusModal(statusLabels[idx]);
                    }
                }
            }
        });
        const feedBody = document.getElementById('dashActivityFeed');
        if (feedBody) {
            feedBody.innerHTML = ''; 
            const recentAssignments = statuses.sort((a, b) => b.assignedID - a.assignedID).slice(0, 3);
            if (recentAssignments.length === 0) { feedBody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-3">No assignments found.</td></tr>'; } 
            else {
                recentAssignments.forEach(status => {
                    const dateObj = new Date(status.dateAwarded);
                    feedBody.innerHTML += `
                        <tr>
                            <td class="fw-bold border-0" style="font-size: 13px;">${formatLongText(status.itemName)}</td>
                            <td class="border-0" style="font-size: 13px;"><i class="fa-solid fa-user text-muted me-1"></i> ${status.personnelName}</td>
                            <td class="text-muted border-0" style="font-size: 12px;">${dateObj.toLocaleDateString()}</td>
                        </tr>
                    `;
                });
            }
        }

        const feedPRs = document.getElementById('dashRecentPRs');
        if (feedPRs) {
            feedPRs.innerHTML = '';
            const recentPRs = [...prs].sort((a, b) => b.prNum - a.prNum).slice(0, 3);
            if (recentPRs.length === 0) { feedPRs.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-3">No PRs found.</td></tr>'; } 
            else {
                recentPRs.forEach(pr => {
                    const dateObj = new Date(pr.prDate);
                    feedPRs.innerHTML += `
                        <tr>
                            <td class="fw-bold border-0" style="font-size: 13px;">${pr.prNum}</td>
                            <td class="text-muted border-0" style="font-size: 12px;">${dateObj.toLocaleDateString()}</td>
                            <td class="border-0" style="font-size: 13px;">${formatLongText(pr.prDescription)}</td>
                        </tr>
                    `;
                });
            }
        }

        const feedItems = document.getElementById('dashRecentItems');
        if (feedItems) {
            feedItems.innerHTML = '';
            const recentItems = [...items].sort((a, b) => new Date(b.dateChecked) - new Date(a.dateChecked)).slice(0, 4);
            if (recentItems.length === 0) { feedItems.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-3">No items found.</td></tr>'; } 
            else {
                recentItems.forEach(item => {
                    let badgeClass = 'status-condemned';
                    if(item.itemStatus === 'Working') badgeClass = 'status-working';
                    else if(item.itemStatus === 'Under Repair') badgeClass = 'status-repair';
                    else if(item.itemStatus === 'Missing') badgeClass = 'status-missing';
                    else if(item.itemStatus === 'Returned') badgeClass = 'status-returned';
                    const statusHtml = `<span class="status-badge ${badgeClass}" style="font-size: 11px; padding: 4px 8px;">${item.itemStatus}</span>`;

                    feedItems.innerHTML += `
                        <tr>
                            <td class="fw-bold border-0" style="font-size: 13px;">${item.itemSerial}</td>
                            <td class="border-0" style="font-size: 13px;">${formatLongText(item.itemName)}</td>
                            <td class="border-0">${statusHtml}</td>
                        </tr>
                    `;
                });
            }
        }

    } catch (error) {
        console.error("Dashboard Load Error:", error);
    }
}

function openStatusModal(statusType) {
    const modalTitle = document.getElementById('dashModalTitle');
    const tbody = document.getElementById('dashModalBody');
    
    modalTitle.innerText = `${statusType} Items`;
    tbody.innerHTML = '';
    
    const filteredItems = dashGlobalItems.filter(i => i.itemStatus === statusType)
                                         .sort((a, b) => new Date(b.dateChecked) - new Date(a.dateChecked));
                                         
    if (filteredItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">No items currently marked as ${statusType}.</td></tr>`;
    } else {
        filteredItems.forEach(item => {
            let badgeClass = 'status-condemned';
            if(item.itemStatus === 'Working') badgeClass = 'status-working';
            else if(item.itemStatus === 'Under Repair') badgeClass = 'status-repair';
            else if(item.itemStatus === 'Missing') badgeClass = 'status-missing';
            else if(item.itemStatus === 'Returned') badgeClass = 'status-returned';
            const statusHtml = `<span class="status-badge ${badgeClass}" style="font-size: 11px; padding: 4px 8px;">${item.itemStatus}</span>`;

            const dateObj = new Date(item.dateChecked);
            
            tbody.innerHTML += `
                <tr>
                    <td class="fw-bold border-0" style="font-size: 13px; padding-left: 20px;">${item.itemSerial}</td>
                    <td class="border-0" style="font-size: 13px;">${formatLongText(item.itemName)}</td>
                    <td class="border-0">${statusHtml}</td>
                    <td class="text-muted border-0" style="font-size: 12px;">${dateObj.toLocaleDateString()}</td>
                </tr>
            `;
        });
    }
    
    bootstrap.Modal.getOrCreateInstance(document.getElementById('dashboardDetailsModal')).show();
}

/* ============================================================== */
/* 11. ROLE-BASED ACCESS CONTROL (RBAC)                           */
/* ============================================================== */
function applyRoleBasedAccess() {
    const activeUserStr = localStorage.getItem('activeUser');
    if (!activeUserStr) return; // Not logged in yet

    const activeUser = JSON.parse(activeUserStr);
    const role = activeUser.position;

    // 0. ADMIN PAGE LOCKDOWN
    const currentPath = window.location.pathname.toLowerCase();
    if (currentPath.includes('admin.html')) {
        if (role !== 'Master') {
            window.location.href = 'inside.html';
            return;
        }
    }

    // 1. GUEST RESTRICTIONS (Strict Lockdown)
    if (role === 'Guest') {
        document.querySelectorAll('.nav-item').forEach(item => {
            const href = item.getAttribute('href');
            const onClick = item.getAttribute('onclick') || '';
            
            if (href !== 'inside.html' && !onClick.includes('toggleTheme')) {
                item.style.display = 'none';
            }
        });

        const currentPath = window.location.pathname.toLowerCase();
        if (currentPath.includes('purchase.html') || 
            currentPath.includes('item.html') || 
            currentPath.includes('monitor.html')) {
            window.location.href = 'inside.html';
            return;
        }

        if (currentPath.includes('inside.html') || currentPath === '/' || currentPath.endsWith('//')) {
            document.querySelectorAll('.modern-card a.text-secondary').forEach(arrow => {
                arrow.style.display = 'none';
            });
            
            const prCard = document.querySelector('.pr-card');
            if (prCard) {
                prCard.removeAttribute('onclick');
                prCard.style.cursor = 'default'; 
            }
        }
    }

    // 2. EMPLOYEE / STAFF RESTRICTIONS (No CRUD Actions)
    if (role === 'Employee' || role === 'Staff' || role === 'Guest') {
        const actionButtons = document.querySelectorAll('.btn-add-modern, .btn-edit-modern, .btn-delete-modern');
        actionButtons.forEach(btn => {
            btn.style.display = 'none';
        });
    }

    // 3. ANYONE WHO IS NOT A MASTER (Hide Control Center Link)
    if (role !== 'Master') {
        document.querySelectorAll('.admin-only-link').forEach(link => {
            link.style.display = 'none';
        });
    }
}

/* ============================================================== */
/* 12. MASTER CONTROL CENTER (ADMIN.HTML)                         */
/* ============================================================== */
async function loadAdminData() {
    try {
        const [users, logs] = await Promise.all([
            apiFetch('/Admin/users'), 
            apiFetch('/Admin/logs')
        ]);

        if ($.fn.DataTable.isDataTable('#usersTable')) {
            $('#usersTable').DataTable().destroy();
        }

        const userTbody = document.getElementById('usersTableBody');
        userTbody.innerHTML = '';
        users.forEach(u => {
            let roleBadge = 'bg-secondary';
            if (u.role === 'Master') roleBadge = 'bg-danger';
            if (u.role === 'Administrator') roleBadge = 'bg-primary';
            if (u.role === 'Employee') roleBadge = 'bg-success';

            userTbody.innerHTML += `
                <tr>
                    <td class="fw-bold">${u.username}</td>
                    <td>${u.fullName}</td>
                    <td><span class="badge ${roleBadge}">${u.role}</span></td>
                    <td class="text-muted">${u.division} / ${u.section}</td>
                </tr>
            `;
        });

        $('#usersTable').DataTable({ 
            "pageLength": 10, 
            "lengthChange": false,
            "autoWidth": false
        });

        // 4. Populate Audit Logs HTML
        const logTbody = document.getElementById('logsTableBody');
        logTbody.innerHTML = '';
        logs.forEach(l => {
            const time = new Date(l.timestamp).toLocaleString();
            let actionColor = '#94a3b8';
            if (l.actionType.includes('CREATE')) actionColor = '#4ade80'; 
            if (l.actionType.includes('UPDATE')) actionColor = '#fbbf24'; 
            if (l.actionType.includes('DELETE')) actionColor = '#f87171'; 

            logTbody.innerHTML += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="width: 25%; color: #64748b;">[${time}]</td>
                    <td style="width: 15%; color: #38bdf8; font-weight: bold;">${l.username}</td>
                    <td style="width: 15%; color: ${actionColor};">${l.actionType}</td>
                    <td style="width: 45%;">${l.description}</td>
                </tr>
            `;
        });

    } catch (error) {
        console.error("Admin Load Error:", error);
        alert("Failed to load secure admin data.");
    }
}

function openUserModal(actionType) {
    document.getElementById('userModal').setAttribute('data-current-action', actionType);
    const title = document.querySelector('#userModal .modal-title');
    
    const userField = document.getElementById('modUserUsername');
    const passField = document.getElementById('modUserPassword');
    const nameField = document.getElementById('modUserFullName');
    const roleField = document.getElementById('modUserRole');
    const divField = document.getElementById('modUserDiv');
    const secField = document.getElementById('modUserSec');
    
    const saveBtn = document.getElementById('btnSaveUser');
    const cancelBtn = document.getElementById('btnCancelUser');

    const resetBtn = document.getElementById('btnResetPass');

    [userField, passField, nameField, roleField, divField, secField].forEach(el => { el.readOnly = false; el.disabled = false; });
    
    if (actionType === 'add') {
        title.textContent = "Create New Account";
        userField.value = ''; passField.value = ''; nameField.value = ''; 
        roleField.value = 'Guest'; divField.value = 'NCR'; secField.value = 'ICTU';
        passField.closest('.col-md-6').style.display = 'block';
        
        saveBtn.textContent = "Create User"; saveBtn.className = "btn btn-modern btn-success px-4";
        cancelBtn.textContent = "Cancel"; cancelBtn.className = "btn btn-modern btn-danger px-4";
        
        if(resetBtn) resetBtn.style.display = 'none';

    } else if (actionType === 'edit') {
        title.textContent = "Edit User Privileges";
        userField.value = selectedUserData.username; userField.readOnly = true;
        nameField.value = selectedUserData.fullName; roleField.value = selectedUserData.role;
        divField.value = selectedUserData.division; secField.value = selectedUserData.section;
        passField.closest('.col-md-6').style.display = 'none';
        
        saveBtn.textContent = "Save Changes"; saveBtn.className = "btn btn-modern btn-success px-4";
        cancelBtn.textContent = "Cancel"; cancelBtn.className = "btn btn-modern btn-danger px-4";

        if(resetBtn) resetBtn.style.display = 'block';

    } else if (actionType === 'delete') {
        title.textContent = "Terminate Account";
        userField.value = selectedUserData.username; nameField.value = selectedUserData.fullName; 
        roleField.value = selectedUserData.role; divField.value = selectedUserData.division; secField.value = selectedUserData.section;
        passField.closest('.col-md-6').style.display = 'none'; // Hide Password
        [userField, nameField, roleField, divField, secField].forEach(el => { el.readOnly = true; el.disabled = true; });
        
        saveBtn.textContent = "Delete User"; saveBtn.className = "btn btn-modern btn-danger px-4";
        cancelBtn.textContent = "Cancel"; cancelBtn.className = "btn btn-modern btn-secondary px-4";

        if(resetBtn) resetBtn.style.display = 'none';
    }
    
    bootstrap.Modal.getOrCreateInstance(document.getElementById('userModal')).show();
}

async function saveUserRecord() {
    const actionType = document.getElementById('userModal').getAttribute('data-current-action');
    const username = document.getElementById('modUserUsername').value;
    const btnSave = document.getElementById('btnSaveUser');
    const originalText = btnSave.textContent;

    btnSave.textContent = "Processing..."; btnSave.disabled = true;

    try {
        if (actionType === 'delete') {
            await apiFetch(`/Admin/users/${username}`, 'DELETE');
            showNotification('User Terminated Successfully!', 'delete');
            document.getElementById('btnEditUserAction').disabled = true;
            document.getElementById('btnDeleteUserAction').disabled = true;
        } else {
            const payload = {
                Username: username, Password: document.getElementById('modUserPassword').value, FullName: document.getElementById('modUserFullName').value,
                Role: document.getElementById('modUserRole').value, Division: document.getElementById('modUserDiv').value, Section: document.getElementById('modUserSec').value
            };

            if (actionType === 'add') {
                if (!payload.Username || !payload.Password) throw new Error("Username and Password are required!");
                const response = await apiFetch('/Auth/seed-admin', 'POST', payload);
                showNotification(response.message, 'success');
            } else if (actionType === 'edit') {
                const response = await apiFetch(`/Admin/users/${username}`, 'PUT', payload);
                showNotification(response.message, 'success');
            }
        }
        bootstrap.Modal.getInstance(document.getElementById('userModal')).hide();
        await loadAdminData(); // Refresh the table
    } catch (error) {
        showNotification(error.message, "error");
    } finally {
        btnSave.textContent = originalText; btnSave.disabled = false;
    }
}

function resetUserPassword() {
    // Clear any old text and open the custom modal
    document.getElementById('newTempPassword').value = '';
    bootstrap.Modal.getOrCreateInstance(document.getElementById('resetPassModal')).show();
}

async function confirmPasswordReset() {
    const username = document.getElementById('modUserUsername').value.trim();
    const newPassword = document.getElementById('newTempPassword').value;
    const confirmBtn = document.getElementById('btnConfirmReset');

    if (newPassword.length < 6) {
        showNotification("Password must be at least 6 characters long.", 'error');
        return;
    }

    const originalText = confirmBtn.textContent;
    confirmBtn.textContent = "Resetting...";
    confirmBtn.disabled = true;

    try {
        const response = await apiFetch(`/Admin/users/${username}/reset-password`, 'PATCH', { NewPassword: newPassword });
        
        showNotification(response.message, 'success');
        
        bootstrap.Modal.getInstance(document.getElementById('resetPassModal')).hide();
        bootstrap.Modal.getInstance(document.getElementById('userModal')).hide();
        
        await loadAdminData(); // Refresh the terminal log
    } catch (error) {
        showNotification("Error: " + error.message, 'error');
    } finally {
        confirmBtn.textContent = originalText;
        confirmBtn.disabled = false;
    }
}

const tempPassField = document.getElementById('newTempPassword');
if (tempPassField) {
    tempPassField.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            confirmPasswordReset();
        }
    });
}