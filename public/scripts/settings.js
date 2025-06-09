const settingsPanel = document.getElementById("settings-panel");
const settingsButton = document.getElementById("settings");

const settingsBody = document.getElementById("settings-body");
const settingsHeader = document.getElementById("settings-header");

const settingsCategories = document.getElementById("settings-categories");
const categories = document.querySelectorAll(".category");

const categoryTitle = document.getElementById("category-title");

const settingsBodyShadow = document.getElementById("settings-body-shadow");
const settingsCategoryShadow = document.getElementById("settings-category-shadow");

const settingsOverlay = document.getElementById("settings-overlay");
const subOverlay = document.getElementById("sub-popup-overlay");

const settingsUsername = document.getElementById("settings-username");

const usernameIdentifier = document.getElementById("input-username-identifier");
const inputUsername = document.getElementById("input-username");
const changeUsername = document.getElementById("change-username-button");

const confirmUsername = document.getElementById("confirm-username");
const cancelUsername = document.getElementById("cancel-username");

const changeUsernamePanel = document.getElementById("change-username-panel");
const deleteAccountPanel = document.getElementById("delete-account-panel");

const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("input-account-username");
const passwordInput = document.getElementById("input-account-password");
const confirmPasswordInput = document.getElementById("input-account-confirm-password");

const accountDetails = document.getElementById("account-details");
const createAccountOption = document.getElementById("create-account-option");
const loginSignupHeader = document.getElementById("login-signup-header");
const submitButton = document.getElementById("submit-button");
const loggedInUsername = document.getElementById("logged-in-username");
const deleteAccount = document.getElementById("delete-account");
const confDeleteAccount = document.getElementById("confirm-delete-account-btn");
const deleteAccountInput = document.getElementById("password-delete-account");

const minIdentifierLength = 4;
const maxIdentifierLength = 6;

const maxNameLength = 8;
const minNameLength = 4;

var newUserId;
var createAccount = false;
var settingsOpen = false;
var subPopupOpen = false;
var changeUserIdOpen = false;
var deleteAccountOpen = false;
var accountUsername = null;

settingsButton.addEventListener("click", () => {
    settingsOpen = !settingsOpen;
    toggleSettings();
});

window.addEventListener("resize", () => {
    if (window.innerWidth < window.innerHeight) {

    }
});

for (let overlay of document.querySelectorAll(".overlay")) {
    overlay.addEventListener('click', (e) => {
        if (changeUserIdOpen) {
            if (!changeUsernamePanel.contains(e.target) && !changeUsername.contains(e.target)) {
                changeUserIdOpen = false;
                toggleChangeUserId();
            }
        } else if (deleteAccountOpen) {
            if (!deleteAccountPanel.contains(e.target) && !deleteAccount.contains(e.target)) {
                deleteAccountOpen = false;
                toggleDeleteAccount();
            }
        } else if (!settingsButton.contains(e.target) && !settingsPanel.contains(e.target)) {
            settingsOpen = false;
            toggleSettings();
        }
    });
}

window.resizeSettings = function () {
    settingsBody.style.height = `${settingsPanel.offsetHeight - settingsHeader.offsetHeight}px`;
    //settingsCategories.style.paddingTop = `${settingsHeader.offsetHeight}px`;
    settingsCategories.style.height = `${settingsPanel.offsetHeight - settingsHeader.offsetHeight}px`;
    settingsBodyShadow.style.transform = `translateY(${settingsHeader.offsetHeight - 0.5}px)`;
}

document.addEventListener("DOMContentLoaded", function () {
    window.resizeSettings();

    window.addEventListener("resize", window.resizeSettings);
});

settingsCategories.addEventListener("scroll", () => {
    settingsCategoryShadow.style.display = settingsCategories.scrollTop < 1 ? "none" : "block";
});

settingsBody.addEventListener("scroll", () => {
    settingsBodyShadow.style.display = settingsBody.scrollTop < 1 ? "none" : "block";
});

document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        if (changeUserIdOpen) {
            changeUserIdOpen = false;
            toggleChangeUserId();
            return;
        } else if (deleteAccountOpen) {
            deleteAccountOpen = false;
            toggleDeleteAccount();
        } else {
            settingsOpen = false;
            toggleSettings();
        }
    }
});

function showCategory(index) {
    const settingsContent = document.querySelectorAll(".settings-content");
    categories.forEach(el => el.classList.remove("selected"));

    settingsContent.forEach(content => {
        content.style.display = "none";
    });

    categoryTitle.textContent = categories[index].textContent;
    settingsContent[index].style.display = "flex";
    categories[index].classList.add("selected");
}

function setupSettings() {
    categories.forEach((category, index) => {
        category.addEventListener("click", () => {
            showCategory(index);
        });
    });
}

usernameIdentifier.addEventListener("input", function (event) {
    let value = parseFloat(this.value);

    this.value = this.value.replace(/[^0-9]/g, '');

    if (value.length > maxIdentifierLength) {
        this.value = value.slice(0, maxIdentifierLength);
    }
});

usernameIdentifier.addEventListener("blur", function () {
    let value = parseFloat(this.value);

    if (value.length < minIdentifierLength || !value) {
        this.value = this.value.slice(0, this.value.length);
        while (this.value.length < minIdentifierLength) {
            this.value = `${this.value}0`;
        }
    } else if (value.length > maxIdentifierLength) {
        this.value = value.slice(0, maxIdentifierLength);
    }
});

inputUsername.addEventListener("input", function (event) {
    this.value = this.value.replace(/[^a-zA-Z0-9_]/g, '');
});

inputUsername.addEventListener("blur", function () {
    if (this.value.length < minNameLength) {
        while (this.value < minNameLength) {
            let random = Math.random();
            minNameLength = `${minNameLength}${random}`;
        }
    }
});

changeUsername.addEventListener("click", () => {
    changeUserIdOpen = true;
    toggleChangeUserId();
});

cancelUsername.addEventListener("click", () => {
    changeUserIdOpen = false;
    let userIdExtract = userId.split('#');

    inputUsername.value = userIdExtract[0];
    usernameIdentifier.value = userIdExtract[1];
    toggleChangeUserId();
});

confirmUsername.addEventListener("click", () => {
    newUserId = `${inputUsername.value}#${usernameIdentifier.value}`;
    //console.log(newUserId);

    if (newUserId === userId) {
        changeUserIdOpen = false;
        toggleChangeUserId();
        return;
    }

    socket.send(JSON.stringify({ type: "userIdTaken", newUserId: newUserId, oldUserId: userId, username: accountUsername, token: token }));
});

deleteAccount.addEventListener("click", () => {
    if (accountUsername) {
        deleteAccountOpen = true;
        toggleDeleteAccount();
    }
});

deleteAccountInput.addEventListener("input", () => {
    if (deleteAccountInput.value.trim() === "") {
        confDeleteAccount.classList.add("unavailable");
        confDeleteAccount.classList.remove("available");
    } else {
        confDeleteAccount.classList.remove("unavailable");
        confDeleteAccount.classList.add("available");
    }
});

confDeleteAccount.addEventListener("click", () => {
    if (deleteAccountOpen && accountUsername &&
        deleteAccountInput.value.trim() !== ""
    ) {
        socket.send(JSON.stringify({
            type: "deleteAccount",
            username: accountUsername,
            password: deleteAccountInput.value,
            token: token
        }));

        deleteAccountInput.value = "";
    }
});

loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (accountUsername) {
        socket.send(JSON.stringify({ type: "logout", userId: userId, token: token }));

        return;
    }

    const username = usernameInput.value;
    const password = passwordInput.value;

    if (!username.trim() || !password.trim()) {
        console.warn("Fill out both input fields");
        return;
    }

    if (password !== confirmPasswordInput.value && createAccount) {
        console.warn("confirmed password does not match");
        return;
    }

    if (createAccount) {
        socket.send(JSON.stringify({ type: "signup", username: username, password: password, senderId: userId, token: token }));
        createAccount = false;
        toggleCreateAccount();
    } else {
        socket.send(JSON.stringify({ type: "login", username: username, password: password, senderId: userId, token: token }));
    }

    usernameInput.value = "";
    passwordInput.value = "";
});

createAccountOption.addEventListener("click", () => {
    createAccount = !createAccount;
    usernameInput.value = "";
    passwordInput.value = "";
    confirmPasswordInput.value = "";

    toggleCreateAccount();
});

function toggleCreateAccount() {
    createAccountOption.style.visibility = "visible";
    usernameInput.style.display = "flex";
    passwordInput.style.display = "flex";
    accountDetails.style.display = "none";
    if (createAccount) {
        createAccountOption.textContent = "or log in...";
        loginSignupHeader.textContent = "Sign up";
        submitButton.textContent = "Sign up";
        confirmPasswordInput.style.display = "flex";
        deleteAccount.style.visibility = "hidden";
    } else {
        if (accountUsername) {
            createAccountOption.style.visibility = "hidden";
            loginSignupHeader.textContent = "Account Details";
            submitButton.textContent = "Log out";
            usernameInput.style.display = "none";
            passwordInput.style.display = "none";
            accountDetails.style.display = "block";
            deleteAccount.style.visibility = "visible";
        } else {
            createAccountOption.textContent = "or sign up now...";
            loginSignupHeader.textContent = "Log in";
            submitButton.textContent = "Log in";
            confirmPasswordInput.style.display = "none";
            deleteAccount.style.visibility = "hidden";
        }
    }
}

function toggleSettings() {
    if (settingsOpen) {
        if (!settingsPanel.classList.contains("open")) {
            settingsPanel.classList.add("open");
        }
        settingsUsername.textContent = `${userId}`;

        settingsOverlay.style.display = "block";

        if (!settingsPanel.classList.contains("open")) {
            changeUsernamePanel.classList.remove("open");
            createAccount = false;
        }
    } else {
        settingsOverlay.style.display = "none";
        subOverlay.style.display = "none";

        settingsPanel.classList.remove("open");
        changeUsernamePanel.classList.remove("open");

        createAccount = false;
    }
}

function toggleChangeUserId() {
    if (changeUserIdOpen) {
        if (!changeUsernamePanel.classList.contains("open")) {
            changeUsernamePanel.classList.add("open");
        }
        subOverlay.style.display = "block";
    } else {
        changeUsernamePanel.classList.remove("open");
        subOverlay.style.display = "none";
    }
}

function toggleDeleteAccount() {
    if (deleteAccountOpen) {
        if (!deleteAccountPanel.classList.contains("open")) {
            deleteAccountPanel.classList.add("open");
        }
        subOverlay.style.display = "block";
    } else {
        deleteAccountPanel.classList.remove("open");
        subOverlay.style.display = "none";
    }
}

setupSettings();
showCategory(0);
toggleCreateAccount();
