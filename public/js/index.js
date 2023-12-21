function launch(){
  if (!window.ethereum) {
    console.log("PLEASE INSTALL METAMASK!!");
  }
  else{
    console.log(window.ethereum.selectedAddress + " " + "logged in");
    document.getElementById("btn-login").style.display = 'none'; // Hide connect button
    document.getElementById("btn-logout").style.display = 'block'; // Show disconnect button
  }
}

async function login() {
if (!window.ethereum) {
  console.log("PLEASE INSTALL METAMASK!!");
  return;
}

try {
  // Check if MetaMask is already connected
  if (window.ethereum.selectedAddress) {
    // MetaMask is already connected
    launch();
    window.location.replace("/bet.html");
  } else {
    // Request account access
    await window.ethereum.enable();
    launch();
    window.location.replace("/bet.html");
  }
} catch (error) {
  // User denied account access...
  console.error("User denied account access");
}
}

async function logOut() {
// There's no logout function with window.ethereum, you can just reload the page
console.log("logged out");
document.getElementById("btn-login").style.display = 'block'; // Show connect button
document.getElementById("btn-logout").style.display = 'none'; // Hide disconnect button
location.reload();
}

document.getElementById("btn-login").onclick = login;
document.getElementById("btn-logout").onclick = logOut;