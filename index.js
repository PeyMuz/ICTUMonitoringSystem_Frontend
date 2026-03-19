function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

function showSignup(){
    document.getElementById('log').style.display = 'none';
    document.getElementById('sign').style.display = 'block';
}

function showLogin(){
    document.getElementById('sign').style.display = 'none';
    document.getElementById('log').style.display = 'block';
}

function signup() {
    const name = document.getElementById('signName').value;
    const user = document.getElementById('signUser').value;
    const pos = document.getElementById('signPosition').value;
    const pass = document.getElementById('signPass').value;
    const confirm = document.getElementById('signConfirm').value;

    if (!name || !user || !pos || !pass || !confirm) {
        alert('Please fill in all fields.');
        return;
    }

    if (pass !== confirm) {
        alert('Passwords do not match. Try again.');
        return;
    }

    const account = { name: name, username: user, position: pos, password: pass };
    localStorage.setItem('ictu_user_' + user, JSON.stringify(account));
    alert('Sign up successful! You can now log in.');

    document.getElementById('signName').value = '';
    document.getElementById('signUser').value = '';
    document.getElementById('signPosition').value = '';
    document.getElementById('signPass').value = '';
    document.getElementById('signConfirm').value = '';

    showLogin();
}

function login() {
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;

    if (!user || !pass) {
        alert('Please enter both username and password.');
        return;
    }

    const savedUserStr = localStorage.getItem('ictu_user_'+user);

    if (savedUserStr) {
        const savedUser = JSON.parse(savedUserStr);
        if (savedUser.password === pass){
            localStorage.setItem('activeUser', JSON.stringify(savedUser));
            window.location.href = "inside.html";
        }else {
            alert("Incorrect password");
        }
    }else{
        alert("User not found. Please sign up first.");
    }
}

function logout() {
    localStorage.removeItem('activeUser');
    window.location.href = "log.html";
}

function loadUser () { 
    const activeUserStr = localStorage.getItem('activeUser');
    if (!activeUserStr) {
        window.location.href = "log.html";
        return;
    }
    const activeUser = JSON.parse(activeUserStr);
    const fullNameEl = document.getElementById('displayFullName');
    const positionEl = document.getElementById('displayPosition');
    const sidebarNameEl = document.getElementById('displaySidebarName');
    
    if (fullNameEl) fullNameEl.innerText = activeUser.name;
    if (positionEl) positionEl.innerText = activeUser.position;
    if (sidebarNameEl) sidebarNameEl.innerText = activeUser.name;
}

function makeEditable(fieldId) {
    const modal = document.querySelector('.modal-overlay[style*="display: flex"]');
    if(!modal) return;
    
    const actionType = modal.getAttribute('data-action');
    if (actionType === 'delete') return; 
    
    if (actionType === 'edit' && (fieldId === 'prnumber' || fieldId === 'serialNumber')) return; 
    
    const selectedField = document.getElementById(fieldId);
    if (selectedField) {
        selectedField.readOnly = false;
        selectedField.focus(); 
    }
}

function openModal(actionType) {
    const modal = document.getElementById('actionModal');
    if (modal) {
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
            if (actionBtn) actionBtn.innerText = 'Save Changes';
            if(prDate) prDate.readOnly = false;
            if(prDesc) prDesc.readOnly = false;
        } else if (actionType === 'edit') {
            if (prRow) prRow.style.display = 'flex'; 
            if (actionBtn) actionBtn.innerText = 'Update Record';
            if(prNum) prNum.readOnly = true;
            if(prDate) prDate.readOnly = false;
            if(prDesc) prDesc.readOnly = false;
        } else if (actionType === 'delete') {
            if (prRow) prRow.style.display = 'flex'; 
            if (actionBtn) actionBtn.innerText = 'Delete Record';
            if(prNum) prNum.readOnly = true;
            if(prDate) prDate.readOnly = true;
            if(prDesc) prDesc.readOnly = true;
        }
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
    if ((!isAddMode && !pr) || !dateVal || !desc) {
        alert("Please fill out all required fields.");
        return;
    }
    
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

    if (category === 'prnumber') {
        searchInput.type = 'number';
        searchInput.placeholder = 'Search...';
    } else if (category === 'prdate') {
        searchInput.type = 'date';
        searchInput.placeholder = '';
    } else {
        searchInput.type = 'text';
        searchInput.placeholder = 'Search...';
    }
}

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
        firstInput.placeholder = "Enter purchase number...";
        actionBtn.innerText = 'Save Changes';
        unlockItemFields(false);
        statusDropdown.disabled = false; 
    } 
    else if (type === 'edit') {
        labelEl.innerText = "Serial Number:";
        firstInput.placeholder = "Enter serial number...";
        actionBtn.innerText = 'Update Record';
        unlockItemFields(false);
        firstInput.readOnly = true; 
        statusDropdown.disabled = false; 
    } 
    else if (type === 'delete') {
        labelEl.innerText = "Serial Number:";
        firstInput.placeholder = "Enter serial number...";
        actionBtn.innerText = 'Delete Record';
        unlockItemFields(true); 
        statusDropdown.disabled = true; 
    }
}

function closeItemModal() {
    document.getElementById('itemModal').style.display = 'none';
}

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
    
    if (!serial || !name || !date) {
        alert("Please fill required fields (Number, Item Name, Date)!");
        return;
    }
    
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

    if (category === '0') {
        searchInput.type = 'number';
        searchInput.placeholder = 'Search...';
    } else if (category === '3') {
        searchInput.type = 'date';
        searchInput.placeholder = ''; // Walang nakasulat kapag date
    } else {
        searchInput.type = 'text';
        searchInput.placeholder = 'Search...';
    }
}