// server.js
const express = require("express");
const dotenv = require("dotenv");
const http = require("http");
const path = require("path");
const fs = require("fs");
const WebSocket = require("ws");
// const clamav = require("clamav.js"); // Make sure this is installed if used
const axios = require("axios");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({
  server,
});

const messageRateLimit = 25; // Maximum number of messages per minute
const messageWindowMs = 60 * 1000; // Time window in ms (1 minute)
const maxPayload = 10 * 1024 * 1024; // 10MB

const pingIntervalDelay = 30 * 1000; // 30 seconds

const userMessageCount = new Map();

const PORT = process.env.PORT || 3000;
const DEV_KEY = process.env.DEV_KEY;
const BETA_TESTER_KEY = process.env.BETA_TESTER_KEY;

const subDomain = "kharnyx-messaging-app";

const saltRounds = 10;

// --- Persistent Data Variables ---
let messages = []; // This will be loaded from and saved to .data/messages.json
let accounts = []; // This will be loaded from and saved to .data/accounts.json
let conversations = {}; // This will be loaded from and saved to .data/conversations.json

// --- Temporary/Volatile Data (does not need to be saved) ---
const users = []; // In-memory mapping of userId to WebSocket
let userIds = []; // In-memory list of active user IDs
const clients = new Map(); // Stores clients and their details (in-memory)
const cache = {}; // In-memory cache
// const incomingFiles = new Map(); // Track uploads by user/socket (moved inside connection handler)

// --- Define Persistent Storage Paths ---
const DATA_DIR = path.join(__dirname, ".data"); // The .data folder
const ACCOUNTS_FILE = path.join(DATA_DIR, "accounts.json");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");
const CONVERSATIONS_FILE = path.join(DATA_DIR, "conversations.json");
const UPLOADS_DIR = path.join("uploads"); // Uploaded files go here

// Ensure the .data directory and its subdirectories exist
const ensureDataDirectories = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { rescursive: true });
    console.log(".data directory created.");
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log("uploads directory created.");
  }
};

// Load data from JSON files
const loadData = (filePath, defaultData) => {
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, "UTF8");
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error loading data from ${filePath}:`, error);
      return defaultData;
    }
  }
  return defaultData;
};

// Save data to JSON file
const saveData = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "UTF8");
    console.log(`Data saved to ${filePath}`);
  } catch (error) {
    console.error(`Error saving data to ${filePath}:`, error);
  }
};

// --- Initial data loading on Server startup ---
ensureDataDirectories();

accounts = loadData(ACCOUNTS_FILE, []);
messages = loadData(MESSAGES_FILE, []);
conversations = loadData(CONVERSATIONS_FILE, {});

console.log(`Loaded ${accounts.length} accounts.`);
console.log(`Loaded ${messages.length} messages.`);
console.log(`Loaded ${Object.keys(conversations).length} conversations.`);

// Serve static files from the 'public' folder
app.use(express.static(path.join(process.cwd(), "public")));

// Serve the HTML file (index.html) from the 'public' folder
app.get("/", (req, res) => {
  const redirectButton = `
  <button onclick="window.open('https://kharnyx.github.io/messaging-app/', '_blank')">Messaging App</button>
    <style>
      button {
        background-color: #80c27a;
        color: #ffffff;
        border: none;
        padding: 10px;
        border-radius: 0.5em;
      }
      button:hover {
        background-color: #73a770;
        cursor: pointer;
      }
    </style>
    `;

  res.send(redirectButton);

  // res.sendFile(path.join(process.cwd(), "public/src", "index.html"));
});

if (!fs.existsSync(UPLOADS_DIR)) {
  // If it doesn't exist, create it
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log("Uploads directory created.");
} else {
  console.log("Uploads directory already exists.");
}

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Storing connection IDs
wss.on("connection", async (ws) => {
  // Ping the client every 30 seconds to prevent socket disconnection
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  }, pingIntervalDelay);

  // Generate a unique user ID for each connection

  const userId = generateUserId();

  const clientInfo = { userId };
  userMessageCount.set(userId, { count: 0, timestamp: Date.now() });

  const incomingFiles = new Map(); // Track uploads by user/socket

  // Associate the WebSocket connection with the user ID
  users[userId] = ws;

  userIds.push(userId);

  let token = crypto.randomBytes(50).toString("hex");

  clients.set(ws, { userId: userId, token: token });

  console.log(`New user connected with ID: ${userId}`);
  console.log(`Current users online: `, userIds);

  sendStatusToClients();

  //let sendTo = "text";

  // Send the user their unique ID (so they can use it in messages)
  ws.send(JSON.stringify({ type: "userId", userId }));
  ws.send(JSON.stringify({ type: "token", token }));
  //ws.send(JSON.stringify({ type: "message", messages }));

  for (let client of wss.clients) {
    let messagesToSend = [];
    for (let message of messages) {
      const clientInfo = clients.get(client);
      //console.log(clientInfo);
      if (
        (message.sendTo && message.sendTo.includes(clientInfo.userId)) ||
        !message.sendTo ||
        message.senderUsername === clientInfo.username
      ) {
        messagesToSend.push(message);
      }
    }
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "firstMessage", messagesToSend }));
    }
  }

  ws.send(JSON.stringify({ type: "data", maxPayload: maxPayload }));

  //console.log(wss.clients);
  //ws.send(JSON.stringify({ type: "sendTo", sendTo }));

  for (let client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "userIdList", userIds }));
    }
  }

  ws.on("pong", () => {
    console.log("Pong recieved from client");
  });

  // Handle incoming messages
  ws.on("message", async (message) => {
    const userStats = userMessageCount.get(userId);
    const currentTimestamp = Date.now();

    if (typeof message === "string") {
      try {
        const data = JSON.parse(message);

        if (data.type === "file-meta") {
          // Save metadata so we can use it when the binary arrives
          incomingFiles.set(userId, {
            filename: data.filename,
            fileSize: data.fileSize,
            fileType: data.fileType,
            senderId: data.senderId,
            senderUsername: data.senderUsername,
            senderName: data.senderName,
            sendTo: data.sendTo,
            token: data.token,
            text: data.text,
            timestamp: data.timestamp,
          });

          return; // Wait for the binary to come next
        }

        // Other non-file messages (login, chat, etc.)
        // existing logic here...

        // Parse the string as JSON to extract metadata
        // This part was duplicated in your original code.
        // It's handled below where `JSON.parse(messageStr)` is called.
        // For consistency with your original, I'm keeping the flow,
        // but it's good to note this could be refactored.
      } catch (e) {
        console.error("Invalid JSON message:", e);
      }
    }

    // Check if the message is a buffer (binary data)
    if (Buffer.isBuffer(message)) {
      const fileMeta = incomingFiles.get(userId);

      if (!fileMeta) {
        console.warn("Binary received without metadata, ignoring.");
        // return;
      }

      if (fileMeta) {
        const {
          filename,
          fileSize,
          fileType,
          senderId,
          senderUsername,
          senderName,
          sendTo,
          token,
          text,
          timestamp,
        } = fileMeta;

        if (clients.get(ws)?.token != token) {
          ws.send(
            JSON.stringify({
              type: "ban",
              status: "error",
              message: "Access Denied",
            })
          );
          
          return;
        }

        const uniqueName = `${Date.now()}-${crypto
          .randomBytes(8)
          .toString("hex")}-${filename}`;
        const filePath = path.join(UPLOADS_DIR, uniqueName);

        fs.writeFile(filePath, message, (err) => {
          console.log(`Binary file ${uniqueName} saved successfully.`);

          messages.push({
            senderId,
            senderUsername,
            senderName,
            text,
            timestamp,
            files: [filePath],
            fileTypes: [
              {
                fileType,
                fileSize,
                fileName: filename,
              },
            ],
            sendTo,
          });
          // Save messages after a new file message is added
          saveData(MESSAGES_FILE, messages);

          sendMessagesToClients();

          incomingFiles.delete(userId); // Clean up after processing
        });

        return;
      }
      // Convert the buffer to a string (only for JSON part)
      const messageStr = message.toString("utf8");

      const {
        type,
        senderId: senderId,
        senderUsername,
        senderName,
        text,
        timestamp,
        sendTo,
        newUserId,
        oldUserId,
        devKey,
        token,
        username,
        password,
        otherUser,
      } = JSON.parse(messageStr); // This parse was here in original code for buffer path
      console.log(token)
      if (clients.get(ws)?.token != token) {
        ws.send(
          JSON.stringify({
            type: "ban",
            status: "error",
            message: "Access Denied",
          })
        );
        
        console.error("Banned user");
        
        return;
      }

      if (devKey !== DEV_KEY) {
        if (currentTimestamp - userStats.timestamp > messageWindowMs) {
          userStats.count = 0;
          userStats.timestamp = currentTimestamp;
        }

        if (userStats.count > messageRateLimit) {
          ws.send(
            JSON.stringify({ type: "error", message: "Rate limit exceeded" })
          );
          return;
        }

        userStats.count++;
      }

      if (type === "userIdTaken") {
        console.log("requesting to change userId");
        ws.send(
          JSON.stringify({
            type: "userIdResult",
            result: userIds.includes(newUserId),
          })
        );

        if (newUserId && oldUserId) {
          if (!userIds.includes(newUserId)) {
            // userId = newUserId; // This refers to a local `userId` variable from the connection handler
            // To properly update the client's current session userId, you'd update clients.set()
            // and the `userId` in this specific closure for the `on('message')` handler.
            // For persistence, only the `accounts` and `messages` data needs `saveData` call.

            users[newUserId] = ws;
            delete users[oldUserId];

            userIds = userIds.map((item) =>
              item === oldUserId ? newUserId : item
            );

            Array.from(messages).forEach((msg, index) => {
              if (msg.senderId === oldUserId) {
                msg.senderId = newUserId;
              }

              if (typeof msg.sendTo === "string") {
                if (msg.sendTo.includes(oldUserId)) {
                  msg.sendTo = msg.sendTo.replace(oldUserId, newUserId);
                }
              } else if (Array.isArray(msg.sendTo)) {
                msg.sendTo.forEach((item, index) => {
                  if (item === oldUserId) {
                    msg.sendTo[index] = newUserId;
                  }
                });
              }
            });
            // Save messages after a userId change might affect them
            saveData(MESSAGES_FILE, messages);

            // message = message.map((item) => // This line is incorrect, `message` is the raw incoming data
            //   item === oldUserId ? newUserId : item
            // );
            clients.set(ws, {
              userId: newUserId,
              username: clients.get(ws)?.username,
              token: clients.get(ws)?.token
            }); // Preserve username

            for (let account of accounts) {
              if (account.username === username) {
                account.userId = newUserId;
              }
            }
            // Save accounts after a userId change in an account
            saveData(ACCOUNTS_FILE, accounts);

            ws.send(
              JSON.stringify({ type: "userIdTaken", newUserId: newUserId })
            );

            sendMessagesToClients();

            for (let client of wss.clients) {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: "userIdList", userIds }));
                if (client !== ws) {
                  client.send(
                    JSON.stringify({
                      type: "updateClients",
                      oldUserId: oldUserId,
                      newUserId: newUserId,
                    })
                  );
                }
              }
            }
          }
        }

        return;
      } else if (type === "delete") {
        if (devKey === DEV_KEY) {
          try {
            await deleteMessages();
          } catch (error) {
            console.log("error deleting messages", error);
          }

          ws.send(JSON.stringify({ type: "delete", status: "success" }));
        } else {
          ws.send(JSON.stringify({ type: "delete", status: "fail" }));
        }

        return;
      } else if (type === "signup") {
        if (username && password) {
          for (const account of accounts) {
            if (account.username === username) {
              ws.send(
                JSON.stringify({
                  type: "signup",
                  status: "fail",
                  message: "Username already exists",
                })
              );
              return;
            }
          }

          hashPassword(password).then((hashedPassword) => {
            const accountDetails = {
              username: username,
              password: hashedPassword,
              createdDate: new Date().toISOString(),
              userId: userId,
            };

            accounts.push(accountDetails);
            // Save accounts after signup
            saveData(ACCOUNTS_FILE, accounts);

            console.log(`Creating account ${username} for user ${userId}`);

            ws.send(
              JSON.stringify({
                type: "signup",
                status: "success",
                data: accountDetails,
              })
            );
          });
        }

        return;
      } else if (type === "login") {
        if (username && password) {
          let accountKeys = Object.values(accounts);
          for (const account of accountKeys) {
            if (account.username === username) {
              verifyPassword(password, account.password)
                .then((match) => {
                  if (match) {
                    ws.send(
                      JSON.stringify({
                        type: "login",
                        status: "success",
                        account: Object.fromEntries(
                          Object.entries(account).filter(
                            ([key, value]) => key !== "password"
                          )
                        ),
                      })
                    );
                    clients.set(ws, {
                      username: username,
                      userId: account.userId,
                      token: clients.get(ws)?.token
                    });
                    delete users[userId];
                    userIds[userIds.indexOf(userId)] = account.userId; // Add the actual logged-in userId

                    sendStatusToClients();
                    sendMessagesToClients();
                    console.log(`${userId} logged into account ${username}`);
                    //clients.set(ws, { userId: userId, username: username, token: clients.get(ws)?.token });
                  } else {
                    ws.send(
                      JSON.stringify({
                        type: "login",
                        status: "fail",
                        message: "Invalid credentials",
                      })
                    );
                  }
                })
                .catch((error) => {
                  console.error("Error verifying password:", error);
                  ws.send(
                    JSON.stringify({
                      type: "login",
                      status: "error",
                      message: "Error verifying password",
                    })
                  );
                });
              return;
            }
          }

          ws.send(
            JSON.stringify({
              type: "login",
              status: "fail",
              message: "Username not found",
            })
          );
        }

        return;
      } else if (type === "logout") {
        let newGeneratedUserId = generateUserId();

        userIds[userIds.indexOf(clients.get(ws)?.userId)] = newGeneratedUserId; // Add the actual logged-in userId

        clients.set(ws, { userId: newGeneratedUserId, token: clients.get(ws)?.token });

        delete users[userId];
        users[newGeneratedUserId] = ws;

        console.log(userIds);
        sendStatusToClients();

        console.log(`User ${userId} logged out of account`);

        ws.send(
          JSON.stringify({
            type: "logout",
            status: "success",
            userId: newGeneratedUserId,
          })
        );
      } else if (type === "deleteAccount") {
        if (username && password) {
          for (let [index, account] of accounts.entries()) {
            if (account.username === username) {
              verifyPassword(password, account.password).then((match) => {
                if (match) {
                  let conversationKeys = Object.keys(conversations);
                  for (let acc of conversationKeys) {
                    conversations[acc] = conversations[acc].filter(
                      (conversation) => {
                        return !(
                          conversation.includes(account.username) &&
                          conversation.includes(acc) &&
                          conversation.length <= 2
                        );
                      }
                    );
                  }
                  delete conversations[account.username];
                  // Save conversations after account deletion
                  saveData(CONVERSATIONS_FILE, conversations);

                  if (messages.length > 0) {
                    // Added check for length
                    messages = messages.filter(
                      (message) => message.senderUsername !== account.username
                    );

                    for (let message of messages) {
                      if (message.sendTo && Array.isArray(message.sendTo)) {
                        message.sendTo = message.sendTo.filter(
                          (user) => user !== account.userId
                        );
                      }
                    }

                    console.log(messages[0].sendTo);

                    messages = messages.filter((message) => {
                      if (Array.isArray(message.sendTo)) {
                        return !(
                          message.sendTo.length === 1 &&
                          message.sendTo[0] === message.senderId
                        );
                      }
                      return true; // Keep the message if sendTo is not an array
                    });

                    // Save messages after account deletion
                    saveData(MESSAGES_FILE, messages);
                  }

                  accounts.splice(index, 1);
                  // Save accounts after account deletion
                  saveData(ACCOUNTS_FILE, accounts);

                  ws.send(
                    JSON.stringify({
                      type: "deleteAccount",
                      status: "success",
                      message: `Deleted account ${username}`,
                    })
                  );

                  console.log(`Deleted account ${username}`);

                  sendMessagesToClients();

                  return;
                }
              });
            }
          }
        }

        ws.send(
          JSON.stringify({
            type: "deleteAccount",
            status: "fail",
            message: "Username not found",
          })
        );

        return;
      } else if (type === "createConversation") {
        let conversationCreated = false; // Flag to track if conversation was created
        for (let account1 of accounts) {
          if (account1.username === username) {
            for (let account2 of accounts) {
              if (
                account2.username !== username &&
                account2.userId === otherUser
              ) {
                let conversation = [];
                conversation.push(account1.username);
                conversation.push(account2.username);

                (conversations[account2.username] =
                  conversations[account2.username] || []).push(conversation);
                (conversations[account1.username] =
                  conversations[account1.username] || []).push(conversation);
                // Save conversations after creating a new one
                saveData(CONVERSATIONS_FILE, conversations);

                ws.send(
                  JSON.stringify({
                    type: "createConversation",
                    status: "success",
                    otherUser: otherUser,
                  })
                );
                conversationCreated = true;
                return; // Exit the loop and function once created
              }
            }
          }
        }
        // If we reach here, conversation was not created
        if (!conversationCreated) {
          ws.send(
            JSON.stringify({
              type: "createConversation",
              status: "fail",
              message: "UserId not found",
            })
          );
        }

        return;
      }

      console.log("Received message as string:", messageStr);

      try {
        // Parse the string as JSON to extract metadata
        const data = JSON.parse(messageStr); // This parsing was already done above for buffer path

        if (clients.get(ws)?.token != data.token) {
          ws.send(
            JSON.stringify({
              type: "ban",
              status: "error",
              message: "Access Denied",
            })
          );
          
          return;
        }

        console.log("Parsed data:", data);

        console.log("file data:", data.files);

        if (data.files && Array.isArray(data.files)) {
          let files = [];
          let fileTypes = [];

          let cumulativeSize = 0;

          // Calculate the size of all attached files cumulatively
          for (let file of data.files) {
            cumulativeSize += file.fileSize;
          }

          if (cumulativeSize > maxPayload) {
            // If file size exceeds the maxPayload
            ws.send(
              JSON.stringify({
                type: "error",
                message: "File size exceeds the maximum limit",
              })
            );
            return;
          }

          // Handling file data
          data.files.forEach((file, index) => {
            const { filename, fileData, fileSize, fileType } = file;
            const bufferedFileData = base64ToArrayBuffer(fileData);

            console.log("Received file:", filename, "File Size:", fileSize);

            // Ensure bufferedFileData is a Buffer, not a string
            if (bufferedFileData instanceof ArrayBuffer) {
              // Convert the ArrayBuffer to a Node.js Buffer for saving
              const bufferData = Buffer.from(bufferedFileData);

              // Generate a unique filename
              const fileName = `${Date.now()}-${crypto
                .randomBytes(8)
                .toString("hex")}-${filename}`;
              console.log(UPLOADS_DIR);
              const filePath = path.join(UPLOADS_DIR, fileName);

              // Save the file to disk
              fs.writeFile(filePath, bufferData, (err) => {
                if (err) {
                  console.error("Error saving file:", err);
                } else {
                  console.log(`File ${fileName} saved successfully.`);
                }
              });

              files.push(filePath);

              const fileInfo = {
                fileType: fileType,
                fileSize: fileSize,
                fileName: filename,
              };

              fileTypes.push(fileInfo);

              let imageUrl = `https://${subDomain}.glitch.me/uploads/${fileName}`;
              // handleFileScan(imageUrl); // Uncomment if clamav is installed
            } else {
              console.error("Invalid file data received.");
            }
          });

          messages.push({
            senderId: senderId,
            senderUsername: senderUsername,
            senderName: senderName,
            text: text,
            timestamp: timestamp,
            files: files,
            fileTypes: fileTypes,
            sendTo: sendTo,
          });
          // Save messages after a new message with files is added
          saveData(MESSAGES_FILE, messages);

          sendMessagesToClients();
        } else {
          // Handle case without files, just the text message
          console.log("Received text message:", data.text);

          messages.push({
            senderId: senderId,
            senderUsername: senderUsername,
            senderName: senderName,
            text: text,
            timestamp: timestamp,
            files: [],
            fileTypes: [],
            sendTo: sendTo,
          });
          // Save messages after a new text message is added
          saveData(MESSAGES_FILE, messages);

          sendMessagesToClients();
        }
      } catch (error) {
        console.error("Error parsing JSON message:", error);
      }
    } else {
      console.log("Received non-buffer message:", message);
    }
  });

  // Handle disconnection
  ws.on("close", () => {
    // Clean up the user from the list when they disconnect
    delete users[userId];
    let target = clients.get(ws)?.userId;
    userIds = userIds.filter((item) => item !== target);
    clients.delete(ws);
    clearInterval(pingInterval);
    console.log(`User with ID: ${userId} disconnected`);

    sendStatusToClients();
  });
});

const sendStatusToClients = () => {
  for (let client of wss.clients) {
    client.send(
      JSON.stringify({
        type: "usersOnline",
        users: userIds,
      })
    );
  }
};

// Function to send messages to clients
const sendMessagesToClients = () => {
  const currentMessages = [...messages]; // Make sure messages are current
  //console.log(currentMessages);

  for (let client of wss.clients) {
    let messagesToSend = [];
    for (let message of messages) {
      const clientInfo = clients.get(client);
      //console.log(clientInfo);
      if (
        (message.sendTo && message.sendTo.includes(clientInfo.userId)) ||
        !message.sendTo ||
        message.senderUsername === clientInfo.username
      ) {
        messagesToSend.push(message);
      }
    }
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({ type: "message", messages: messagesToSend })
      );
      console.log("Sending message to client", clients.get(client).userId);
    }
  }
};

function generateUserId() {
  let newUserId = 1000; // Start with 4 digits
  let foundId = false;
  while (!foundId) {
    if (userIds.includes(`User#${newUserId}`)) {
      foundId = false;
    } else {
      foundId = true;
      for (let account of accounts) {
        if (`User#${newUserId}` === account.userId) {
          foundId = false;
          break;
        }
      }
    }

    if (!foundId) newUserId++;
  }

  return `User#${newUserId}`;
}

function base64ToArrayBuffer(base64) {
  // Use Node.js Buffer for base64 to ArrayBuffer conversion
  const buffer = Buffer.from(base64, "base64");
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );
}

async function deleteFiles() {
  if (fs.existsSync(UPLOADS_DIR)) {
    const files = fs.readdirSync(UPLOADS_DIR);

    const deletePromises = files.map(async (file) => {
      const filePath = path.join(UPLOADS_DIR, file);

      try {
        // Using async version of stat
        const stats = await fs.promises.stat(filePath);
        if (stats.isFile()) {
          console.log(`Deleting file: ${filePath}`);
          await fs.promises.unlink(filePath);
          console.log(`Deleted file: ${filePath}`);
        }
      } catch (error) {
        console.error(`Error with file ${filePath}:`, error);
      }
    });

    // Wait for all deletions to complete
    await Promise.all(deletePromises);
    console.log("All files deleted");
  } else {
    console.log(`Directory ${UPLOADS_DIR} does not exist.`);
  }
}

async function deleteMessages() {
  messages = [];
  // Save messages after deletion
  saveData(MESSAGES_FILE, messages);

  const cacheKey = "messages";
  delete cache[cacheKey];

  await deleteFiles();

  console.log("All messages deleted");
}

async function hashPassword(password) {
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.error("Error hashing password:", error);
  }
}

async function verifyPassword(enteredPassword, storedPassword) {
  try {
    const isMatch = await bcrypt.compare(enteredPassword, storedPassword);
    if (isMatch) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error verifying password:", error);
    return false;
  }
}

// Function to download a file from a temporary URL
async function downloadFile(url, outputPath) {
  const writer = fs.createWriteStream(outputPath);

  const response = await axios({
    url,
    method: "GET",
    responseType: "stream", // This ensures the response is a readable stream (file)
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

// Function to scan the downloaded file with ClamAV
function scanFile(filePath) {
  // Pinging ClamAV daemon to ensure it's accessible
  // clamav.ping("127.0.0.1", 3310, (err) => {
  //   if (err) {
  //     console.error("ClamAV daemon is not running or unreachable:", err);
  //     return;
  //   }

  //   // Scan the file if ClamAV is reachable
  //   clamav.scanFile(filePath, (err, object) => {
  //     if (err) {
  //       console.error("Error during scan:", err);
  //       return;
  //     }

  //     if (object.isInfected) {
  //       console.log("File is infected!");
  //     } else {
  //       console.log("File is clean!");
  //     }

  //     // Clean up: delete the temporary file after scanning
  //     fs.unlinkSync(filePath);
  //   });
  // });
  console.warn(
    "ClamAV scanning is currently commented out. Ensure `clamav.js` is installed and configured if you want to use it."
  );
  fs.unlinkSync(filePath); // Delete the temp file even if ClamAV is commented out
}

// Main function that handles downloading and scanning
async function handleFileScan(tempFileUrl) {
  const tempFilePath = path.join(__dirname, "tempfile"); // Path to save the downloaded file

  try {
    // Step 1: Download the file from the temporary URL
    //await downloadFile(tempFileUrl, tempFilePath);
    console.log("File downloaded successfully");

    // Step 2: Scan the downloaded file with ClamAV
    scanFile(tempFilePath);
  } catch (error) {
    console.error("Error downloading or scanning the file:", error);
  }
}

// Start the HTTP server on the specified port
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
