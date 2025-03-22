// public/scripts/emoji-menu.js
const emojiButton = document.getElementById('emoji-button'); // Button to open emoji selector
const emojiMenu = document.getElementById('emoji-menu'); // Emoji menu
const emojiPicker = document.getElementById('emoji-picker'); // Emoji selector
const emojiInput = document.getElementById('chat-message-input'); // Input field the emojis are linked to

const emojis = {
    // Smileys & Emotions
    smileys: [
        "🙂", "😕", "🫤", "🙃", "😀", "😁", "😂", "🤣", "😃", "😄",
        "😅", "😆", "😉", "😊", "😋", "😎", "😍", "😘", "🥰", "😗",
        "😙", "🥲", "😚", "🤗", "🤩", "🤔", "🫡", "🤨", "😐", "😑",
        "😶", "🫥", "😶‍🌫️", "🙄", "😏", "😣", "😥", "😮", "🤐", "😯",
        "😪", "😫", "🥱", "😴", "😌", "😛", "😜", "😝", "🤤", "😒",
        "😓", "😔", "🫠", "🤑", "😲", "☹️", "🙁", "😖", "😞", "😟",
        "😤", "😢", "😭", "😦", "😧", "😨", "😩", "🤯", "😬", "😮‍💨",
        "😰", "😱", "🥵", "🥶", "😳", "🤪", "😵", "😵‍💫", "🥴", "😠",
        "😡", "🤬", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "😇", "🥳",
        "🥸", "🥺", "🥹", "🤠", "🤥", "🫨", "🙂‍↔️", "🙂‍↕️", "🤫", "🤭",
        "🫢", "🫣", "🧐", "🤓", "🤡", "😈", "👿", "👹", "👺", "💀",
        "☠️", "👻", "👽", "👾", "🤖", "💩"
    ],
  
    // Animals
    animals: [
        "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾", "🙈",
        "🙉", "🙊", "🐵", "🐶", "🐺", "🐱", "🦁", "🐯", "🦒", "🦊",
        "🦝", "🐮", "🐷", "🐗", "🐭", "🐹", "🐰", "🐻", "🐻‍❄️", "🐨",
        "🐼", "🐸", "🦓", "🐴", "🫎", "🫏", "🦄", "🐔", "🐲", "🐽",
        "🐾", "🐒", "🦍", "🦧", "🦮", "🐕‍🦺", "🐩", "🐕", "🐈", "🐈‍⬛",
        "🐅", "🐆", "🐎", "🦌", "🦬", "🦏", "🦛", "🐂", "🐃", "🐄",
        "🐖", "🐏", "🐑", "🐐", "🐪", "🐫", "🦙", "🦘", "🦥", "🦨",
        "🦡", "🐘", "🦣", "🐁", "🐀", "🦔", "🐇", "🐿️", "🦫", "🦎",
        "🐊", "🐢", "🐍", "🐉", "🦕", "🦖", "🦦", "🦈", "🐬", "🦭",
        "🐳", "🐋", "🐟", "🐠", "🐡", "🦐", "🦑", "🐙", "🦞", "🦀",
        "🐚", "🪸", "🪼", "🦆", "🐓", "🦃", "🦅", "🕊️", "🦢", "🦜",
        "🪽", "🐦‍⬛", "🪿", "🐦‍🔥", "🦩", "🦚", "🦉", "🦤", "🪶", "🐦",
        "🐧", "🐥", "🐤", "🐣", "🦇", "🦋", "🐌", "🐛", "🦟", "🪰",
        "🪱", "🦗", "🐜", "🪳", "🐝", "🪲", "🐞", "🦂", "🕷️", "🕸️",
        "🦠"
    ],
  
    // People
    people: [
        "👩", "👨", "👵", "👴", "👶", "🧒", "👧", "🧑", "👩", "👨",
        "👵", "👴", "👶", "🧒", "👧", "🧑", "👩", "👨", "👩", "👨",
        "👩", "👨", "👧", "👨", "👩", "👨", "👩", "👨", "👧", "👶",

        "👋", "🤚", "🖐️", "🖖", "👌", "✌️", "🤞", "🤟", "🤘", "👍",
        "👎", "👏", "🙌", "🤲", "🤝", "🙏", "👈", "👉", "👆", "👇",
        "🖖", "🤙", "👐", "🤲", "🫱", "🫲", "🫳", "🫴"
    ],
  
    // Celebrations & Objects
    celebrations: [
        "🎉", "🎊", "🎂", "🎁", "🎈", "🎨", "🎭", "🎤", "🎧", "🎬", 
        "🎮", "🎸", "🎷", "🎺", "🎻", "🎼", "🏆", "🥇", "🥈", "🥉", 
        "🏅", "🎽", "🥁", "🎪", "🎯", "🎮", "🏁", "🧩", "🎳", "🪅"
    ],
  
    // Food & Plants
    food: [
        "🍏", "🍎", "🍐", "🍑", "🍒", "🍓", "🍊", "🍋", "🍌", "🍉", 
        "🍇", "🍈", "🍉", "🍍", "🍉", "🍉", "🥥", "🍠", "🍔", "🍟", 
        "🍕", "🍗", "🍖", "🍜", "🍝", "🥨", "🍣", "🍛", "🍤", "🍥", 
        "🍝", "🥗", "🥘", "🍲", "🍮", "🍪", "🍩", "🍫", "🍬", "🍭"
    ],
  
    // Transport & Places
    transport: [
        "🚗", "🚙", "🚌", "🚎", "🚓", "🚑", "🚒", "🚐", "🚚", "🚛", 
        "🚜", "🚆", "🚇", "🚈", "🚉", "🚊", "🚉", "🚢", "🚤", "🚁", 
        "✈️", "🚀", "🛸", "🛶", "⛴", "🏍", "🚲", "🛴", "🚃", "🛳",
        "🏞", "🏕", "🏠", "🏡", "🏢", "🏣", "🏤", "🏥", "🏦", "🏨"
    ],
  
    // Symbols
    symbols: [
        "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", 
        "💕", "💞", "💗", "💖", "💘", "💌", "💋", "💍", "💎", "✨", 
        "🌟", "💫", "💥", "🔥", "💨", "💧", "🌪", "🌈", "☀️", "🌙", 
        "🌝", "🌚", "⭐", "⚡", "⚙️", "🔒", "🔓", "🔑", "🔨", "🔧", 
        "🔩", "⚙️", "🔋", "🔌", "🔮", "💡", "🔦", "🛠", "📦"
    ]
};

var activeInput = emojiInput;

document.querySelectorAll('input[type="text"]').forEach(input => {
    input.addEventListener('focus', () => {
        activeInput = input;  // Store the reference to the input field when it is focused
    });
});

function sortEmojis(category, containerId) {
    const container = document.getElementById(containerId);
    
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    emojis[category].forEach(emoji => {
        const div = document.createElement('div');
        div.textContent = emoji;
        div.className = 'emoji-option';

        div.addEventListener('click', () => {
            if (activeInput) {
                activeInput.value += emoji;  // Add emoji to the input value
                activeInput.focus();  // Ensure the input stays focused
            }
        });

        if (emoji === "👋") {
            const lineBreak = document.createElement("div");
            lineBreak.className = 'line-break';
            container.appendChild(lineBreak);
        }

        container.appendChild(div);
    });
}

const tabs = document.querySelectorAll('.tab');
function showTab(tabContent, tabId) {
    emojiPicker.style.overflow = 'hidden';
    emojiPicker.scrollTop = 0;

    tabs.forEach(tab => {
        tab.classList.remove('selected');
    });
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => {
        tab.style.display = 'none';  // Hide all tabs
    });

    const activeTabContent = document.getElementById(tabContent);
    if (activeTabContent) {
        activeTabContent.style.display = 'block';  // Show selected tab content
    }

    // Add selected class to the clicked tab
    const activeTab = document.getElementById(tabId);
    if (activeTab) {
        activeTab.classList.add('selected');  // Highlight the clicked tab
    }

    emojiPicker.style.overflow = '';
}

function setupEmojis() {
    tabs.forEach(tab => {
        var split = tab.id.split('-');

        var contentId = split[0];
        var arrayName = split[0];
        
        // Loop through the split array to build contentId and arrayName
        for (let i = 1; i < split.length - 1; i++) {
            contentId = contentId + '-' + split[i];
            arrayName = arrayName + split[i].charAt(0).toUpperCase() + split[i].slice(1).toLowerCase();
        }
        
        contentId = contentId + '-' + 'content';

        tab.addEventListener('click', () => { 
            showTab(contentId, tab.id);
        });

        // Sort each category
        sortEmojis(arrayName, contentId);

        // If the array is the first category in the 'emojis' object, then show the tab
        const emojiCategories = Object.keys(emojis);
        const arrayIndex = emojiCategories.indexOf(arrayName);
        
        if (arrayIndex === 0) {
            showTab(contentId, tab.id);
        }
    });
}

// Setup emoji menu
document.addEventListener('DOMContentLoaded', () => {
    setupEmojis();
});

// Toggle emoji picker visibility
emojiButton.addEventListener('click', () => {
    emojiMenu.style.display = emojiMenu.style.display === 'block' ? 'none' : 'block';

    if (emojiMenu.style.display != 'none') {
        const buttonRect = emojiButton.getBoundingClientRect();
        const pickerRect = emojiMenu.getBoundingClientRect();
    
        let newTop = buttonRect.bottom + window.scrollY + 10;
        let newLeft = buttonRect.left + window.scrollX;
    
        if (newTop + pickerRect.height > window.innerHeight) {
            newTop = buttonRect.top + window.scrollY - pickerRect.height - 10;
        }
    
        if (newLeft + pickerRect.width > window.innerWidth) {
            newLeft = buttonRect.left + window.scrollX - (pickerRect.width - buttonRect.width);
        }
    
        emojiMenu.style.top = `${newTop}px`;
        emojiMenu.style.left = `${newLeft}px`;
    }
});

// Close emoji picker if clicked outside
document.addEventListener('click', (e) => {
    if (!emojiButton.contains(e.target) && !emojiMenu.contains(e.target)) {
        emojiMenu.style.display = 'none';
    }
});