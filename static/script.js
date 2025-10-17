document.addEventListener('DOMContentLoaded', () => {
    const recordBtn = document.getElementById('record-btn');
    const recordIcon = document.getElementById('record-icon');
    const chatContainer = document.getElementById('chat-container');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        appendMessage('status', "Sorry, your browser doesn't support Speech Recognition.");
        recordBtn.disabled = true;
        return;
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

    function getTranslation(text) {
        fetch('/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                appendMessage('translator', `Error: ${data.error}`);
            } else {
                appendMessage('translator', data.translated_text);
            }
        })
        .catch(error => {
            console.error('Translation fetch error:', error);
            appendMessage('translator', 'Error connecting to the server.');
        });
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
});