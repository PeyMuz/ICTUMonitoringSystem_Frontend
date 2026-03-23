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
        if (tbody.contains(e.target) || e.target.closest('#btnEditAction') || e.target.closest('#btnDeleteAction')) {
            return;
        }

        const allRows = tbody.querySelectorAll('tr');
        allRows.forEach(row => row.classList.remove('table-active'));

        btnEdit.disabled = true;
        btnDelete.disabled = true;
        selectedPRData = null;
    })
}

function openModal(actionType) {
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
    const modal = document.getElementById('actionModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('prnumber').value = '';
        document.getElementById('prdate').value = '';
        document.getElementById('description').value = '';
        resetFields();
    }
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
    let pr = document.getElementById('prnumber').value;
    const dateVal = document.getElementById('prdate').value; 
    const desc = document.getElementById('description').value;
    const prRow = document.getElementById('prRow');
    const isAddMode = prRow && prRow.style.display === 'none';
    
    if ((!isAddMode && !pr) || !dateVal || !desc) { alert("Please fill out all required fields."); return; }
    if (isAddMode) pr = "TBD"; 
    
    const tbody = document.getElementById('purchaseBody');
    if (tbody) {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${pr}</td><td>${dateVal}</td><td>${desc}</td>`;
        tbody.appendChild(row);
    }
    alert('Purchase Request Saved!');
    closeModal(); 
}

// === ITEM INVENTORY LOGIC ===
function openItemModal(type) {
    const modal = document.getElementById('itemModal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    modal.setAttribute('data-action', type);
    
    const labelEl = document.getElementById('firstFieldLabel');
    const firstInput = document.getElementById('serialNumber');
    const actionBtn = document.getElementById('itemActionBtn');
    const statusDropdown = document.getElementById('itemStatus');

    firstInput.value = "";
    document.getElementById('itemName').value = "";
    document.getElementById('dateChecked').value = "";
    document.getElementById('remarks').value = "";

    if (type === 'add') {
        labelEl.innerText = "Purchase Number:";
        actionBtn.innerText = 'Save Changes';
        unlockItemFields(false);
        statusDropdown.disabled = false; 
    } else if (type === 'edit') {
        labelEl.innerText = "Serial Number:";
        actionBtn.innerText = 'Update Record';
        unlockItemFields(false);
        firstInput.readOnly = true; 
        statusDropdown.disabled = false; 
    } else if (type === 'delete') {
        labelEl.innerText = "Serial Number:";
        actionBtn.innerText = 'Delete Record';
        unlockItemFields(true); 
        statusDropdown.disabled = true; 
    }
}

function closeItemModal() { document.getElementById('itemModal').style.display = 'none'; }

function unlockItemFields(isLocked) {
    document.getElementById('serialNumber').readOnly = isLocked;
    document.getElementById('itemName').readOnly = isLocked;
    document.getElementById('dateChecked').readOnly = isLocked;
    document.getElementById('remarks').readOnly = isLocked;
}

function saveItemRecord() {
    const serial = document.getElementById('serialNumber').value;
    const name = document.getElementById('itemName').value;
    const status = document.getElementById('itemStatus').value;
    const date = document.getElementById('dateChecked').value;
    const rem = document.getElementById('remarks').value;
    
    if (!serial || !name || !date) { alert("Please fill required fields!"); return; }
    
    const tbody = document.getElementById('itemBody');
    const row = document.createElement('tr');
    row.innerHTML = `<td>${serial}</td><td>${name}</td><td>${status}</td><td>${date}</td><td>${rem}</td>`;
    tbody.appendChild(row);
    alert("Item Record Saved!");
    closeItemModal();
}

// === MONITORING ITEM STATUS LOGIC ===
function openMonModal(type) {
    const modal = document.getElementById('monModal');
    if (!modal) return;

    modal.style.display = 'flex';
    modal.setAttribute('data-action', type);

    const actionBtn = document.getElementById('monActionBtn');
    const prInput = document.getElementById('monPr');
    const statusDropdown = document.getElementById('monStatus');

    prInput.value = "";
    document.getElementById('monItem').value = "";
    document.getElementById('monDate').value = "";

    if (type === 'add') {
        actionBtn.innerText = 'Save Changes';
        unlockMonFields(false);
        statusDropdown.disabled = false;
    } else if (type === 'edit') {
        actionBtn.innerText = 'Update Record';
        unlockMonFields(false);
        prInput.readOnly = true; 
        statusDropdown.disabled = false;
    } else if (type === 'delete') {
        actionBtn.innerText = 'Delete Record';
        unlockMonFields(true);
        statusDropdown.disabled = true;
    }
}

function closeMonModal() { document.getElementById('monModal').style.display = 'none'; }

function unlockMonFields(isLocked) {
    document.getElementById('monPr').readOnly = isLocked;
    document.getElementById('monItem').readOnly = isLocked;
    document.getElementById('monDate').readOnly = isLocked;
}

function saveMonRecord() {
    const pr = document.getElementById('monPr').value;
    const item = document.getElementById('monItem').value;
    const status = document.getElementById('monStatus').value;
    const date = document.getElementById('monDate').value;

    if (!pr || !item || !date) { alert("Please fill required fields!"); return; }

    const tbody = document.getElementById('monitorBody');
    const row = document.createElement('tr');
    row.innerHTML = `<td>${pr}</td><td>${item}</td><td>${status}</td><td>${date}</td>`;
    tbody.appendChild(row);

    alert("Status Record Updated!");
    closeMonModal();
}

function executeMonSearch() {
    const input = document.getElementById('monSearchInput').value.toLowerCase();
    const colIndex = document.getElementById('monSearchCategory').value;
    const table = document.getElementById('monitorTable');
    if (!table) return;

    const tr = table.getElementsByTagName('tr');
    for (let i = 1; i < tr.length; i++) {
        let td = tr[i].getElementsByTagName('td')[colIndex];
        if (td) {
            let txtValue = td.textContent || td.innerText;
            tr[i].style.display = txtValue.toLowerCase().indexOf(input) > -1 ? "" : "none";
        }
    }
}

function updateMonSearchType() {
    const category = document.getElementById('monSearchCategory').value;
    const searchInput = document.getElementById('monSearchInput');
    if (!searchInput) return;

    searchInput.value = '';
    executeMonSearch();

    if (category === '0') { searchInput.type = 'number'; } 
    else if (category === '3') { searchInput.type = 'date'; } 
    else { searchInput.type = 'text'; }
    searchInput.placeholder = 'Search...'; 
}

// === INITIALIZE DATATABLES ===
$(document).ready(function() {
    $('#purchaseTable').DataTable({
        "scrollX": true,
        "order": [[1, "desc"]],
        "autoWidth": false,
        "columnDefs": [
            { "width": "20%", "targets": 0 },
            { "width": "20%", "targets": 1 },
            { "width": "60%", "targets": 2 },
        ]
    });
});