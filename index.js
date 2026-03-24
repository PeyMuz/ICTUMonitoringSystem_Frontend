function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('active');
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
    if (isDark) { document.body.classList.add('dark-mode'); } 
    else { document.body.classList.remove('dark-mode'); }
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
    const activeUserStr = localStorage.getItem('activeUser');
    if (!activeUserStr) { window.location.href = "log.html"; return; }
    const activeUser = JSON.parse(activeUserStr);
    if (document.getElementById('displayFullName')) document.getElementById('displayFullName').innerText = activeUser.name;
    if (document.getElementById('displayPosition')) document.getElementById('displayPosition').innerText = activeUser.position;
    if (document.getElementById('displaySidebarName')) document.getElementById('displaySidebarName').innerText = activeUser.name;
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
function openModal(actionType) {
    const modal = document.getElementById('actionModal');
    if (!modal) return;
    modal.style.display = 'flex';
    modal.setAttribute('data-action', actionType); 
    resetFields();
    const prRow = document.getElementById('prRow');
    const actionBtn = document.getElementById('modalActionBtn');
    const prNum = document.getElementById('prnumber');
    const prDate = document.getElementById('prdate');
    const prDesc = document.getElementById('description');
    
    if (actionType === 'add') {
        if (prRow) prRow.style.display = 'none'; 
        actionBtn.innerText = 'Save Changes';
        if(prDate) prDate.readOnly = false;
        if(prDesc) prDesc.readOnly = false;
    } else if (actionType === 'edit') {
        if (prRow) prRow.style.display = 'flex'; 
        actionBtn.innerText = 'Update Record';
        if(prNum) prNum.readOnly = true;
        if(prDate) prDate.readOnly = false;
        if(prDesc) prDesc.readOnly = false;
    } else if (actionType === 'delete') {
        if (prRow) prRow.style.display = 'flex'; 
        actionBtn.innerText = 'Delete Record';
        if(prNum) prNum.readOnly = true;
        if(prDate) prDate.readOnly = true;
        if(prDesc) prDesc.readOnly = true;
    }
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
function executeSearch() {
    const input = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('searchCategory').value;
    const table = document.getElementById('purchaseTable');
    if (!table) return;
    const tr = table.getElementsByTagName('tr');
    let colIndex = 0; 
    if (category === 'prdate') colIndex = 1;
    if (category === 'description') colIndex = 2;
    for (let i = 1; i < tr.length; i++) { 
        let td = tr[i].getElementsByTagName('td')[colIndex];
        if (td) {
            let txtValue = td.textContent || td.innerText;
            tr[i].style.display = txtValue.toLowerCase().indexOf(input) > -1 ? "" : "none";
        }       
    }
}
function updateSearchType() {
    const category = document.getElementById('searchCategory').value;
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    searchInput.value = ''; 
    executeSearch();
    if (category === 'prnumber') { searchInput.type = 'number'; } 
    else if (category === 'prdate') { searchInput.type = 'date'; } 
    else { searchInput.type = 'text'; }
    searchInput.placeholder = 'Search...';
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
function executeItemSearch() {
    const input = document.getElementById('itemSearchInput').value.toLowerCase();
    const colIndex = document.getElementById('itemSearchCategory').value;
    const table = document.getElementById('itemTable');
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
function updateItemSearchType() {
    const category = document.getElementById('itemSearchCategory').value;
    const searchInput = document.getElementById('itemSearchInput');
    if (!searchInput) return;
    searchInput.value = ''; 
    executeItemSearch();
    if (category === '0') { searchInput.type = 'number'; } 
    else if (category === '3') { searchInput.type = 'date'; } 
    else { searchInput.type = 'text'; }
    searchInput.placeholder = 'Search...';
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