/**
 * Deevatige Salaam Page Script
 * Parses data/deevatige_salaam.md, renders verses & collapsibles, and plays section audio with TTS fallback.
 */

import { playVerseAudio, escapeAudioText } from '../modules/audio-player.js';

export async function loadMarkdownContent() {
    const container = document.getElementById('sevaContainer');
    if (!container) return;

    try {
        const response = await fetch('../data/deevatige_salaam.md');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const rawMarkdown = await response.text();
        const markdownText = rawMarkdown.normalize ? rawMarkdown.normalize('NFC') : rawMarkdown;
        container.innerHTML = '';

        const sections = markdownText.split(/^##\s+/m);

        sections.forEach((section, index) => {
            if (index === 0) return;

            const rawLines = section.split('\n');
            const sectionTitle = rawLines.shift().trim();

            const verseLines = [];
            const explanationLines = [];

            rawLines.forEach(line => {
                const trimmedLine = line.trim();
                if (!trimmedLine) return;

                if (trimmedLine.startsWith('*')) {
                    explanationLines.push(line);
                } else {
                    verseLines.push(trimmedLine);
                }
            });

            const verseHtml = verseLines
                .map(line => `<p class="verse-line">${line}</p>`)
                .join('');

            const versePlainText = verseLines.join(' ');
            const audioPath = `../assets/audio/salaam_${index}.mp3`;

            const explanationHtml = typeof marked !== 'undefined'
                ? marked.parse(explanationLines.join('\n'))
                : explanationLines.map(l => `<p>${l.replace('*', '').trim()}</p>`).join('');

            const escapedText = escapeAudioText(versePlainText);

            const card = document.createElement('article');
            card.className = 'seva-card';
            card.innerHTML = `
                <div class="seva-body">
                    <div class="audio-play-bar">
                        <h3>${sectionTitle}</h3>
                        <button class="audio-btn" data-audio-src="${audioPath}" data-audio-text="${escapedText}">
                            🔊 ಶ್ಲೋಕ ಆಲಿಸಿ
                        </button>
                    </div>
                    <div class="verse-box">
                        ${verseHtml}
                    </div>
                </div>
                ${explanationLines.length > 0 ? `
                <details class="collapsible-section">
                    <summary class="collapsible-toggle">
                        <span>ವಿವರಣೆ ಮತ್ತು ಭಾವಾರ್ಥ</span>
                        <span class="toggle-icon">▼</span>
                    </summary>
                    <div class="collapsible-content">
                        ${explanationHtml}
                    </div>
                </details>` : ''}
            `;

            container.appendChild(card);
        });

        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.audio-btn');
            if (!btn) return;
            const audioSrc = btn.getAttribute('data-audio-src');
            const audioText = btn.getAttribute('data-audio-text') || '';
            playVerseAudio(audioSrc, audioText, btn);
        });

    } catch (error) {
        console.error('Error loading markdown:', error);
        container.innerHTML = `
            <div class="error-box">
                <p><strong>ಮಾಹಿತಿಯನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.</strong></p>
                <p class="error-help">(ಫೈಲ್ ಮಾರ್ಗ <code>../data/deevatige_salaam.md</code> ಸರಿಯಾಗಿದೆಯೇ ಮತ್ತು ಸ್ಥಳೀಯ ಸರ್ವರ್ ಚಾಲನೆಯಲ್ಲಿದೆಯೇ ಎಂದು ಪರೀಕ್ಷಿಸಿ)</p>
            </div>`;
    }
}

document.addEventListener('DOMContentLoaded', loadMarkdownContent);
