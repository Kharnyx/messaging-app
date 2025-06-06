// public/scripts/message-handler.js
const userIdtxt = document.getElementById("user-id");
const addUser = document.getElementById("add-user");
const createConversationInput = document.getElementById("user-id-input");
const newMessages = document.getElementById("new-messages");
const loadingContainer = document.getElementById("loading-container");
const loadingMessage = document.getElementById("loading-message");
const chatContainer = document.getElementById("chat-container");
const conversationErrorMessage = document.getElementById("add-conversation-error");

const currentUser = "";

let devKey = "";

let messageList = { messages: [] };
let lastMessages = [];
let conversations = [];
let messagesSentToMe = [];

let selectedConversation = "";
let maxPayload = 1 * 1024 * 1024;

let now = new Date();

let currentDate = "";
let currentDay = "";
let currentMonth = "";
let currentYear = "";
let fullDate = "";

let messagePosting = false;

const apiSubDomain = "kharnyx-messaging-app";
const page = `${apiSubDomain}.glitch.me`;
const apiBaseUrl = `https://${page}`;

//let socket = "";
const maxReconnetAttempts = 5;
let userIdsList = "";
let userId = "";

const wsUrl = `wss://${page}`;
const socket = new WebSocket(wsUrl);

window.connectWebSocket = function () {
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;

  socket.onclose = function () {
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      //console.log("WebSocket connection closed, attempting to reconnect...");
      setTimeout(window.connectWebSocket, 3000);
    } else {
      //console.log("Reconnection attempts exhausted");
      location.reload();
    }
  };

  socket.onopen = function () {
    reconnectAttempts = 0;
    chatContainer.style.display = "block";
    window.updateElementDimensions();
    window.resizeSettings();
    loadingMessage.textContent = "Connected!";
    loadingContainer.style.opacity = "0";

    setTimeout(() => {
      //console.log("WebSocket connection established");
      loadingContainer.style.display = "none";
    }, 500);
  };

  socket.onerror = function (error) {
    console.error("WebSocket error:", error);

    // When the app cannot connect to the server, display a different message and add a disconnected class
    loadingMessage.innerHTML = "Cannot Connect To Server";
    loadingContainer.classList.add("disconnected");

    console.log("Connection failure");
  };

  socket.onmessage = function (event) {
    const data = JSON.parse(event.data);
    const type = data.type;

    if (type === "error") {
      console.log(data);
    } else if (type === "data") {
      maxPayload = data.maxPayload;
    } else if (type === "signup") {
      //console.log(data);
    } else if (type === "login") {
      //console.log(data);

      if (data.status === "success") {
        let createdDate = new Date(data.account.createdDate);
        let date =
          `${String(createdDate.getDate()).padStart(2, "0")}/${createdDate.getUTCMonth() + 1
          }/${createdDate.getFullYear()}`;
        accountUsername = data.account.username;
        userId = data.account.userId;
        settingsUsername.textContent = `${userId}`;
        userIdtxt.textContent = `Your ID: ${userId}`;

        if (accountUsername) {
          loggedInUsername.textContent = `Account: ${accountUsername}`;
          deleteAccount.style.display = "flex";
        } else {
          loggedInUsername.textContent = "ACCOUNT (Not logged in)";
          deleteAccount.style.display = "none";
        }

        conversationErrorMessage.style.display = "none";

        toggleCreateAccount();

        updateConversations();
        switchConversations();
      }
    } else if (type === "logout") {
      accountUsername = null;
      userId = data.userId;
      settingsUsername.textContent = `${userId}`;
      userIdtxt.textContent = `Your ID: ${userId}`;

      loggedInUsername.textContent = "ACCOUNT (Not logged in)";
      deleteAccount.style.display = "none";

      conversationErrorMessage.style.display = "block";

      toggleCreateAccount();

      updateConversations();
      switchConversations();
    } else if (type === "deleteAccount") {
      //console.log(data);
      if (data.status === "success") {
        accountUsername = null;
        loggedInUsername.textContent = "ACCOUNT (Not logged in)";

        conversationErrorMessage.style.display = "block";

        toggleCreateAccount();

        updateConversations();
        switchConversations();

        deleteAccountOpen = false;
        toggleDeleteAccount();
      }
    } else if (type === "userIdResult") {
      if (!data.result) {
        userId = newUserId;
        settingsUsername.textContent = `${userId}`;
        userIdtxt.textContent = `Your ID: ${userId}`;

        //changeUsernamePanel.classList.remove("open");
        changeUserIdOpen = false;
        toggleChangeUserId();

        for (let i = conversationParent.children.length - 1; i >= 0; i--) {
          const child = conversationParent.children[i];
          if (child.className.includes("conversation")) {
            conversationParent.removeChild(child);
          }
        }
      }
    } else if (type === "createConversation") {
      //console.log(data);
      if (data.status === "success") {
        createConversationWithUser(data.otherUser, true);
      }
    } else if (type === "updateClients") {
      for (let i = conversationParent.children.length - 1; i >= 0; i--) {
        const child = conversationParent.children[i];
        if (child.className.includes("conversation")) {
          conversationParent.removeChild(child);
        }
      }

      //console.log("conversations OLD", conversations);

      //conversations = conversations.map(item => item.users === data.oldUserId ? data.newUserId : item);

      conversations.forEach((conversation, ci) => {
        conversation.users.forEach((user, ui) => {
          if (user === data.oldUserId) {
            conversations[ci].users[ui] = data.newUserId;
          }
        });
      });

      //console.log("conversations NEW", conversations);

      conversations = [];

      updateConversations();
      switchConversations();
    } else if (type === "userIdList") {
      userIdsList = data.userIds;
      //console.log("List of User ID's recieved from server:", userIdsList);
    } else if (type === "userId") {
      // Store the user ID on the client side
      userId = data.userId;
      userIdtxt.textContent = `Your ID: ${userId}`;
      settingsUsername.textContent = `${userId}`;

      const userIdArray = userId.split("#");
      usernameIdentifier.value = userIdArray[1];
      inputUsername.value = userIdArray[0];
      //console.log("User ID recieved from server:", data);
    } else if (type === "sendTo") {
      //console.log("sending message to", data);
    } else if (type === "message" || type === "firstMessage") {
      //console.log("Messages recieved from server:", data);
      messageList = data;
      updateConversations();
      switchConversations();

      if (type === "firstMessage") {
        chatBody.scrollTop = chatBody.scrollHeight;
      }
    } else if (type === "delete") {
      if (data.status === "success") {
        clearChatBody();
        lastMessages = [];
        conversations = [];
        messagesSentToMe = [];
        messageList = [];

        for (let i = conversationParent.children.length - 1; i >= 0; i--) {
          if (
            conversationParent.children[i].className.includes("conversation")
          ) {
            conversationParent.removeChild(conversationParent.children[i]);
          }
        }

        updateConversations();
        switchConversations();

        //console.log("SUCCESS: All messages have been successfully deleted. The system is now reset.");
      } else {
        //console.error("Failed to delete messages. Reason: Invalid dev key. Please ensure you are using the correct developer key and try again.");
      }
    } else {
      //console.log("Data recieved from server", data);
    }
  };
};

loadingContainer.querySelector(".loader").addEventListener('animationend', function () {
  // Change the background color once the animation ends
  loadingContainer.querySelector(".loader").style.opacity = 0;

  setTimeout(() => {
    loadingMessage.style.transform = `translateY(
    -${loadingMessage.getBoundingClientRect().top +
      loadingMessage.offsetHeight / 2 -
      window.innerHeight / 2}px)`;
  }, 500);
});

window.onload = function () {
  window.connectWebSocket();
};

function logWarning() {
  console.log(
    `%cCaution: Do not paste any external code into this area unless you fully understand its functionality. Executing untrusted code may result in unintended consequences, including potential security risks. Always verify the source of the code before running it to ensure the safety of your account and data. Proceed with caution and take responsibility for your actions.`,
    "background: red; color: white; padding: 3px; border-radius: 2px;"
  );
}

setInterval(logWarning, 10000);

logWarning();

function updateCurrentDates() {
  now = new Date();

  currentDate = now.getDate();
  currentDay = now.toLocaleString("en-us", { weekday: "short" });
  currentMonth = now.toLocaleString("en-us", { month: "short" });
  currentYear = now.getFullYear();
  fullDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(
    currentDate
  ).padStart(2, "0")}`;
}

function isSameTime(timestamp1, timestamp2) {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);

  const maxMinuteDiff = 30 * 60 * 1000; // Minutes in miliseconds
  const difference = Math.abs(date1.getTime() - date2.getTime());

  return (
    (date1.getUTCHours() === date2.getUTCHours() &&
      date1.getUTCMinutes() === date2.getUTCMinutes() &&
      date1.getUTCSeconds() === date2.getUTCSeconds()) ||
    difference < maxMinuteDiff
  );
}

sendMessageBtn.addEventListener("click", () => {
  if (messagePosting) return;
  window.sendMessage();
});

messageInput.addEventListener("keypress", (e) => {
  if (messagePosting) return;
  if (e.key === "Enter" && document.activeElement === messageInput) {
    e.preventDefault();
    window.sendMessage();
  }
});

addUser.addEventListener("click", () => {
  if (accountUsername) {
    createConversationWithUser(createConversationInput.value, false);
  }
});

newMessages.addEventListener("click", scrollToBottom);

function scrollToBottom() {
  chatBody.scrollTo({
    top: chatBody.scrollHeight,
    behavior: "smooth",
  });

  newMessages.style.display = "none";
}

let chatBodyScrollDiff = 0;
let newMessageSent = null;
const bottomPadding = window.getComputedStyle(chatBody).paddingBottom;
chatBody.addEventListener("scroll", () => {
  let requirementToRead = newMessageSent.offsetHeight + parseInt(bottomPadding);
  //console.log(requirementToRead)
  //chatBodyScrollDiff = maxScroll - chatBody.scrollTop;
  if (chatBodyScrollDiff < requirementToRead) {
    newMessages.style.display = "none";
  }

  chatShadow.style.display = chatBody.scrollTop < 1 ? "none" : "block";
});

function clearChatBody() {
  const children = Array.from(chatBody.children);

  children.forEach((child) => {
    if (child.id !== "chat-shadow") {
      chatBody.removeChild(child);
    }
  });
}

function loadMessages(response) {
  let currentMaxScroll =
    parseInt(chatBody.scrollHeight) - parseInt(chatBody.clientHeight);
  let currentScrollPos = chatBody.scrollTop;

  let messages =
    response.messages || response.currentMessages || response.messagesToSend; // Extract messages from the response

  messagesSentToMe = messages;

  // Check for messages that were not supposed to be send to client (as a precaution)
  messages.forEach((msg, index) => {
    if (
      !(
        (msg.sendTo && msg.sendTo.includes(userId)) ||
        msg.senderId === userId ||
        msg.sendTo === ""
      )
    ) {
      //console.log("removing item", index);
      messages.splice(index, 1);
    }
  });

  //console.log("messages", messages);

  clearChatBody();

  let previousProduct = null;

  let index = 0;

  updateCurrentDates();
  if (messages) {
    messages.forEach((msg) => {
      const msgDates = new Date(msg.timestamp);
      const msgTime = msg.timestamp
        ? window.formatUTCTo12Hour(msg.timestamp)
        : "Unknown Time";

      const formattedTimestamp = msgTime;
      const isFromMe = userId === msg.senderId;

      const messageContainer = document.createElement("div");
      messageContainer.className = `message-container ${isFromMe ? "from-me" : "from-others"
        }`;

      const fileParent = document.createElement("div");
      fileParent.id = "files";

      if (msg.files && msg.fileTypes) {
        msg.files.forEach((fileEndpoint, index) => {
          let separator = fileEndpoint.startsWith("/") ? "" : "/";
          const fileUrl = `${apiBaseUrl}${separator}${fileEndpoint}`;
          let fileType = msg.fileTypes[index].fileType;
          let fileSize = msg.fileTypes[index].fileSize;
          let fileName = msg.fileTypes[index].fileName;

          const vidImgParent = document.createElement("div");

          if (fileType.startsWith("video/")) {
            const video = document.createElement("video");
            video.src = fileUrl;
            video.controls = true;

            vidImgParent.appendChild(video);
            fileParent.appendChild(vidImgParent);
          } else if (fileType.startsWith("image/")) {
            const image = document.createElement("img");
            image.src = fileUrl;

            vidImgParent.appendChild(image);
            fileParent.appendChild(vidImgParent);
          } else {
            const file = document.createElement("div");
            file.id = "open-file";
            const sizeTxt = document.createElement("div");
            sizeTxt.id = "file-size";
            sizeTxt.textContent = window.formatFileSize(fileSize);
            const nameTxt = document.createElement("div");
            nameTxt.id = "file-name";
            nameTxt.textContent = fileName;

            file.addEventListener("click", function () {
              window.open(fileUrl, "blank");
            });

            file.appendChild(nameTxt);
            file.appendChild(sizeTxt);
            fileParent.appendChild(file);
          }

          const br = document.createElement("br");
          br.style.height = "0";

          if (index != msg.files.length - 1) {
            //fileParent.appendChild(br);
          }
        });
      }

      const senderDiv = document.createElement("div");
      senderDiv.className = "sender";
      senderDiv.textContent = msg.senderId;

      const timestampDiv = document.createElement("div");
      timestampDiv.className = "timestamp";
      timestampDiv.textContent = formattedTimestamp;

      const messageDiv = document.createElement("div");
      messageDiv.className = "message";

      const messageText = document.createElement("span");
      messageText.textContent = msg.text;

      messageDiv.appendChild(messageText);

      const msgDate = msgDates.getUTCDate();
      const msgDay = msgDates.toLocaleString("en-us", {
        weekday: "short",
        timeZone: "UTC",
      });
      const msgMonth = msgDates.toLocaleString("en-us", {
        month: "short",
        timeZone: "UTC",
      });
      const msgYear = msgDates.getFullYear();
      const msgFullDate = `${msgYear}-${String(
        msgDates.getUTCMonth() + 1
      ).padStart(2, "0")}-${String(msgDates.getUTCDate()).padStart(2, "0")}`;

      messageDiv.addEventListener("click", function () {
        if (timestamp.className.includes("new-day")) return;
        //console.log(chatBody.scrollTop)

        const scrollPosition = chatBody.scrollTop;
        const maxScroll = chatBody.scrollHeight - chatBody.clientHeight;

        const scrollChange = 19.26;

        if (timestamp.style.display === "none") {
          timestamp.style.display = "block";
          chatBody.scrollTop = scrollPosition + scrollChange;
        } else {
          if (scrollPosition < maxScroll) {
            chatBody.scrollTop = scrollPosition - scrollChange;
          }
          timestamp.style.display = "none";
        }
      });

      let previousMsgFullDate = null;
      if (previousProduct) {
        const previousDate = new Date(previousProduct.timestamp);
        previousMsgFullDate = `${previousDate.getFullYear()}-${String(
          previousDate.getUTCMonth() + 1
        ).padStart(2, "0")}-${String(previousDate.getUTCDate()).padStart(
          2,
          "0"
        )}`;
      }

      if (
        !previousProduct ||
        (previousProduct.senderId !== msg.senderId && msg.senderId !== userId)
      ) {
        messageContainer.appendChild(senderDiv);
      }

      messageContainer.appendChild(fileParent);
      if (msg.text.trim()) {
        messageContainer.appendChild(messageDiv);
      }
      messageContainer.appendChild(timestampDiv);

      const br = document.createElement("br");

      chatBody.insertBefore(messageContainer, chatShadow);

      if (
        previousProduct !== null &&
        previousProduct.senderId !== msg.senderId
      ) {
        chatBody.insertBefore(br, messageContainer);
      }

      const container =
        chatBody.getElementsByClassName("message-container")[index];
      const firstChild = container.firstChild;
      const timestamp = container.getElementsByClassName("timestamp")[0];

      if (
        !previousProduct ||
        (previousMsgFullDate !== msgFullDate &&
          !isSameTime(previousProduct.timestamp, msg.timestamp))
      ) {
        timestampDiv.classList.add("new-day");
        timestampDiv.textContent =
          fullDate !== msgFullDate
            ? `${msgDay}, ${msgDate} ${msgMonth} at ${msgTime}`
            : `Today ${msgTime}`;

        container.insertBefore(timestamp, firstChild);
      }

      if (
        previousProduct !== null &&
        isSameTime(previousProduct.timestamp, msg.timestamp)
      ) {
        timestamp.style.display = "none";
      }

      previousProduct = msg;
      index++;

      newMessageSent = messageContainer;
    });
  }

  if (
    (messages.length > 0 &&
      newMessageSent &&
      messages[messages.length - 1].senderId === userId) ||
    (newMessageSent &&
      currentMaxScroll - currentScrollPos <
      newMessageSent.offsetHeight + bottomPadding)
  ) {
    scrollToBottom();

    lastMessages = [...messages];
  } else {
    if (
      chatBody.scrollHeight > chatBody.clientHeight &&
      chatBodyScrollDiff > 40
    ) {
      newMessages.style.display = "flex";
    }
  }
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

window.sendMessage = debounce(() => {
  const messageText = messageInput.value;
  if (!messageText.trim() && fileInput.value === "") {
    console.error("Message cannot be empty");
    return;
  }

  let files = Array.from(fileInput.files);
  let validFiles = files.filter(file => file.name.trim() !== "");

  // console.log(files);

  let cumullativeFileSize = 0;

  for (let file of validFiles) {
    cumullativeFileSize += file.size;
  }

  if (cumullativeFileSize > maxPayload) {
    console.error("File size exceeds the maximum limit");
    return;
  }

  updateCurrentDates();

  let cleanedMessage = window.ProfanityFilter.clean(messageText);

  if (!messageText.trim()) cleanedMessage = "";

  const formData = new FormData();

  formData.append("senderId", userId);
  formData.append("senderName", currentUser);
  formData.append("text", cleanedMessage);
  formData.append("timestamp", now);
  formData.append("sendTo", selectedConversation);

  const messageData = {
    senderId: userId,
    senderName: currentUser,
    text: cleanedMessage,
    timestamp: now,
    sendTo: selectedConversation,
  };

  if (accountUsername) messageData.senderUsername = accountUsername;

  if (validFiles.length > 0) {
    /*
    socket.send(JSON.stringify(messageData));

    let filesRemaining = validFiles.length;

    validFiles.forEach((file, index) => {
      const container = attachedFiles.children[index];
      const progressFill = container.querySelector(".upload-progress-fill");

      uploadFileInChunks(file, socket, progressFill, messageData, () => {
        console.log(`${file.name} uploaded`);

        filesRemaining--;
        if (filesRemaining === 0) {
          messageInput.value = "";
          fileInput.value = "";
          window.updateAttachedFiles();
        }
      });
    });
    */



    // Read files as binary and send the binary data separately
    const fileObjects = Array.from(validFiles).map((file) => {
      return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onloadend = () => {
          const fileData = reader.result; // This is an ArrayBuffer
          const base64FileData = window.arrayBufferToBase64(fileData);
          //console.log("file data", file)
          const fileInfo = Array.from(file);
          resolve({
            filename: file.name,
            fileData: base64FileData,
            fileSize: file.size,
            fileType: file.type,
          });
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    });

    // Once files are read, combine them with the message data
    Promise.all(fileObjects)
      .then((fileArray) => {
        const fullMessageData = {
          ...messageData,
          files: fileArray,
        };

        //console.log("Sending message with files:", fullMessageData);
        socket.send(JSON.stringify(fullMessageData)); // Send JSON metadata with binary data

        messageInput.value = "";
        fileInput.value = "";
        window.updateAttachedFiles();
      })
      .catch((error) => {
        //console.error("Error reading files:", error);
      });

    
    /*
    validFiles.forEach((file) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        const arrayBuffer = reader.result;

        // First, send the metadata (as JSON)
        socket.send(JSON.stringify({
          type: 'file-meta',
          filename: file.name,
          fileSize: file.size,
          fileType: file.type,
          senderId: userId,
          sendTo: selectedConversation,
          text: cleanedMessage,
          timestamp: now
        }));

        // Then send the binary data
        socket.send(arrayBuffer);
      };

      reader.readAsArrayBuffer(file);
    });

    // Clear form here or after confirming upload success
    messageInput.value = "";
    fileInput.value = "";
    window.updateAttachedFiles();
    */

  } else {
    // Send only text message
    //console.log("sendingMessage", messageData);
    socket.send(JSON.stringify(messageData));
    messageInput.value = "";
    fileInput.value = "";
    window.updateAttachedFiles();
  }
}, 150);

function uploadFileInChunks(file, socket, progressFill, messageData, onAllFilesSent) {
  const CHUNK_SIZE = 64 * 1024; // 64KB
  let offset = 0;
  const fileId = crypto.randomUUID();

  function sendChunk() {
    const chunk = file.slice(offset, offset + CHUNK_SIZE);
    const reader = new FileReader();

    reader.onload = () => {
      const base64Chunk = window.arrayBufferToBase64(reader.result);

      socket.send(JSON.stringify({
        ...messageData,
        type: "file-chunk",
        fileId,
        filename: file.name,
        fileType: file.type,
        fileSize: file.size,
        chunk: base64Chunk,
        offset,
        isLastChunk: offset + CHUNK_SIZE >= file.size
      }));

      offset += CHUNK_SIZE;

      const percent = Math.min((offset / file.size) * 100, 100);
      progressFill.style.width = `${percent}%`;

      if (offset < file.size) {
        setTimeout(sendChunk, 0);
      } else {
        onAllFilesSent();
      }
    };

    reader.onerror = () => {
      console.error("Error reading file chunk");
    }

    reader.readAsArrayBuffer(chunk);
  }

  sendChunk();
}

function createConversationWithUser(user, fromMessage) {
  let userInput = createConversationInput.value;
  //console.log(fromMessage);
  if (
    (!(userIdsList.includes(user) || fromMessage) ||
      user === userId ||
      !user) &&
    !(!user && fromMessage)
  ) {
    //console.log(`Failed to add user: ${user}`);
    return;
  }

  for (let i = 0; i < conversations.length; i++) {
    const usersInConversation = conversations[i]["users"];
    const usersSet = [user, userId].sort();

    if (usersInConversation.sort().join() === usersSet.join()) {
      //console.log(`Conversation with ${user} already exists.`);
      return;
    }
  }

  let newItem = Object.keys(conversations).length;
  conversations[newItem] = { users: [] };

  const conversation = document.createElement("div");
  conversation.className = "conversation";
  if (!user) conversation.id = "global";

  const conversationTitle = document.createElement("h2");
  conversationTitle.textContent = user || "Global Chat";

  const conversationChevron = document.createElement("i");
  conversationChevron.className =
    "fa-solid fa-chevron-right conversation-chevron";

  if (fromMessage) {
    if (conversation.id !== "global")
      conversations[newItem]["users"] = [user, userId].sort();
    else conversations[newItem]["users"] = [""];
  } else {
    socket.send(
      JSON.stringify({
        type: "createConversation",
        senderId: userId,
        otherUser: createConversationInput.value,
        username: accountUsername,
      })
    );

    //console.log(conversations);

    return;
  }

  //console.log("adding convo length: ", conversations[newItem]["users"].length);

  if (!conversations[newItem]["users"].length) {
    conversations.splice(newItem, 1);
    return;
  }

  conversation.addEventListener("click", function () {
    if (
      selectedConversation === conversations[newItem]["users"] ||
      (conversations[newItem]["users"][0] === selectedConversation &&
        selectedConversation === "")
    ) {
      if (conversationsOpen) {
        conversationsOpen = false;
        window.updateElementDimensions();
      }

      return;
    }

    const conversationEl = document.querySelectorAll(".conversation-selected");
    conversationEl.forEach((el) => (el.className = "conversation"));

    conversation.className = "conversation-selected";

    selectedConversation = conversations[newItem]["users"];

    if (!selectedConversation[0]) {
      selectedConversation = "";
    }

    switchConversations();

    if (conversationsOpen) {
      conversationOpen = false;
      window.updateElementDimensions();
    }
    //console.log(`Conversation switched to the user/s: ${selectedConversation}`);
  });

  conversation.appendChild(conversationTitle);
  conversation.appendChild(conversationChevron);
  conversationParent.appendChild(conversation);
}

function updateConversations() {
  let messages =
    messageList.messages ||
    messageList.currentMessages ||
    messageList.messagesToSend;

  if (!document.getElementById("global")) {
    createConversationWithUser("", true);
  }

  const conversationEl = document.querySelectorAll(".conversation-selected");
  if (!conversationEl.length) {
    document.getElementById("global").className = "conversation-selected";
  }

  if (messages) {
    messages.forEach((msg) => {
      if (
        msg.sendTo &&
        msg.sendTo.includes(userId) &&
        msg.senderId !== userId
      ) {
        createConversationWithUser(msg.senderId, true);
      } else if (msg.sendTo && msg.senderId === userId) {
        let newSendTo = [...msg.sendTo];
        newSendTo = newSendTo.filter((item) => item !== userId);

        createConversationWithUser(newSendTo, true);
      }
    });
  }

  let conversationChevrons = document.getElementsByClassName(
    "conversation-chevron"
  );
  for (let chevron of conversationChevrons) {
    chevron.style.display = conversationsOpen ? "block" : "none";
  }

  //console.log("conversations", conversations);

  /*
  let newConversationsList = [];

  for (let i = 0; i < conversations.length; i++)  {
    if (conversations[i]["users"].length) {
      newConversationsList.push(conversations[i]);
    }
  }
  conversations = [...newConversationsList];
  */
}

function switchConversations() {
  let messagesToLoad = {
    messages: [],
  };

  let messages =
    messageList.messages ||
    messageList.currentMessages ||
    messageList.messagesToSend;

  //console.log("messages", messages);

  clearChatBody();

  if (messages) {
    if (!selectedConversation[0]) {
      messages.forEach((msg) => {
        if (!msg.sendTo) {
          messagesToLoad.messages.push(msg);
        }
      });
    } else {
      messages.forEach((msg) => {
        let sentTo = msg.sendTo;
        //console.log(sentTo.includes(userId) && selectedConversation.includes(msg.senderId));
        //console.log(`${sentTo} includes? ${selectedConversation} && ${msg.senderId} === ${userId}`);

        let addressedTo = [...sentTo];
        if (!addressedTo.includes(msg.senderId)) addressedTo.push(msg.senderId);

        //console.log("adressed", addressedTo);
        //console.log("convo", selectedConversation);

        if (addressedTo.sort().join() === selectedConversation.sort().join()) {
          //console.log("adding message to priv chat", msg);
          messagesToLoad.messages.push(msg);
        }
      });
    }
  }

  //console.log("PM convo", messagesToLoad);

  loadMessages(messagesToLoad);

  chatBody.scrollTop = chatBody.scrollHeight;
}

window.deleteMessages = function (key) {
  //console.log("deleting messages...")
  socket.send(JSON.stringify({ type: "delete", devKey: key }));
};
