// Function to send a message
const sendMessage = async () => {
    const userInput = document.getElementById('user-input').value;
    const chatBox = document.getElementById('chat-box');

    if (userInput.trim() === "") return;

    // Display user message in chat box
    chatBox.innerHTML += `<div class="message user"><strong>You:</strong> ${userInput}</div>`;
    console.log("User message displayed:", userInput);
    // Clear input field
    document.getElementById('user-input').value = "";

    // Scroll to the bottom of the chat box
    chatBox.scrollTop = chatBox.scrollHeight;

    // Send message to backend
    try {
        const response = await fetch('https://gmail-assistant.onrender.com/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: userInput }),
        });

        const data = await response.json();
        console.log("Response from backend:", data);
       
        chatBox.innerHTML += `<div class="message bot"><strong>Bot:</strong> ${data.response}</div>`;
 
        console.log("Bot response displayed:", data.response);

        // Scroll to the bottom of the chat box after bot response
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (error) {
        console.error('Error:', error);
        chatBox.innerHTML += `<div class="message bot"><strong>Bot:</strong> Sorry, something went wrong.</div>`;
    }
};

// Send message when the "Send" button is clicked
document.getElementById('send-btn').addEventListener('click', sendMessage);

// Send message when the "Enter" key is pressed
document.getElementById('user-input').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent the default behavior (e.g., new line in a textarea)
        sendMessage();
    }
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "chatbotResponse") {
        const chatBox = document.getElementById('chat-box');
        chatBox.innerHTML += `<div class="message bot"><strong>Bot:</strong> ${message.content}</div>`;
        console.log("Bot response displayed:", message.content);

        // Scroll to the bottom of the chat box after bot response
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});
