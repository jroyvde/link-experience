
// Translation + Speech Recognition ES module
// Exports:
//   - getTranslation(text[, endpoint]) -> Promise<{untranslated, translated, raw} | {error}>
//   - createRecognizer(options) -> { start(), stop(), isListening, destroy(), setCallbacks() }

export const defaultConfig = {
    translateEndpoint: '/translate',
    interimResults: false,
    continuous: true,
    lang: undefined,
};

export function getTranslation(text, endpointOrCallback, maybeCallback) {
    let endpoint = defaultConfig.translateEndpoint;
    let callback = undefined;
    if (typeof endpointOrCallback === 'function') {
        callback = endpointOrCallback;
    } else if (typeof endpointOrCallback === 'string') {
        endpoint = endpointOrCallback;
        if (typeof maybeCallback === 'function') callback = maybeCallback;
    }

    const promise = fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) return { error: data.error };
            const translatedText = typeof data.translated_text === 'string' ? data.translated_text : '';
            const parts = translatedText.split(/\r?\n/);
            return {
                untranslated: parts[0] || '',
                translated: parts[1] || '',
                raw: data,
            };
        })
        .catch(err => ({ error: err && err.message ? err.message : String(err) }));

    if (typeof callback === 'function') {
        promise.then(result => callback(result));
    }

    return promise;
}

export function createRecognizer(options = {}) {
    const cfg = Object.assign({}, defaultConfig, options);

    const SpeechRecognition = (typeof window !== 'undefined') ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    if (!SpeechRecognition) {
        return {
            error: 'SpeechRecognition not supported',
            start() { throw new Error('SpeechRecognition not supported'); },
            stop() {},
            isListening: false,
            destroy() {},
        };
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = !!cfg.continuous;
    recognition.interimResults = !!cfg.interimResults;
    if (cfg.lang) recognition.lang = cfg.lang;

    let isListening = false;
    let ons = {
        onInterim: typeof cfg.onInterim === 'function' ? cfg.onInterim : null,
        onFinal: typeof cfg.onFinal === 'function' ? cfg.onFinal : null,
        onStart: typeof cfg.onStart === 'function' ? cfg.onStart : null,
        onEnd: typeof cfg.onEnd === 'function' ? cfg.onEnd : null,
        onError: typeof cfg.onError === 'function' ? cfg.onError : null,
    };

    recognition.onstart = () => {
        isListening = true;
        if (ons.onStart) ons.onStart();
    };

    recognition.onend = () => {
        isListening = false;
        if (ons.onEnd) ons.onEnd();
    };

    recognition.onerror = (ev) => {
        if (ons.onError) ons.onError(ev);
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const result = event.results[i];
            const transcript = (result[0] && result[0].transcript) ? result[0].transcript : '';
            if (result.isFinal) {
                if (ons.onFinal) ons.onFinal(transcript.trim());
            } else {
                interimTranscript += transcript;
            }
        }
        if (interimTranscript && ons.onInterim) ons.onInterim(interimTranscript);
    };

    return {
        start() { recognition.start(); },
        stop() { recognition.stop(); },
        destroy() { try { recognition.stop(); } catch (e) {} },
        get isListening() { return isListening; },
        setCallbacks(cbs = {}) {
            if (typeof cbs.onInterim === 'function') ons.onInterim = cbs.onInterim;
            if (typeof cbs.onFinal === 'function') ons.onFinal = cbs.onFinal;
            if (typeof cbs.onStart === 'function') ons.onStart = cbs.onStart;
            if (typeof cbs.onEnd === 'function') ons.onEnd = cbs.onEnd;
            if (typeof cbs.onError === 'function') ons.onError = cbs.onError;
        }
    };
}
