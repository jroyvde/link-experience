import { createRecognizer, getTranslation } from './translation.js';

document.addEventListener('DOMContentLoaded', () => {
    const recordBtn = document.getElementById('record-btn');
    const recordIcon = document.getElementById('record-icon');
    const chatContainer = document.getElementById('chat-container');

    let recognizer = null;
    let isListening = false;

    recognizer = createRecognizer({
        interimResults: false,
        continuous: true,
        onInterim: (text) => {
            // we don't show interim results in the page UI, but could in future
        },
        onFinal: (finalText) => {
            const recognizedText = (finalText || '').trim();
            if (recognizedText) {
                appendMessage('user', recognizedText);
                getTranslation(recognizedText).then(result => {
                    if (result && result.error) {
                        appendMessage('translator', `Error: ${result.error}`);
                    } else {
                        appendMessage('translator', `${result.untranslated}\n${result.translated}`);
                    }
                });
            }
        },
        onStart: () => {
            isListening = true;
            recordBtn.classList.add('is-listening');
            recordIcon.className = 'fas fa-stop';
        },
        onEnd: () => {
            isListening = false;
            recordBtn.classList.remove('is-listening');
            recordIcon.className = 'fas fa-microphone';
        },
        onError: (e) => {
            console.error('Recognizer error', e);
        }
    });

    recordBtn.addEventListener('click', () => {
        if (!recognizer) return;
        if (recognizer.isListening) {
            recognizer.stop();
        } else {
            // Clear the initial status message on first run
            const initialStatus = chatContainer.querySelector('.status-message');
            if (initialStatus) initialStatus.remove();
            recognizer.start();
        }
    });

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