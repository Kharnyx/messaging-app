// public/scripts/script.js
// Get DOM elements for various parts of the chat UI
const chatConversations = document.getElementById("chat-conversations");
const chatArea = document.getElementById("chat-area");
const chatBody = document.getElementById("chat-body");
const chatFooter = document.getElementById("chat-footer");
const chatHeader = document.getElementById("chat-header");
const chatShadow = document.getElementById("chat-shadow");
const chatFooterChat = document.querySelector("#chat-footer .chat");

const inputGroupContainers = document.querySelectorAll('.input-group-container');
const messageInput = document.getElementById("chat-message-input");
const sendMessageBtn = document.getElementById("send-message");

const fileInput = document.getElementById("file-input");
const selectFileButton = document.getElementById("attach-file");
const attachedFiles = document.getElementById("attached-files");
const fileInformation = document.getElementById("file-information");

const conversationHeader = document.getElementById("chat-conversations-header");
const conversationParent = document.getElementById("conversation-parent");

const conversationShadow = document.getElementById("conversation-shadow");

const openConversationsButton = document.getElementById("open-conversations"),
  closeConversationsButton = document.getElementById("close-conversations");
let conversationsOpen = false;

// Get CSS variables and calculate border width
const root = document.documentElement;
const computedStyle = getComputedStyle(root);
const conversationsWidth = computedStyle.getPropertyValue("--conversations-width").trim();
const borderWidth =
  parseFloat(computedStyle.getPropertyValue("--border-width")) *
  parseFloat(getComputedStyle(document.documentElement).fontSize);

let previewFileProgressBarFill = [];
let isPortraitMode = window.innerWidth < window.innerHeight;
// Dynamically update layout dimensions based on window size and conversation visibility
window.updateElementDimensions = function () {
  isPortraitMode = window.innerWidth < window.innerHeight;
  if (isPortraitMode) {
    // If in portrait mode, hide conversations sidebar
    root.style.setProperty("--conversations-width", chatConversations.style.width);
    chatConversations.classList.add("innactive");
    chatConversations.classList.remove("active");
    chatConversations.style.width = "0";
    chatConversations.style.display = "none";


    root.style.setProperty("--settings-categories-width", "0%");
    settingsCategories.style.display = "none";
  } else {
    // Show conversation sidebar in landscape mode
    chatConversations.classList.remove("innactive");
    chatConversations.classList.add("active");
    root.style.setProperty("--conversations-width", "28.12vw");
    chatConversations.style.display = "block";
    chatConversations.style.width = conversationsWidth;
    chatConversations.style.opacity = "1";


    root.style.setProperty("--settings-categories-width", "30%");
    settingsCategories.style.display = "flex";
  }

  chatArea.style.display = "block";

  // Adjust height for conversation and chat sections
  conversationParent.style.height = `${window.innerHeight - conversationHeader.offsetHeight}px`;
  chatBody.style.height = `${window.innerHeight - chatFooter.offsetHeight - chatHeader.offsetHeight}px`;

  // Align shadows with headers
  chatShadow.style.transform = `translateY(${chatHeader.offsetHeight}px)`;
  conversationShadow.style.transform = `translateY(${conversationHeader.offsetHeight}px)`;

  let newWidth = `${window.innerWidth - chatConversations.offsetWidth}px`;
  messageInput.style.width = `${700 + window.innerWidth - chatConversations.offsetWidth - 800 - 110}px`;

  // Show/hide conversation chevrons based on state
  let conversationChevrons = document.getElementsByClassName("conversation-chevron");
  for (let chevron of conversationChevrons) {
    chevron.style.display = conversationsOpen ? "block" : "none";
  }

  // Hide open/close buttons by default
  closeConversationsButton.style.visibility = "hidden";
  openConversationsButton.style.visibility = "hidden";

  openSettingsContentBtn.style.visibility = "hidden";
  closeSettingsContentBtn.style.visibility = "hidden";

  if (isPortraitMode) {
    // Handle mobile full-width sidebar toggle
    if (conversationsOpen) {
      chatArea.style.display = "none";
      chatConversations.style.display = "block";
      chatConversations.style.width = "100vw";
      root.style.setProperty("--conversations-width", "100vw");
      chatConversations.classList.add("active");
      chatConversations.classList.remove("innactive");
      closeConversationsButton.style.visibility = "visible";
    } else {
      newWidth = "100vw";
      chatFooter.style.width = "100vw";
      root.style.setProperty("--conversations-width", "0");
      openConversationsButton.style.visibility = "visible";
      chatConversations.style.display = "none";
    }
  } else {
    conversationsOpen = false;
    newWidth = `${window.innerWidth - chatConversations.offsetWidth}px`;
    chatFooter.style.width = newWidth;
  }

  if (isPortraitMode) {
    if (settingsContentOpen) {
      settingsCategories.style.display = "none";
      settingsBody.style.display = "flex";

      openSettingsContentBtn.style.visibility = "hidden";
      closeSettingsContentBtn.style.visibility = "visible";
    } else {
      settingsCategories.style.display = "flex";
      settingsBody.style.display = "none";

      openSettingsContentBtn.style.visibility = "visible";
      closeSettingsContentBtn.style.visibility = "hidden";
    }
  } else {
    settingsBody.style.display = "flex";
    settingsCategories.style.display = "flex";
  }

  chatArea.style.width = newWidth;
  fileInformation.style.width = "100%";
  chatHeader.style.width = "100%";

  positionTooltips();
  checkChatFooterAlignment();
};

// Automatically resize textarea as user types (currently disabled)
messageInput.addEventListener("input", updateTextareaSize(messageInput));
function updateTextareaSize(element) {
  // element.style.height = "auto";
  // element.style.height = `${element.scrollHeight}px`;
}

// Adjusts chat footer content alignment depending on overflow
function checkChatFooterAlignment() {
  if (chatFooterChat.offsetWidth < chatFooterChat.scrollWidth) {
    chatFooterChat.style.justifyContent = "flex-start";
  } else {
    chatFooterChat.style.justifyContent = "center";
  }
}

// Dynamically positions tooltips to avoid screen overflow
function positionTooltips() {
  const tooltips = document.querySelectorAll(".tooltip");
  for (let tooltip of tooltips) {
    const parentElement = tooltip.parentElement;
    const parentHeight = parentElement.offsetHeight;
    const parentWidth = parentElement.offsetWidth;

    const tooltipHeight = tooltip.offsetHeight;
    const tooltipWidth = tooltip.offsetWidth;
    const rect = tooltip.getBoundingClientRect();

    // Reset tooltip styles
    tooltip.style.setProperty("--triangle-rotation", "0");
    tooltip.style.setProperty("--triangle-top", "99%");
    tooltip.style.setProperty("--triangle-bottom", "none");
    tooltip.style.setProperty("--triangle-translateY", "0");
    tooltip.style.setProperty("--triangle-left", "none");
    tooltip.style.setProperty("--triangle-right", "none");

    // Calculate vertical position
    let transformY = (-parentHeight - tooltipHeight) / 2 - 12;
    let transformX = 0;

    const topPos = rect.top - tooltipHeight / 2;

    // Adjust for tooltips near top of screen
    if (topPos < 15 || parentElement.getBoundingClientRect().top + transformY < 10) {
      transformY = Math.abs(transformY);
      tooltip.style.setProperty("--triangle-bottom", "99%");
      tooltip.style.setProperty("--triangle-top", "none");
      tooltip.style.setProperty("--triangle-border-top-col", "transparent");
      tooltip.style.setProperty("--triangle-border-bottom-col", "var(--theme)");
    } else {
      tooltip.style.setProperty("--triangle-bottom", "none");
      tooltip.style.setProperty("--triangle-top", "99%");
      tooltip.style.setProperty("--triangle-border-top-col", "var(--theme)");
      tooltip.style.setProperty("--triangle-border-bottom-col", "transparent");
    }

    // Check horizontal overflow
    const viewportHeight = window.innerHeight;
    if (rect.top > viewportHeight - 10) {
      transformY -= rect.bottom - viewportHeight + 10;
    }

    const viewportWidth = window.innerWidth;
    if (rect.right > viewportWidth - 10) {
      transformX = (-parentWidth - tooltipWidth) / 2 - 12;
      tooltip.style.setProperty("--triangle-left", "99%");
    } else if (rect.left < 10) {
      transformX = Math.abs((-parentWidth - tooltipWidth) / 2 - 12);
      tooltip.style.setProperty("--triangle-right", "99%");
    }

    // If tooltip is moved horizontally, rotate arrow
    if (transformX) {
      transformY = 0;
      tooltip.style.setProperty("--triangle-rotation", "90deg");
      tooltip.style.setProperty("--triangle-translateX", `${-transformX}px`);
      tooltip.style.setProperty("--triangle-top", "50%");
      tooltip.style.setProperty("--triangle-bottom", "0");
      tooltip.style.setProperty("--triangle-translateY", "-50%");
    }

    tooltip.style.transform = `translate(${transformX}px, ${transformY}px)`;
  }
}

// Initial tooltip positioning
positionTooltips();

function updateButtonState() {
  inputGroupContainers.forEach((element) => {
    let input = element.querySelector("input");
    let button = element.querySelector("button");
    /*
    let idParts = element.id.split("-");

    let newClassName = "." + idParts[0];
    for (let i = 1; i < idParts.length - 1; i++) {
      newClassName = newClassName + "-" + idParts[i];
    }
    newClassName = newClassName + "-button";

    let correspondingButton = document.querySelector(newClassName);
    */

    // Checks if the input field has a value
    if (input.value.trim()) {
      // If it does, make the button clickable
      button.classList.add("available");
      button.classList.remove("unavailable");

      if (input === createConversationInput && !accountUsername) {
        // If the conversation input has a value, but the client doesnt have an account, make it not clickable
        button.classList.remove("available");
        button.classList.add("unavailable");
      }
    } else {
      // Make the button not clickable
      if (input === messageInput && fileInput.files.length) {
        // If the message field has an image attached, but no message, make the button clickable
        button.classList.add("available");
        button.classList.remove("unavailable");
      } else {
        button.classList.remove("available");
        button.classList.add("unavailable");
      }
    }
  });
}

inputGroupContainers.forEach((element) => {
  let input = element.querySelector("input");
  input.addEventListener("input", updateButtonState);
  input.addEventListener("focus", updateButtonState);
});

// Shows a list of attached images that the client wants to send
window.updateAttachedFiles = function () {
  // console.log(fileInput.files.length);
  checkInfoHeight();

  while (attachedFiles.firstChild) {
    attachedFiles.removeChild(attachedFiles.firstChild);
  }

  // Create elements for the files the client attached
  for (let i = 0; i < fileInput.files.length; i++) {
    let file = fileInput.files[i];

    let fileName = file.name;
    let fileSize = file.size;

    const container = document.createElement("div");
    container.className = "file-preview-container";

    const fileInfo = document.createElement("div");
    fileInfo.className = "file-preview-information";

    const progressBar = document.createElement("div");
    progressBar.className = "upload-progress";

    const progressFill = document.createElement("div");
    progressFill.className = "upload-progress-fill";

    progressBar.appendChild(progressFill);

    if (file.type.startsWith("image/")) {
      const imageWrapper = document.createElement("div");
      imageWrapper.id = "file-preview";

      const image = document.createElement("img");
      image.style.height = "100%";

      const removeFile = document.createElement("div");
      removeFile.id = "remove-file";
      removeFile.setAttribute("data-index", i);

      const X = document.createElement("i");
      X.className = "fa-solid fa-x";

      removeFile.appendChild(X);

      const reader = new FileReader();

      reader.onload = function (e) {
        image.src = e.target.result;
      };

      reader.readAsDataURL(file);

      imageWrapper.appendChild(image);
      fileInfo.appendChild(imageWrapper);
      fileInfo.appendChild(removeFile);
      container.appendChild(fileInfo);
      attachedFiles.appendChild(container);

      imageWrapper.appendChild(progressBar);

    } else if (file.type.startsWith("video/")) {

      const videoUrl = URL.createObjectURL(file);
      const videoPreview = document.createElement("video");
      videoPreview.src = videoUrl;
      videoPreview.controls = true
      videoPreview.style.position = "relative";
      videoPreview.style.display = "flex";
      videoPreview.style.height = "100%";
      videoPreview.id = "file-preview";

      const removeFile = document.createElement("div");
      removeFile.id = "remove-file";
      removeFile.setAttribute("data-index", i);

      const X = document.createElement("i");
      X.className = "fa-solid fa-x";

      removeFile.appendChild(X);

      const reader = new FileReader();

      reader.onload = function (e) {
        videoPreview.src = e.target.result;
      };

      reader.readAsDataURL(file);

      fileInfo.appendChild(videoPreview);
      fileInfo.appendChild(removeFile);
      container.appendChild(fileInfo);
      attachedFiles.appendChild(container);

      fileInfo.appendChild(progressBar);

    } else {
      const infoWrapper = document.createElement("div");
      infoWrapper.classList.add("unsupported-file");

      const nameTxt = document.createElement("div");
      nameTxt.id = "file-name";
      nameTxt.textContent = file.name;

      const sizeTxt = document.createElement("div");
      sizeTxt.id = "file-size";
      sizeTxt.textContent = window.formatFileSize(file.size);

      const removeFile = document.createElement("div");
      removeFile.id = "remove-file";
      removeFile.setAttribute("data-index", i);

      const X = document.createElement("i");
      X.className = "fa-solid fa-x";

      removeFile.appendChild(X);

      infoWrapper.appendChild(nameTxt);
      infoWrapper.appendChild(sizeTxt);
      fileInfo.appendChild(infoWrapper);
      fileInfo.appendChild(removeFile);
      container.appendChild(fileInfo);
      attachedFiles.appendChild(container);

      infoWrapper.appendChild(progressBar);
    }

    // console.log(`Name: ${fileName}    Size: ${window.formatFileSize(fileSize)}`);
  }

  const removeFileButtons = document.querySelectorAll("#remove-file");
  for (let element of removeFileButtons) {
    element.addEventListener("click", () => {
      element.parentElement.remove();

      const index = parseInt(element.getAttribute("data-index"));

      removeAttachedFile(index);

      // console.log(fileInput.files);

      checkInfoHeight();
    });
  }

  // fileInformation.appendChild(fileInfo);
};

function removeAttachedFile(index) {
  const filesArray = Array.from(fileInput.files);
  filesArray[index] = null; // Remove the file from the array

  const dataTransfer = new DataTransfer();
  // Rewrite array replacing the file to delete with an empty one
  for (let file of filesArray) {
    if (file != null) {
      dataTransfer.items.add(file);
    } else {
      dataTransfer.items.add(new File([], ""));
    }
  }

  fileInput.files = dataTransfer.files;

  // console.log(fileInput.files);
}

function checkInfoHeight() {
  let filesArray = Array.from(fileInput.files);

  // Filter out any files with empty names or invalid names
  filesArray = filesArray.filter(file => file.name.trim());

  if (filesArray.length > 0) {
    root.style.setProperty("--file-info-height", "12em");
  } else {
    // All files have been removed
    root.style.setProperty("--file-info-height", "3em");

    // Make button unavailable if there is no message
    if (!messageInput.value.trim()) {
      sendMessageBtn.classList.remove("available");
      sendMessageBtn.classList.add("unavailable");
    }

    // Delete anything left in the fileInput
    fileInput.value = '';
  }

  window.updateElementDimensions();

  // console.log(filesArray);
}

fileInput.addEventListener("input", () => {
  updateButtonState();
  window.updateAttachedFiles();
});

selectFileButton.addEventListener("click", () => {
  fileInput.click();
});

conversationParent.addEventListener("scroll", () => {
  conversationShadow.style.display =
    conversationParent.scrollTop < 1 ? "none" : "block";
});

openConversationsButton.addEventListener("click", () => {
  conversationsOpen = true;
  window.updateElementDimensions();
});

closeConversationsButton.addEventListener("click", () => {
  conversationsOpen = false;
  window.updateElementDimensions();
});

document.addEventListener("DOMContentLoaded", () => {
  updateButtonState();
  window.updateElementDimensions();
});

window.addEventListener("resize", () => {
  window.updateElementDimensions();
});

window.addEventListener("orientationchange", () => {
  window.updateElementDimensions();
});
