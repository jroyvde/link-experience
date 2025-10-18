console.log("Translation script.js is running!")

let recordBtn
let recordIcon
let chatContainer

document.addEventListener('DOMContentLoaded', () => {
    recordBtn = document.getElementById('record-btn');
    recordIcon = document.getElementById('record-icon');
    chatContainer = document.getElementById('chat-container');
});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
    appendMessage('status', "Sorry, your browser doesn't support Speech Recognition.");
    recordBtn.disabled = true;
}

const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = false; // We only want the final, confirmed result

let isListening = false;

recognition.onstart = () => {
    isListening = true;
    recordBtn.classList.add('is-listening');
    recordIcon.className = 'fas fa-stop';
};

recognition.onend = () => {
    isListening = false;
    recordBtn.classList.remove('is-listening');
    recordIcon.className = 'fas fa-microphone';
};

// This is the core logic now
recognition.onresult = (event) => {
    const lastResult = event.results[event.results.length - 1];
    if (lastResult.isFinal) {
        const recognizedText = lastResult[0].transcript.trim();
        if (recognizedText) {
            appendMessage('user', recognizedText);
            getTranslation(recognizedText);
        }
    }
};

recordBtn.addEventListener('click', () => {
    if (isListening) {
        recognition.stop();
    } else {
        // Clear the initial status message on first run
        const initialStatus = chatContainer.querySelector('.status-message');
        if (initialStatus) {
            initialStatus.remove();
        }
        recognition.start();
    }
});

function getTranslation(text, callback) {
    fetch('/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text }),
    })
    .then(response => response.json())
    .then(data => {
        if (typeof callback === 'function') {
            if (data.error) {
                callback({ error: data.error });
            } else {
                // Split translated_text into two lines
                let original = '';
                let translated = '';
                if (typeof data.translated_text === 'string') {
                    const parts = data.translated_text.split(/\r?\n/);
                    original = parts[0] || '';
                    translated = parts[1] || '';
                }
                callback({
                    original,
                    translated
                });
            }
        } else {
            if (data.error) {
                appendMessage('translator', `Error: ${data.error}`);
            } else {
                appendMessage('translator', data.translated_text);
            }
        }
    })
    .catch(error => {
        console.error('Translation fetch error:', error);
        if (typeof callback === 'function') {
            callback({ error: 'Error connecting to the server.' });
        } else {
            appendMessage('translator', 'Error connecting to the server.');
        }
    });
}

// Export getTranslation for module use and global access
if (typeof window !== 'undefined') {
    window.getTranslation = getTranslation;
    console.log("Decided not to export.")
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getTranslation };
    console.log("Decided to export!")
}

function appendMessage(sender, text) {
    const messageBubble = document.createElement('div');
    messageBubble.classList.add('message-bubble');

    if (sender === 'user') {
        messageBubble.classList.add('user-message');
    } else if (sender === 'translator') {
        messageBubble.classList.add('translator-message');
    } else {
        messageBubble.classList.add('status-message');
    }
    
    // Use innerText to prevent HTML injection, but then replace newlines
    messageBubble.innerText = text;
    messageBubble.innerHTML = messageBubble.innerHTML.replace(/\n/g, '<br>');

    chatContainer.appendChild(messageBubble);
    // Automatically scroll to the newest message
    chatContainer.scrollTop = chatContainer.scrollHeight;
}
