// public/scripts/tools.js
window.formatUTCTo12Hour = function (utcTimestamp) {
  const date = new Date(utcTimestamp);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

window.formatFileSize = function (bytes) {
  const units = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);

  return `${size.toFixed(2).replace(/\.00$/, "")} ${units[i]}`;
};

window.arrayBufferToBase64 = function (buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
};

window.base64ToArrayBuffer = function (base64) {
  const binary = atob(base64);
  const length = binary.length;
  const buffer = new ArrayBuffer(length);
  const view = new Uint8Array(buffer);

  for (let i = 0; i < length; i++) {
    view[i] = binary.charCodeAt(i);
  }

  return buffer;
};
