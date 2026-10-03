/**
 * References Page Script
 * Loads data/references.md and renders markdown content.
 */

export async function loadReferencesMarkdown() {
    const contentSection = document.getElementById('referencesContent');
    if (!contentSection) return;

    try {
        const response = await fetch('../data/references.md');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const rawMarkdown = await response.text();
        const markdownText = rawMarkdown.normalize ? rawMarkdown.normalize('NFC') : rawMarkdown;

        let rawHtml = typeof marked !== 'undefined' ? marked.parse(markdownText) : markdownText;

        rawHtml = rawHtml.replace(/<blockquote>\s*<p>(.*?)<\/p>\s*<\/blockquote>/gi, '<div class="note-box highlight"><p>$1</p></div>');

        contentSection.innerHTML = rawHtml;

    } catch (error) {
        console.error('Error loading references.md:', error);
        contentSection.innerHTML = `
            <div class="error-box">
                <p><strong>ಮಾಹಿತಿಯನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.</strong></p>
                <p class="error-help">(ಫೈಲ್ ಮಾರ್ಗ <code>../data/references.md</code> ಸರಿಯಾಗಿದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ)</p>
            </div>`;
    }
}

document.addEventListener('DOMContentLoaded', loadReferencesMarkdown);
