/**
 * Ashtaavadhaana Seva Page Script
 * Parses data/ashtaavadhaana.md, renders markdown content, collapsible explanations,
 * and sets up verse audio playback with TTS fallback.
 */

import { playVerseAudio, escapeAudioText } from '../modules/audio-player.js';

export async function loadMarkdownContent() {
    const container = document.getElementById('sevaContainer');
    if (!container) return;

    try {
        const response = await fetch('../data/ashtaavadhaana.md');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const rawMarkdown = await response.text();
        const markdownText = rawMarkdown.normalize ? rawMarkdown.normalize('NFC') : rawMarkdown;
        container.innerHTML = '';

        const mainSections = markdownText.split(/^##\s+/m);

        mainSections.forEach((section, index) => {
            if (index === 0) return;

            const subSections = section.split(/^###\s+/m);
            const mainBlock = subSections.shift();

            const mainLines = mainBlock.split('\n');
            const sectionTitle = mainLines.shift().trim();

            const verseLines = [];
            const explanationLines = [];

            mainLines.forEach(line => {
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

            const mainPlainText = verseLines.join(' ');
            const mainAudioPath = `../assets/audio/ashta_${index}.mp3`;

            const explanationHtml = typeof marked !== 'undefined'
                ? marked.parse(explanationLines.join('\n'))
                : explanationLines.map(l => `<p>${l.replace('*', '').trim()}</p>`).join('');

            let mainCollapsible = '';
            if (explanationLines.length > 0) {
                mainCollapsible = `
                    <details class="collapsible-section">
                        <summary class="collapsible-toggle">
                            <span>ವಿವರಣೆ ಮತ್ತು ಭಾವಾರ್ಥ</span>
                            <span class="toggle-icon">▼</span>
                        </summary>
                        <div class="collapsible-content">
                            ${explanationHtml}
                        </div>
                    </details>
                `;
            }

            let subBodyHtml = '';
            if (subSections.length > 0) {
                subBodyHtml += `<div class="seva-sub-body">`;

                subSections.forEach((subSec, subIndex) => {
                    const subLines = subSec.split('\n');
                    const subTitle = subLines.shift().trim();

                    const subVerses = [];
                    const subExplanations = [];
                    let isInvocation = false;

                    subLines.forEach(line => {
                        const trimmed = line.trim();
                        if (!trimmed) return;

                        if (trimmed.startsWith('>')) {
                            isInvocation = true;
                            subVerses.push(trimmed.replace('>', '').trim());
                        } else if (trimmed.startsWith('*')) {
                            subExplanations.push(line);
                        } else {
                            subVerses.push(trimmed);
                        }
                    });

                    const subVerseHtml = isInvocation
                        ? `<div class="invocation-box"><p>${subVerses.join(' ')}</p></div>`
                        : `<div class="verse-box">${subVerses.map(l => `<p class="verse-line">${l}</p>`).join('')}</div>`;

                    const subPlainText = subVerses.join(' ');
                    const subAudioPath = `../assets/audio/sub_${index}_${subIndex + 1}.mp3`;

                    const subExpHtml = typeof marked !== 'undefined'
                        ? marked.parse(subExplanations.join('\n'))
                        : subExplanations.map(l => `<p>${l.replace('*', '').trim()}</p>`).join('');

                    const escapedSubText = escapeAudioText(subPlainText);

                    subBodyHtml += `
                        <div class="audio-play-bar">
                            <h4>${subTitle}</h4>
                            <button class="audio-btn" data-audio-src="${subAudioPath}" data-audio-text="${escapedSubText}">
                                🔊 ಶ್ಲೋಕ ಆಲಿಸಿ
                            </button>
                        </div>
                        ${subVerseHtml}
                        ${subExpHtml ? `
                        <details class="collapsible-section">
                            <summary class="collapsible-toggle">
                                <span>ವಿವರಣೆ ಮತ್ತು ಭಾವಾರ್ಥ</span>
                                <span class="toggle-icon">▼</span>
                            </summary>
                            <div class="collapsible-content">
                                ${subExpHtml}
                            </div>
                        </details>` : ''}
                    `;
                });

                subBodyHtml += `</div>`;
            }

            const escapedMainText = escapeAudioText(mainPlainText);
            const mainAudioButtonHtml = verseLines.length > 0 ? `
                <button class="audio-btn" data-audio-src="${mainAudioPath}" data-audio-text="${escapedMainText}">
                    🔊 ಶ್ಲೋಕ ಆಲಿಸಿ
                </button>
            ` : '';

            const card = document.createElement('article');
            card.className = 'seva-card';
            card.innerHTML = `
                <div class="seva-header">
                    <h3 class="seva-title">${sectionTitle}</h3>
                    ${mainAudioButtonHtml}
                </div>
                <div class="seva-body">
                    ${verseLines.length > 0 ? `<div class="verse-box">${verseHtml}</div>` : ''}
                    ${mainCollapsible}
                    ${subBodyHtml}
                </div>
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
                <p class="error-help">(ಫೈಲ್ ಮಾರ್ಗ <code>../data/ashtaavadhaana.md</code> ಸರಿಯಾಗಿದೆಯೇ ಮತ್ತು ಸ್ಥಳೀಯ ಸರ್ವರ್ ಚಾಲನೆಯಲ್ಲಿದೆಯೇ ಎಂದು ಪರೀಕ್ಷಿಸಿ)</p>
            </div>`;
    }
}

document.addEventListener('DOMContentLoaded', loadMarkdownContent);
