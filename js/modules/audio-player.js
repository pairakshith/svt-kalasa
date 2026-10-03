/**
 * Reusable Audio Player Engine with Web Speech TTS Fallback
 * Handles path resolution, audio playing/stopping, UI button state, and string escaping.
 */

let currentAudio = null;
let activeAudioBtn = null;

/**
 * Escapes text safely for inline HTML attribute string literals.
 * @param {string} str 
 * @returns {string}
 */
export function escapeAudioText(str) {
    if (!str) return '';
    return str
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/"/g, '&quot;')
        .replace(/'/g, "\\'")
        .replace(/\n/g, ' ')
        .replace(/\r/g, '');
}

/**
 * Resolves standard audio asset path relative to pages/ or root.
 * @param {string} filename E.g. "ashta_1.mp3" or "sub_8_1.mp3" or relative path
 * @returns {string}
 */
export function resolveAudioPath(filename) {
    if (!filename) return '';
    if (filename.startsWith('http://') || filename.startsWith('https://')) return filename;
    if (filename.includes('/')) return filename;
    
    const isInPages = window.location.pathname.includes('/pages/');
    const basePath = isInPages ? '../assets/audio/' : 'assets/audio/';
    return `${basePath}${filename}`;
}

/**
 * Plays pre-recorded MP3 audio or falls back to Web Speech API TTS.
 * @param {string} audioPath Path to the MP3 file
 * @param {string} plainText Plain text to speak if audio file is unavailable
 * @param {HTMLElement} btnEl The button element triggering playback
 */
export function playVerseAudio(audioPath, plainText, btnEl) {
    if (currentAudio && activeAudioBtn === btnEl) {
        currentAudio.pause();
        resetAudioButton(btnEl);
        currentAudio = null;
        activeAudioBtn = null;
        return;
    }

    if (currentAudio) {
        currentAudio.pause();
        if (activeAudioBtn) resetAudioButton(activeAudioBtn);
    }
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }

    currentAudio = new Audio(audioPath);
    activeAudioBtn = btnEl;
    btnEl.classList.add('playing');
    btnEl.innerHTML = '⏸️ ನಿಲ್ಲಿಸಿ (Stop)';

    currentAudio.play().then(() => {
        currentAudio.onended = () => {
            resetAudioButton(btnEl);
            currentAudio = null;
            activeAudioBtn = null;
        };
    }).catch(() => {
        console.warn(`Audio file missing at ${audioPath}, falling back to Web Speech TTS.`);
        playSpeechTTS(plainText, btnEl);
    });
}

/**
 * Fallback Speech Synthesis (TTS) in Kannada / Sanskrit.
 * @param {string} text Text to read
 * @param {HTMLElement} btnEl Button element
 */
export function playSpeechTTS(text, btnEl) {
    if (!('speechSynthesis' in window)) {
        alert("ನಿಮ್ಮ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಶ್ರವಣ ಸೌಲಭ್ಯ ಲಭ್ಯವಿಲ್ಲ.");
        resetAudioButton(btnEl);
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = voices.find(v => v.lang.startsWith('sa') || v.lang.startsWith('hi') || v.lang.startsWith('kn'));
    
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.lang = 'kn-IN';
    utterance.rate = 0.85;

    utterance.onend = () => {
        resetAudioButton(btnEl);
        currentAudio = null;
        activeAudioBtn = null;
    };

    utterance.onerror = () => {
        resetAudioButton(btnEl);
        currentAudio = null;
        activeAudioBtn = null;
    };

    window.speechSynthesis.speak(utterance);
}

/**
 * Resets the button UI state after audio stops.
 * @param {HTMLElement} btn 
 */
export function resetAudioButton(btn) {
    if (!btn) return;
    btn.classList.remove('playing');
    btn.innerHTML = '🔊 ಶ್ಲೋಕ ಆಲಿಸಿ';
}

if (typeof window !== 'undefined') {
    window.playVerseAudio = playVerseAudio;
    window.playSpeechTTS = playSpeechTTS;
    window.resetAudioButton = resetAudioButton;
}
