//// contentScript.js
let button = document.createElement("button");


button.classList.add("extension-button");

// Create an image element
let iconImage = document.createElement("img");
iconImage.src = chrome.runtime.getURL("icons/gmail.svg"); // Correct path
iconImage.alt = "Gmail Assistant";

// Append the image inside the button
button.appendChild(iconImage);

// Apply styles to button
button.style.position = "fixed";
button.style.bottom = "5px";
button.style.right = "5px";
button.style.zIndex = "1000";
button.style.border = "none";
button.style.background = "transparent";
button.style.padding = "0";
button.style.cursor = "pointer";

// Apply styles to image
iconImage.style.width = "30px";
iconImage.style.height = "30px";
iconImage.style.backgroundColor = "#ebccff";
iconImage.style.borderRadius = "50%";
iconImage.style.padding = "9px";
iconImage.style.objectFit = "contain";
iconImage.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
iconImage.style.transition = "background-color 0.3s ease, transform 0.3s ease";

document.body.appendChild(button);

// Function to get email content
function getEmailContent() {
    const emailBody = document.querySelector('div[role="main"] .a3s.aiL');
    return emailBody ? emailBody.innerText : null;
}

// Create a mutation observer to watch for email changes
const observer = new MutationObserver(() => {
    const emailContent = getEmailContent(); // Get the new email content
    if (emailContent) {
        // Update the stored email content
        chrome.storage.local.set({ 'latestEmailContent': emailContent }, () => {
            console.log('Email content updated');
        });
    }
});

// Configure the observer to watch for changes in the email container
const config = { 
    childList: true, 
    subtree: true,
    characterData: true 
};

// Start observing the email container
const emailContainer = document.querySelector('div[role="main"]');
if (emailContainer) {
    observer.observe(emailContainer, config);
}

button.addEventListener("click", () => {
    const emailContent = getEmailContent(); // Get current email content
    if (emailContent) {
        // Store the latest email content
        chrome.storage.local.set({ 'latestEmailContent': emailContent }, () => {
            console.log('Email content stored');
        });
        
        sendEmailContent();
    }
    
    // Remove existing chat window if it exists
    const existingChat = document.getElementById("chatWindow");
    if (existingChat) {
        existingChat.remove();
    }

    // Create new chat window
    const chatWindow = document.createElement("div");
    chatWindow.id = "chatWindow";
    chatWindow.style.position = "fixed";
    chatWindow.style.bottom = "70px";  // Adjusted to accommodate button
    chatWindow.style.right = "20px";
    chatWindow.style.width = "350px";
    chatWindow.style.height = "400px";
    chatWindow.style.background = "white";
    chatWindow.style.border = "1px solid #ccc";
    // chatWindow.style.boxShadow = "0px 4px 6px rgba(0,0,0,0.1)";
    chatWindow.style.zIndex = "999";
    chatWindow.style.overflow = "hidden";
    chatWindow.style.padding = "0px";
    chatWindow.style.borderRadius = "10px";
    chatWindow.style.scrolling = "no";

    // Create iframe for chat content
    const iframe = document.createElement("iframe");
    iframe.width = "100%";
    iframe.height = "400px";
    iframe.src = chrome.runtime.getURL("popup.html");
    iframe.frameBorder = "0";
    iframe.style.cssText = "overflow: hidden; scrolling: no;";
    

    // Create close button
    const closeButton = document.createElement("button");
    closeButton.textContent = "×";
    closeButton.style.position = "absolute";
    closeButton.style.top = "5px";
    closeButton.style.right = "5px";
    closeButton.style.background = "#6a0dad";
    closeButton.style.color = "white";
    closeButton.style.border = "none";
    closeButton.style.padding = "5px 10px";
    closeButton.style.cursor = "pointer";
    closeButton.style.borderRadius = "3px";

    closeButton.onclick = () => {
        chatWindow.remove();
    };

    chatWindow.appendChild(closeButton);
    chatWindow.appendChild(iframe);
    document.body.appendChild(chatWindow);
});

// Function to get email content
function getEmailContent() {
    const emailBody = document.querySelector('div[role="main"] .a3s.aiL');
    return emailBody ? emailBody.innerText : null;
}

// Update the sendEmailContent function
function sendEmailContent() {
    chrome.storage.local.get(['latestEmailContent'], function(result) {
        if (result.latestEmailContent) {
            chrome.runtime.sendMessage({
                type: "emailContent",
                content: result.latestEmailContent
            });
        }
    });
}


// Function to initialize the button and observer
function initializeExtension() {
    // Create and append button if it doesn't exist
    if (!document.getElementById('chatbotButton')) {
        const button = document.createElement('button');
        // button.id = 'chatbotButton';
        // button.innerHTML = '💬 Gmail Assistant';
        // button.style.position = 'fixed';
        // button.style.bottom = '20px';
        // button.style.right = '20px';
        // button.style.zIndex = '9999';
        // button.style.padding = '12px 20px';
        // button.style.backgroundColor = "#4285F4"
        // button.style.color = 'white';
        // button.style.border = 'none';
        // button.style.borderRadius = '5px';
        // button.style.cursor = 'pointer';
        // button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        // button.style.transition = 'all 0.3s ease-in-out';
        // document.body.appendChild(button);
        button.classList.add("extension-button");

        // Create an image element
        let iconImage = document.createElement("img");
        iconImage.src = chrome.runtime.getURL("icons/gmail.svg"); // Correct path
        iconImage.alt = "Gmail Assistant";

        // Append the image inside the button
        button.appendChild(iconImage);

        // Apply styles to button
        button.style.position = "fixed";
        button.style.bottom = "5px";
        button.style.right = "5px";
        button.style.zIndex = "1000";
        button.style.border = "none";
        button.style.background = "transparent";
        button.style.padding = "5px";
        button.style.cursor = "pointer";

        // Apply styles to image
        iconImage.style.width = "35px";
        iconImage.style.height = "35px";
        iconImage.style.backgroundColor = "#ebccff";
        iconImage.style.borderRadius = "50%";
        iconImage.style.padding = "3px";
        iconImage.style.objectFit = "contain";
        iconImage.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
        iconImage.style.transition = "background-color 0.3s ease, transform 0.3s ease";

        // Add click event listener
        button.addEventListener("click", handleButtonClick);
    }

    // Set up email content observer
    setupEmailObserver();
}

// Function to set up the email observer
function setupEmailObserver() {
    const observer = new MutationObserver((mutations) => {
        const emailContent = getEmailContent();
        if (emailContent) {
            chrome.storage.local.set({ 'latestEmailContent': emailContent }, () => {
                console.log('Email content updated automatically');
                // Update existing chat window if it's open
                updateChatWindow();
            });
        }
    });

    // Configure the observer
    const config = { 
        childList: true, 
        subtree: true,
        characterData: true 
    };

    // Start observing the email container
    function observeEmails() {
        const emailContainer = document.querySelector('div[role="main"]');
        if (emailContainer) {
            observer.observe(emailContainer, config);
            console.log('Observer started');
        } else {
            // If container not found, retry after a short delay
            setTimeout(observeEmails, 1000);
        }
    }

    observeEmails();
}

// Function to handle button click
function handleButtonClick() {
    const emailContent = getEmailContent();
    if (emailContent) {
        chrome.storage.local.set({ 'latestEmailContent': emailContent }, () => {
            console.log('Email content stored on button click');
        });
        
        sendEmailContent();
    }
    
    // Remove existing chat window if it exists
    const existingChat = document.getElementById("chatWindow");
    if (existingChat) {
        existingChat.remove();
    }

    createChatWindow();
}

// Function to create chat window
function createChatWindow() {
    const chatWindow = document.createElement("div");
    chatWindow.id = "chatWindow";
    chatWindow.style.position = "fixed";
    chatWindow.style.bottom = "60px";  // Adjusted to accommodate button
    chatWindow.style.right = "20px";
    chatWindow.style.width = "350px";
    chatWindow.style.height = "400px";
    chatWindow.style.background = "white";
    chatWindow.style.border = "1px solid #ccc";
    chatWindow.style.boxShadow = "0px 4px 6px rgba(0,0,0,0.1)";
    chatWindow.style.zIndex = "999";
    chatWindow.style.overflow = "auto";
    chatWindow.style.padding = "0px";
    chatWindow.style.borderRadius = "10px";

    // Create iframe for chat content
    const iframe = document.createElement("iframe");
    iframe.src = chrome.runtime.getURL("popup.html");
    iframe.frameBorder = "0";
    iframe.width = "100%";
    iframe.height = "400px";

    // Create close button
    const closeButton = document.createElement("button");
    closeButton.textContent = "×";
    closeButton.style.position = "absolute";
    closeButton.style.top = "5px";
    closeButton.style.right = "5px";
    closeButton.style.background = "red";
    closeButton.style.color = "white";
    closeButton.style.border = "none";
    closeButton.style.padding = "5px 10px";
    closeButton.style.cursor = "pointer";
    closeButton.style.borderRadius = "3px";

    closeButton.onclick = () => {
        chatWindow.remove();
    };

    chatWindow.appendChild(closeButton);
    chatWindow.appendChild(iframe);
    document.body.appendChild(chatWindow);
}

// Function to update existing chat window
function updateChatWindow() {
    const chatWindow = document.getElementById("chatWindow");
    if (chatWindow) {
        const iframe = chatWindow.querySelector('iframe');
        if (iframe) {
            // Notify iframe about content update
            iframe.contentWindow.postMessage({ 
                type: 'emailContentUpdate',
                content: getEmailContent()
            }, '*');
        }
    }
}

// Initialize when the page loads
initializeExtension();

// Listen for navigation events
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        console.log('URL changed, reinitializing extension');
        initializeExtension();
    }
}).observe(document, { subtree: true, childList: true });

// Listen for messages from the iframe
window.addEventListener('message', (event) => {
    if (event.data.type === 'requestEmailContent') {
        const emailContent = getEmailContent();
        if (emailContent) {
            event.source.postMessage({
                type: 'emailContentUpdate',
                content: emailContent
            }, '*');
        }
    }
});



let isDragging = false, offsetX, offsetY;

button.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - button.getBoundingClientRect().left;
    offsetY = e.clientY - button.getBoundingClientRect().top;
});

document.addEventListener("mousemove", (e) => {
    if (isDragging) {
        button.style.left = e.clientX - offsetX + "px";
        button.style.top = e.clientY - offsetY + "px";
        button.style.right = "auto"; // Reset right positioning
        button.style.bottom = "auto";
    }
});

document.addEventListener("mouseup", () => {
    isDragging = false;
});


button.onmouseover = function() {
    button.style.transform = "scale(1.1)"; // Slightly enlarge on hover
};

button.onmouseout = function() {
    button.style.transform = "scale(1)"; // Reset size when mouse leaves
};

button.onclick = function() {
    button.style.transform = "translateX(-10px)"; // Slide left when clicked
    setTimeout(() => {
        button.style.transform = "translateX(0)"; // Reset after sliding
    }, 200);
};

