// For burger menu toggle
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar.classList.toggle('active')) {
 }
}

// for Log in and sign up

function showSingUp(){
    document.getElementById('log').style.display = 'none';
    document.getElementById('sign').style.display = 'block';
}

function showLogIn(){
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

// Save user Localstorage
const account = {
    name: name,
    user: user,
    pos: pos,
    pass: pass
};

localStorage.setItem('ictu_user_' + user, JSON.stringify(account));

alert('Sign up successful! You can now log in.');


document.getElementById('signName').value = '';
document.getElementById('signUser').value = '';
document.getElementById('signPosition').value = '';
document.getElementById('signPass').value = '';
document.getElementById('signConfirm').value = '';

showLogIn();

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
            //Save active session
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


//For Dashboard (inside.html)


function loaduser () { //to load the file of inside.html
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

    // Random comment goes here
}

//for monitor.html

function addRecord(){
    const prNumber = document.getElementById('monPr').value;
    const itemName = document.getElementById('monItem').value;
    const status = document.getElementById('status').value;
    const dateChecked = document.getElementById('datechecked').value;

    if (!prNumber || !itemName || !dateChecked) {
       alert("Please fill out the ");
    }

}