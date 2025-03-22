// public/scripts/script.js
const chatConversations = document.getElementById("chat-conversations");
const chatArea = document.getElementById("chat-area");
const chatBody = document.getElementById("chat-body");
const chatFooter = document.getElementById("chat-footer");
const chatHeader = document.getElementById("chat-header");
const chatShadow = document.getElementById("chat-shadow");

const inputText = document.querySelectorAll('input[type="text"]');
const messageInput = document.getElementById("chat-message-input");
const postMessage = document.getElementById("send-message");

const fileInput = document.getElementById("file-input");
const selectFileButton = document.getElementById("attach-file");
const attachedFiles = document.getElementById("attached-files");
const fileInformation = document.getElementById("file-information");

const conversationHeader = document.getElementById("chat-conversations-header");
const conversationParent = document.getElementById("conversation-parent");

const conversationShadow = document.getElementById("conversation-shadow");

const openConversationsButton = document.getElementById("open-conversations");
const closeConversationsButton = document.getElementById("close-conversations");
let conversationsOpen = false;

const root = document.documentElement;
const computedStyle = getComputedStyle(root);
const conversationsWidth = computedStyle
  .getPropertyValue("--conversations-width")
  .trim();
const borderWidth =
  parseFloat(computedStyle.getPropertyValue("--border-width")) *
  parseFloat(getComputedStyle(document.documentElement).fontSize);

// Updates dimensions of elements to corespond with the new screen dimensions
window.updateElementDimensions = function () {
  if (window.innerWidth < window.innerHeight) {
    root.style.setProperty(
      "--conversations-width",
      chatConversations.style.width
    );

    chatConversations.classList.add("innactive");
    chatConversations.classList.remove("active");
    chatConversations.style.width = "0px";
    chatConversations.style.display = "none";
    //console.log(chatConversations.offsetWidth)
  } else {
    chatConversations.classList.remove("innactive");
    chatConversations.classList.add("active");

    root.style.setProperty("--conversations-width", "28.12vw");

    chatConversations.style.display = "block";
    chatConversations.style.width = conversationsWidth;
    chatConversations.style.opacity = "1";
  }

  chatArea.style.display = "block";

  const conversationPadding =
    parseFloat(window.getComputedStyle(conversationParent).paddingBottom) +
    parseFloat(window.getComputedStyle(conversationParent).paddingTop);

  conversationParent.style.height = `${
    window.innerHeight - conversationHeader.offsetHeight - conversationPadding
  }px`;

  chatBody.style.height = `${
    window.innerHeight - chatFooter.offsetHeight - chatHeader.offsetHeight
  }px`;

  chatShadow.style.transform = `translateY(${chatHeader.offsetHeight}px)`;
  conversationShadow.style.transform = `translateY(${conversationHeader.offsetHeight}px)`;

  let newWidth = `${window.innerWidth - chatConversations.offsetWidth}px`;

  //messageInput.style.width = `${700 + window.innerWidth - chatConversations.offsetWidth - 800 - 110}px`;

  let conversationChevrons = document.getElementsByClassName(
    "conversation-chevron"
  );
  for (let chevron of conversationChevrons) {
    chevron.style.display = conversationsOpen ? "block" : "none";
  }

  closeConversationsButton.style.visibility = "hidden";
  openConversationsButton.style.visibility = "hidden";

  if (chatConversations.style.width == "0px") {
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
    //console.log(chatConversations.offsetWidth);
    newWidth = `${window.innerWidth - chatConversations.offsetWidth}px`;
    chatFooter.style.width = newWidth;
  }

  chatArea.style.width = newWidth;
  fileInformation.style.width = "100%";
  chatHeader.style.width = "100%";

  positionTooltips();
};

function positionTooltips() {
  const tooltips = document.querySelectorAll(".tooltip");

  tooltips.forEach((tooltip) => {
    const parentElement = tooltip.parentElement,
      rect = tooltip.getBoundingClientRect();

    // Get the height of the parent and the tooltip
    const parentHeight = parentElement.offsetHeight;
    const tooltipHeight = tooltip.offsetHeight;

    // Calculate initial transform position to center the tooltip
    let transform =
      -parentHeight - Math.abs(tooltipHeight - parentHeight) / 2 - 15;
    const topPos = rect.top - tooltipHeight / 2;

    if (
      topPos < 10 ||
      parentElement.getBoundingClientRect().top + transform < 10
    ) {
      transform = Math.abs(transform); // Push the tooltip downward
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

    // Check if the tooltip overflows the bottom of the screen
    const viewportHeight = window.innerHeight;
    if (rect.bottom > viewportHeight - 10) {
      transform -= rect.bottom - viewportHeight + 10; // Adjust to prevent overflow
    }

    tooltip.style.transform = `translateY(${transform}px)`;
  });
}

positionTooltips();

function updateButtonState() {
  inputText.forEach((element) => {
    let idParts = element.id.split("-");

    let newClassName = "." + idParts[0];
    for (let i = 1; i < idParts.length - 1; i++) {
      newClassName = newClassName + "-" + idParts[i];
    }
    newClassName = newClassName + "-button";

    let correspondingButton = document.querySelector(newClassName);

    // Checks if the input field has a value
    if (element.value.trim() !== "") {
      // If it does, make the button clickable
      correspondingButton.classList.add("available");
      correspondingButton.classList.remove("unavailable");

      if (element === createConversationInput && !accountUsername) {
        // If the conversation input has a value, but the client doesnt have an account, make it not clickable
        correspondingButton.classList.remove("available");
        correspondingButton.classList.add("unavailable");
      }
    } else {
      // Make the button not clickable
      if (element === messageInput && fileInput.value !== "") {
        // If the message field has an image attached, but no message, make the button clickable
        correspondingButton.classList.add("available");
        correspondingButton.classList.remove("unavailable");
      } else {
        correspondingButton.classList.remove("available");
        correspondingButton.classList.add("unavailable");
      }
    }
  });
}

inputText.forEach((element) => {
  element.addEventListener("input", updateButtonState);
  element.addEventListener("focus", updateButtonState);
});

function removeAttachedFile(index) {
  const filesArray = Array.from(fileInput.files);
  filesArray.splice(index, 1); // Remove the file from the array

  const dataTransfer = new DataTransfer();
  filesArray.forEach((file) => dataTransfer.items.add(file)); // Rewrite the array with the removed file
  fileInput.files = dataTransfer.files;
}

// Shows a list of attached images that the client wants to send
window.updateAttachedFiles = function () {
  while (attachedFiles.firstChild) {
    attachedFiles.removeChild(attachedFiles.firstChild);
  }

  for (let i = 0; i < fileInput.files.length; i++) {
    let file = fileInput.files[i];

    let fileName = file.name;
    let fileSize = file.size;

    if (file.type.startsWith("image/")) {
      const background = document.createElement("div");

      const imagePreview = document.createElement("div");
      imagePreview.style.position = "relative";
      imagePreview.style.display = "flex";
      imagePreview.style.height = "100%";

      const image = document.createElement("img");
      image.id = "image-preview";

      const removeFile = document.createElement("div");
      removeFile.id = "remove-file";

      const X = document.createElement("i");
      X.className = "fa-solid fa-x";

      removeFile.appendChild(X);

      const reader = new FileReader();

      reader.onload = function (e) {
        image.src = e.target.result;
      };

      reader.readAsDataURL(file);

      background.appendChild(imagePreview);
      imagePreview.appendChild(image);
      imagePreview.appendChild(removeFile);
      attachedFiles.appendChild(background);

      removeFile.addEventListener("click", () => {
        background.remove();
        removeAttachedFile(i);
      });
    }

    console.log(
      `Name: ${fileName}    Size: ${window.formatFileSize(fileSize)}`
    );
  }

  //fileInformation.appendChild(fileInfo);
};

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
