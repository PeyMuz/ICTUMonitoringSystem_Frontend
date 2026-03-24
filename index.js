// === SIDEBAR LOGIC ===
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (sidebar) sidebar.classList.toggle('active');

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

// === DROPDOWN LOGIC ===
function toggleProfileDropdown() {
    document.getElementById('profileDropdown').classList.toggle('show');
}

window.onclick = function(event) {
    if (!event.target.closest('.user-profile-container')) {
        const dropdown = document.getElementById('profileDropdown');
        if (dropdown && dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        }
    }
}

// === FULLSCREEN LOGIC ===
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('Error attempting to enable fullscreen: ${err.message}');
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// === AUTO-ACTIVE SIDEBAR LOGIC ===
function setupActiveSidebar() {
    const currentPath = window.location.pathname.split('/').pop();
    const navItems = document.querySelectorAll('.concept-sidebar .nav-item');

    navItems.forEach(item => {
        item.classList.remove('active-nav');
        const href = item.getAttribute('href');
        if (href === currentPath || (currentPath === '' && href === 'index.html')) {
            item.classList.add('active-nav');
        }
    });
}

// === DARK MODE LOGIC ===
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    updateThemeUI(isDark);
}

function applyTheme() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    updateThemeUI(isDark);
}

function updateThemeUI(isDark) {
    const themeText = document.getElementById('themeText');
    const themeIcon = document.getElementById('themeIcon');
    if (themeText && themeIcon) {
        if (isDark) {
            themeText.innerText = 'Light Mode';
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            themeText.innerText = 'Dark Mode';
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    }
}

// === LOGIN / LOGOUT ===
function login() {
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;
    if (!user || !pass) { alert('Please enter both username and password.'); return; }
    
    // Default Admin Login
    if (user === "admin" && pass === "admin123") {
        const adminAccount = { name: "Administrator", username: "admin", position: "Head Officer" };
        localStorage.setItem('activeUser', JSON.stringify(adminAccount));
        window.location.href = "inside.html";
        return;
    }
    alert("Invalid credentials. Please use admin / admin123");
}

function logout() { localStorage.removeItem('activeUser'); window.location.href = "log.html"; }

function loadUser () { 
    applyTheme();
    setupRowHighlight();
    setupItemRowHighlight();
    setupMonRowHighlight();
    setupActiveSidebar();

    const activeUserStr = localStorage.getItem('activeUser');
    if (!activeUserStr) { window.location.href = "log.html"; return; }
    
    const activeUser = JSON.parse(activeUserStr);

    if (document.getElementById('displayFullName')) document.getElementById('displayFullName').innerText = activeUser.name;
    if (document.getElementById('displayPosition')) document.getElementById('displayPosition').innerText = activeUser.position;


    if (document.getElementById('displayHeaderName')) document.getElementById('displayHeaderName').innerText = activeUser.name;
    if (document.getElementById('dropName')) document.getElementById('dropName').innerText = activeUser.name;
    if (document.getElementById('dropRole')) document.getElementById('dropRole').innerText = activeUser.position;
}

function makeEditable(fieldId) {
    const modal = document.querySelector('.modal-overlay[style*="display: flex"]');
    if(!modal) return;
    const actionType = modal.getAttribute('data-action');
    if (actionType === 'delete') return; 
    if (actionType === 'edit' && (fieldId === 'prnumber' || fieldId === 'serialNumber' || fieldId === 'monPr')) return; 
    
    const selectedField = document.getElementById(fieldId);
    if (selectedField) { selectedField.readOnly = false; selectedField.focus(); }
}

// === PURCHASE REQUEST LOGIC ===
let selectedPRData = null;

function setupRowHighlight() {
    const tbody = document.getElementById('purchaseBody');
    const btnEdit = document.getElementById('btnEditAction');
    const btnDelete = document.getElementById('btnDeleteAction');

    if (!tbody) return

    tbody.addEventListener('click', function(e) {
        const targetRow = e.target.closest('tr');
        if (!targetRow) return;

        const allRows = tbody.querySelectorAll('tr');
        allRows.forEach(row => row.classList.remove('table-active'));

        targetRow.classList.add('table-active');

        btnEdit.disabled = false;
        btnDelete.disabled = false;

        const cells = targetRow.querySelectorAll('td');
        selectedPRData = {
            prNumber: cells[0].innerText,
            date: cells[1].innerText,
            description: cells[2].innerText
        };
    });

    document.addEventListener('click', function(e) {
        if (tbody.contains(e.target) || 
            e.target.closest('#btnEditAction') || 
            e.target.closest('#btnDeleteAction') ||
            e.target.closest('.modal')) {
            return;
        }

        const allRows = tbody.querySelectorAll('tr');
        allRows.forEach(row => row.classList.remove('table-active'));

        btnEdit.disabled = true;
        btnDelete.disabled = true;
        selectedPRData = null;
    });
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

    if (actionType === 'add') {
        title.textContent = "Add Purchase Request";
        prContainer.style.display = 'none';
        dateField.value = "";
        descField.value = "";

        dateField.readOnly = false;
        descField.readOnly = false;
        dateField.classList.remove('bg-light');
        descField.classList.remove('bg-light');

        saveBtn.textContent = "Save";
        saveBtn.className = "btn btn-success px-4";

        cancelBtn.textContent = "Cancel";
        cancelBtn.className = "btn btn-danger px-4";
        
    } else if (actionType === 'edit') {
        title.textContent = "Edit Purchase Request";
        prContainer.style.display = 'block';
        
        prField.value = selectedPRData.prNumber;
        dateField.value = selectedPRData.date;
        descField.value = selectedPRData.description;

        dateField.readOnly = false;
        descField.readOnly = false;
        dateField.classList.remove('bg-light');
        descField.classList.remove('bg-light');

        saveBtn.textContent = "Save";
        saveBtn.className = "btn btn-success px-4";

        cancelBtn.textContent = "Cancel";
        cancelBtn.className = "btn btn-danger px-4";

    } else if (actionType === 'delete') {
        title.textContent = "Delete Purchase Request";
        prContainer.style.display = 'block';
        
        prField.value = selectedPRData.prNumber;
        dateField.value = selectedPRData.date;
        descField.value = selectedPRData.description;

        dateField.readOnly = true;
        descField.readOnly = true;
        dateField.classList.remove('bg-light');
        descField.classList.remove('bg-light');

        saveBtn.textContent = "Delete";
        saveBtn.className = "btn btn-danger px-4";
        
        cancelBtn.textContent = "Cancel";
        cancelBtn.className = "btn btn-secondary px-4";
    }

    const modalElement = document.getElementById('createUpdateModal');
    const myModal = bootstrap.Modal.getOrCreateInstance(modalElement);
    myModal.show();
}

function closeModal() {
    const modalElement = document.getElementById('createUpdateModal');
    const myModal = bootstrap.Modal.getInstance(modalElement);
    if (myModal) {
        myModal.hide();
    }

    if (document.getElementById('modalPrField')) document.getElementById('modalPrField').value = '';
    if (document.getElementById('modalDateField')) document.getElementById('modalDateField').value = '';
    if (document.getElementById('modalDescField')) document.getElementById('modalDescField').value = '';
} 

function resetFields() {
    const pr = document.getElementById('prnumber');
    const date = document.getElementById('prdate');
    const desc = document.getElementById('description');
    if(pr) pr.readOnly = true;
    if(date) date.readOnly = true;
    if(desc) desc.readOnly = true;
}

function savePurchase() {
    const pr = document.getElementById('modalPrField').value;
    const dateVal = document.getElementById('modalDateField').value;
    const desc = document.getElementById('modalDescField').value;

    const actionType = document.getElementById('createUpdateModal').getAttribute('data-current-action');
    const table = $('#purchaseTable').DataTable();

    if (actionType === 'delete') {
        const activeRow = document.querySelector('#purchaseBody tr.table-active');
        if (activeRow) {
            table.row(activeRow).remove().draw(false);
            showNotification('Purchase Request Deleted!', 'delete');
        }

        document.getElementById('btnEditAction').disabled = true;
        document.getElementById('btnDeleteAction').disabled = true;
        selectedPRData = null;

        closeModal();
        return; 
    }

    if ((actionType === 'edit' && !pr) || !dateVal || !desc) {
        showNotification("Please fill out all required fields.", 'error');
        return;
    }

    if (actionType === 'add') {
        table.row.add([
            "TBD",
            dateVal,
            desc
        ]).draw(false);
        showNotification('Purchase Request Added!', 'success');
    } 

    else if (actionType === 'edit') {
        const activeRow = document.querySelector('#purchaseBody tr.table-active');
        if (activeRow) {
            table.row(activeRow).data([pr, dateVal, desc]).draw(false);
            showNotification('Purchase Request Updated!', 'success');
        }
    }

    closeModal();
}

// === ITEM INVENTORY LOGIC ===
let selectedItemData = null;

function setupItemRowHighlight() {
    const tbody = document.getElementById('itemBody');
    const btnEdit = document.getElementById('btnEditItemAction');
    const btnDelete = document.getElementById('btnDeleteItemAction');

    if (!tbody) return;

    tbody.addEventListener('click', function(e) {
        const targetRow = e.target.closest('tr');
        if (!targetRow) return;

        const allRows = tbody.querySelectorAll('tr');
        allRows.forEach(row => row.classList.remove('table-active'));

        targetRow.classList.add('table-active');
        btnEdit.disabled = false;
        btnDelete.disabled = false;

        const cells = targetRow.querySelectorAll('td');
        selectedItemData = {
            serial: cells[0].innerText,
            name: cells[1].innerText,
            status: cells[2].innerText,
            date: cells[3].innerText,
            remarks: cells[4].innerText
        };
    });

    document.addEventListener('click', function(e) {
        if (tbody.contains(e.target) || 
            e.target.closest('#btnEditItemAction') || 
            e.target.closest('#btnDeleteItemAction') ||
            e.target.closest('.modal')) {
            return;
        }
        const allRows = tbody.querySelectorAll('tr');
        allRows.forEach(row => row.classList.remove('table-active'));
        btnEdit.disabled = true;
        btnDelete.disabled = true;
        selectedItemData = null;
    });
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

    [serialField, nameField, statusField, dateField, remarksField].forEach(el => { el.readOnly = false; el.disabled = false; });

    if (actionType === 'add') {
        title.textContent = "Add Inventory Item";
        serialLabel.textContent = "Purchase Number:";
        serialField.placeholder = "Enter PR Number...";
        serialField.value = ""; nameField.value = ""; statusField.value = "Working"; dateField.value = ""; remarksField.value = "";
        
        saveBtn.textContent = "Save";
        saveBtn.className = "btn btn-success px-4";
        cancelBtn.textContent = "Cancel";
        cancelBtn.className = "btn btn-danger px-4";
        
    } else if (actionType === 'edit') {
        title.textContent = "Edit Inventory Item";
        serialLabel.textContent = "Serial Number:";
        serialField.value = selectedItemData.serial;
        nameField.value = selectedItemData.name;
        statusField.value = selectedItemData.status;
        dateField.value = selectedItemData.date;
        remarksField.value = selectedItemData.remarks;
        serialField.readOnly = true; 

        saveBtn.textContent = "Save Changes";
        saveBtn.className = "btn btn-success px-4";
        cancelBtn.textContent = "Cancel";
        cancelBtn.className = "btn btn-danger px-4";

    } else if (actionType === 'delete') {
        title.textContent = "Delete Inventory Item";
        serialLabel.textContent = "Serial Number:"; 
        serialField.value = selectedItemData.serial;
        nameField.value = selectedItemData.name;
        statusField.value = selectedItemData.status;
        dateField.value = selectedItemData.date;
        remarksField.value = selectedItemData.remarks;

        [serialField, nameField, statusField, dateField, remarksField].forEach(el => {
            el.readOnly = true;
            if (el.tagName === 'SELECT') el.disabled = true;
        });

        saveBtn.textContent = "Delete";
        saveBtn.className = "btn btn-danger px-4";
        cancelBtn.textContent = "Cancel";
        cancelBtn.className = "btn btn-secondary px-4";
    }

    const modalElement = document.getElementById('itemActionModal');
    const myModal = bootstrap.Modal.getOrCreateInstance(modalElement);
    myModal.show();
}

function closeItemModal() {
    const modalElement = document.getElementById('itemActionModal');
    const myModal = bootstrap.Modal.getInstance(modalElement);
    if (myModal) myModal.hide();
}

function saveItemRecord() {
    const inputId = document.getElementById('modalItemSerial').value;
    const name = document.getElementById('modalItemName').value;
    const status = document.getElementById('modalItemStatus').value;
    const date = document.getElementById('modalItemDate').value;
    const remarks = document.getElementById('modalItemRemarks').value;

    const actionType = document.getElementById('itemActionModal').getAttribute('data-current-action');
    const table = $('#itemTable').DataTable();

    if (actionType === 'delete') {
        const activeRow = document.querySelector('#itemBody tr.table-active');
        if (activeRow) {
            table.row(activeRow).remove().draw(false);
            showNotification('Item Record Deleted!', 'delete');
        }
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
        const generatedSerial = `${inputId}-001`; 
        table.row.add([generatedSerial, name, statusHtml, date, remarks]).draw(false);
        showNotification('Item Record Added!', 'success');
        
    } else if (actionType === 'edit') {
        const activeRow = document.querySelector('#itemBody tr.table-active');
        if (activeRow) {
            table.row(activeRow).data([inputId, name, statusHtml, date, remarks]).draw(false);
            showNotification('Item Record Updated!', 'success');
        }
    }
    
    closeItemModal();
}

// === ITEM STATUS LOGIC ===
let selectedMonData = null;

function setupMonRowHighlight() {
    const tbody = document.getElementById('monitorBody');
    const btnEdit = document.getElementById('btnEditMonAction');
    const btnDelete = document.getElementById('btnDeleteMonAction');

    if (!tbody) return;

    tbody.addEventListener('click', function(e) {
        const targetRow = e.target.closest('tr');
        if (!targetRow) return;

        const allRows = tbody.querySelectorAll('tr');
        allRows.forEach(row => row.classList.remove('table-active'));

        targetRow.classList.add('table-active');
        btnEdit.disabled = false;
        btnDelete.disabled = false;

        const cells = targetRow.querySelectorAll('td');
        selectedMonData = {
            id: cells[0].innerText,
            serial: cells[1].innerText,
            name: cells[2].innerText,
            personnel: cells[3].innerText,
            division: cells[4].innerText,
            section: cells[5].innerText,
            date: cells[6].innerText
        };
    });

    document.addEventListener('click', function(e) {
        if (tbody.contains(e.target) || e.target.closest('#btnEditMonAction') || e.target.closest('#btnDeleteMonAction') || e.target.closest('.modal')) { return; }
        const allRows = tbody.querySelectorAll('tr');
        allRows.forEach(row => row.classList.remove('table-active'));
        btnEdit.disabled = true;
        btnDelete.disabled = true;
        selectedMonData = null;
    });
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
        title.textContent = "Add Status Record";
        idContainer.style.display = 'none'; 
        nameContainer.style.display = 'none';
        
        serialField.value = ""; personnelField.value = ""; divisionField.value = "NCR"; sectionField.value = "ICT"; dateField.value = "";
        
        saveBtn.textContent = "Save";
        saveBtn.className = "btn btn-success px-4";
        cancelBtn.textContent = "Cancel";
        cancelBtn.className = "btn btn-danger px-4";
        
    } else if (actionType === 'edit') {
        title.textContent = "Edit Status Record";
        idContainer.style.display = 'block';
        nameContainer.style.display = 'block'; 
        
        idField.value = selectedMonData.id;
        serialField.value = selectedMonData.serial;
        nameField.value = selectedMonData.name;
        personnelField.value = selectedMonData.personnel;
        divisionField.value = selectedMonData.division;
        sectionField.value = selectedMonData.section;
        dateField.value = selectedMonData.date;
        
        serialField.readOnly = true;

        saveBtn.textContent = "Save Changes";
        saveBtn.className = "btn btn-success px-4";
        cancelBtn.textContent = "Cancel";
        cancelBtn.className = "btn btn-danger px-4";

    } else if (actionType === 'delete') {
        title.textContent = "Delete Status Record";
        idContainer.style.display = 'block';
        nameContainer.style.display = 'block';
        
        idField.value = selectedMonData.id;
        serialField.value = selectedMonData.serial;
        nameField.value = selectedMonData.name;
        personnelField.value = selectedMonData.personnel;
        divisionField.value = selectedMonData.division;
        sectionField.value = selectedMonData.section;
        dateField.value = selectedMonData.date;

        [serialField, personnelField, dateField].forEach(el => el.readOnly = true);
        [divisionField, sectionField].forEach(el => el.disabled = true);

        saveBtn.textContent = "Delete";
        saveBtn.className = "btn btn-danger px-4";
        cancelBtn.textContent = "Cancel";
        cancelBtn.className = "btn btn-secondary px-4";
    }

    const modalElement = document.getElementById('monActionModal');
    const myModal = bootstrap.Modal.getOrCreateInstance(modalElement);
    myModal.show();
}

function closeMonModal() {
    const modalElement = document.getElementById('monActionModal');
    const myModal = bootstrap.Modal.getInstance(modalElement);
    if (myModal) myModal.hide();
}

// --- SIMULATED DATABASE FETCH ---
// Wrapped in an 'if' statement so it doesn't break other pages!
    const serialInput = document.getElementById('modalMonSerial');
    if (serialInput) {
        serialInput.addEventListener('input', function(e) {
            const serialVal = e.target.value.trim();
            const nameContainer = document.getElementById('monNameContainer');
            const nameField = document.getElementById('modalMonName');
            const actionType = document.getElementById('monActionModal').getAttribute('data-current-action');

            if (actionType === 'add') {
                if (serialVal.length >= 4) { 
                    nameContainer.style.display = 'block';
                    nameField.value = `Dell Optiplex 7000 (Matched: ${serialVal})`;
                } else {
                    nameContainer.style.display = 'none';
                    nameField.value = "";
                }
            }
        });
    }

function saveMonRecord() {
    const id = document.getElementById('modalMonId').value;
    
    // 1. We add .trim() to ensure spaces aren't counted as valid text!
    const serial = document.getElementById('modalMonSerial').value.trim();
    const name = document.getElementById('modalMonName').value.trim();
    const personnel = document.getElementById('modalMonPersonnel').value.trim();
    const division = document.getElementById('modalMonDivision').value;
    const section = document.getElementById('modalMonSection').value;
    const date = document.getElementById('modalMonDate').value;

    const actionType = document.getElementById('monActionModal').getAttribute('data-current-action');
    const table = $('#monitorTable').DataTable();

    if (actionType === 'delete') {
        const activeRow = document.querySelector('#monitorBody tr.table-active');
        if (activeRow) {
            table.row(activeRow).remove().draw(false);
            showNotification('Status Record Deleted!', 'delete');
        }
        document.getElementById('btnEditMonAction').disabled = true;
        document.getElementById('btnDeleteMonAction').disabled = true;
        selectedMonData = null;
        closeMonModal();
        return; 
    }

    if (!serial || !personnel || !date) {
        showNotification("Please fill out all required fields.", 'error');
        return;
    }

    if (actionType === 'add' && !name) {
        showNotification("Please enter a valid Serial Number to fetch an Item.", 'error');
        return;
    }

    if (actionType === 'add') {
        table.row.add(["TBD", serial, name, personnel, division, section, date]).draw(false);
        showNotification('Status Record Added!', 'success');
        
    } else if (actionType === 'edit') {
        const activeRow = document.querySelector('#monitorBody tr.table-active');
        if (activeRow) {
            table.row(activeRow).data([id, serial, selectedMonData.name, personnel, division, section, date]).draw(false);
            showNotification('Status Record Updated!', 'success');
        }
    }
    
    closeMonModal();
}

// === INITIALIZE DATATABLES ===
$(document).ready(function() {
    $('#purchaseTable').DataTable({
        "scrollX": true,
        "order": [[1, "desc"]],
        "autoWidth": false,
        "columnDefs": [
            { "width": "20%", "targets": 0, "className": "text-start"},
            { "width": "20%", "targets": 1, "className": "text-center"},
            { "width": "60%", "targets": 2, "className": "text-start" },
        ]
    });

    $('#itemTable').DataTable({
        "scrollX": true,
        "order": [[3, "desc"]],
        "autoWidth": false,
        "columnDefs": [
            { "width": "12%", "targets": 0, "className": "text-start" },
            { "width": "25%", "targets": 1, "className": "text-start" },
            { "width": "12%", "targets": 2, "className": "text-center" },
            { "width": "12%", "targets": 3, "className": "text-center" },
            { "width": "39%", "targets": 4, "className": "text-start" }
        ]
    });

    $('#monitorTable').DataTable({
        "scrollX": true,
        "order": [[6, "desc"]],
        "autoWidth": false,
        "columnDefs": [
            { "width": "8%", "targets": 0, "className": "text-center" },
            { "width": "14%", "targets": 1, "className": "text-start" },
            { "width": "20%", "targets": 2, "className": "text-start" },
            { "width": "20%", "targets": 3, "className": "text-start" },
            { "width": "14%", "targets": 4, "className": "text-center" },
            { "width": "10%", "targets": 5, "className": "text-center" },
            { "width": "14%", "targets": 6, "className": "text-center" }
        ]
    });
});

// === NOTIFICATIONS & KEYBOARD ===
function showNotification(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div')
    toast.className = `custom-toast ${type}`;

    let icon = 'fa-circle-check';
    let iconColor = '#28a745';
    if (type === 'error') {
        icon = 'fa-circle-exclamation';
        iconColor = '#dc3545';
    }
    if (type === 'delete') {
        icon = 'fa-trash-can';
        iconColor = '#ff9800';
    }

    toast.innerHTML = `<i class="fa-solid ${icon}" style="color: ${iconColor}; font-size: 18px;"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modalElement => {
        modalElement.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                if (event.target.tagName === 'TEXTAREA') return;
                if (event.target.tagName === 'BUTTON') return;

                event.preventDefault();
                const actionBtn = modalElement.querySelector('#btnSaveModal, #btnSaveItem, #btnSaveMon');
                if (actionBtn) actionBtn.click();
            }
        });
    });
});

// === GLOBAL KEYBOARD SHORTCUTS ===
document.addEventListener('keydown', function(event) {
    const activeTag = document.activeElement.tagName.toLowerCase();
    const isTyping = activeTag === 'input' || activeTag === 'textarea';
    const isModalOpen = document.body.classList.contains('modal-open');
    
    const sidebar = document.getElementById('sidebar');
    const isSidebarOpen = sidebar && sidebar.classList.contains('active');

    if (event.key === 'Escape') {
        if (isModalOpen) {
            if (isTyping) {
                event.stopPropagation();
            }
            return; 
        }

        const activeRows = document.querySelectorAll('tbody tr.table-active');
        activeRows.forEach(row => row.classList.remove('table-active'));
        
        document.querySelectorAll('.btn-edit-modern, .btn-delete-modern').forEach(btn => btn.disabled = true);
        
        if (typeof selectedPRData !== 'undefined') selectedPRData = null;
        if (typeof selectedItemData !== 'undefined') selectedItemData = null;
        if (typeof selectedMonData !== 'undefined') selectedMonData = null;

        toggleSidebar();
        return;
    }

    if (isTyping) return;
    
    if (isSidebarOpen) return; 

    if (event.key === '+') {
        event.preventDefault();
        if (document.getElementById('purchaseTable')) openModal('add');
        if (document.getElementById('itemTable')) openItemModal('add');
        if (document.getElementById('monitorTable')) openMonModal('add');
        return;
    }

    if (event.key === 'Enter') {
        if (!isModalOpen) {
            if (selectedPRData && document.getElementById('purchaseTable')) { event.preventDefault(); openModal('edit'); }
            if (selectedItemData && document.getElementById('itemTable')) { event.preventDefault(); openItemModal('edit'); }
            if (selectedMonData && document.getElementById('monitorTable')) { event.preventDefault(); openMonModal('edit'); }
        }
        return;
    }

    if (event.key === 'Backspace' || event.key === 'Delete') {
        if (!isModalOpen) {
            if (selectedPRData && document.getElementById('purchaseTable')) { event.preventDefault(); openModal('delete'); }
            if (selectedItemData && document.getElementById('itemTable')) { event.preventDefault(); openItemModal('delete'); }
            if (selectedMonData && document.getElementById('monitorTable')) { event.preventDefault(); openMonModal('delete'); }
        }
        return;
    }

}, true);