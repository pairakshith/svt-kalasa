/**
 * Temple Background / History Page Script
 * Loads data/temple_background.md and filters markdown cards based on category tabs.
 */

let parsedSections = [];

export async function loadMarkdownData() {
    const displayContainer = document.getElementById('content-display');
    if (!displayContainer) return;

    try {
        const response = await fetch('../data/temple_background.md');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const rawMarkdown = await response.text();
        const normalizedMarkdown = rawMarkdown.normalize ? rawMarkdown.normalize('NFC') : rawMarkdown;

        const rawBlocks = normalizedMarkdown.split('---');

        parsedSections = rawBlocks.map(block => {
            const categoryMatch = block.match(/# CATEGORY:\s*(\w+)/);
            const category = categoryMatch ? categoryMatch[1].trim() : 'all';

            const cleanMarkdown = block.replace(/# CATEGORY:\s*\w+/, '').trim();

            return {
                category: category,
                htmlContent: typeof marked !== 'undefined' ? marked.parse(cleanMarkdown) : cleanMarkdown
            };
        }).filter(sec => sec.htmlContent.length > 0);

        renderFilteredHtml('all');

    } catch (error) {
        console.error('Markdown load error:', error);
        displayContainer.innerHTML = `
            <div class="error-box">
                <p><strong>ಮಾಹಿತಿಯನ್ನು ಲೋಡ್ ಮಾಡುವಲ್ಲಿ ದೋಷ ಸಂಭವಿಸಿದೆ.</strong></p>
                <p class="error-help">(ಫೈಲ್ ಮಾರ್ಗ <code>../data/temple_background.md</code> ಸರಿಯಾಗಿದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ)</p>
            </div>`;
    }
}

export function filterContent(targetCategory, buttonElement) {
    document.querySelectorAll('.filter-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    if (buttonElement) buttonElement.classList.add('active');

    renderFilteredHtml(targetCategory);
}

export function renderFilteredHtml(targetCategory) {
    const displayContainer = document.getElementById('content-display');
    if (!displayContainer) return;

    const filteredList = (targetCategory === 'all')
        ? parsedSections
        : parsedSections.filter(sec => sec.category === targetCategory);

    if (filteredList.length === 0) {
        displayContainer.innerHTML = `<p class="loading-text">ಯಾವುದೇ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ.</p>`;
        return;
    }

    displayContainer.innerHTML = filteredList.map(sec => `
        <article class="markdown-card">
            ${sec.htmlContent}
        </article>
    `).join('');
}

if (typeof window !== 'undefined') {
    window.filterContent = filterContent;
}

document.addEventListener('DOMContentLoaded', loadMarkdownData);
