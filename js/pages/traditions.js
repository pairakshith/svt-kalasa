/**
 * Traditions Page Script
 * Loads data/traditions.md and filters cards based on category tabs.
 */

let parsedTraditions = [];

export async function loadTraditionsMarkdown() {
    const displayContainer = document.getElementById('traditions-display');
    if (!displayContainer) return;

    try {
        const response = await fetch('../data/traditions.md');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const rawMarkdown = await response.text();
        const normalizedMarkdown = rawMarkdown.normalize ? rawMarkdown.normalize('NFC') : rawMarkdown;

        const rawBlocks = normalizedMarkdown.split('---');

        parsedTraditions = rawBlocks.map(block => {
            const categoryMatch = block.match(/# CATEGORY:\s*(\w+)/);
            const category = categoryMatch ? categoryMatch[1].trim() : 'all';

            const cleanMarkdown = block.replace(/# CATEGORY:\s*\w+/, '').trim();

            return {
                category: category,
                htmlContent: typeof marked !== 'undefined' ? marked.parse(cleanMarkdown) : cleanMarkdown
            };
        }).filter(item => item.htmlContent.length > 0);

        renderFilteredTraditions('all');

    } catch (error) {
        console.error('Markdown fetch error:', error);
        displayContainer.innerHTML = `
            <div class="error-box">
                <p><strong>ಮಾಹಿತಿಯನ್ನು ಲೋಡ್ ಮಾಡುವಲ್ಲಿ ದೋಷ ಸಂಭವಿಸಿದೆ.</strong></p>
                <p class="error-help">(ಫೈಲ್ ಮಾರ್ಗ <code>../data/traditions.md</code> ಸರಿಯಾಗಿದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ)</p>
            </div>`;
    }
}

export function filterTraditions(targetCategory, buttonElement) {
    document.querySelectorAll('.filter-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    if (buttonElement) buttonElement.classList.add('active');

    renderFilteredTraditions(targetCategory);
}

export function renderFilteredTraditions(targetCategory) {
    const displayContainer = document.getElementById('traditions-display');
    if (!displayContainer) return;

    const filteredList = (targetCategory === 'all')
        ? parsedTraditions
        : parsedTraditions.filter(item => item.category === targetCategory);

    if (filteredList.length === 0) {
        displayContainer.innerHTML = `<p class="loading-text">ಯಾವುದೇ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ.</p>`;
        return;
    }

    displayContainer.innerHTML = filteredList.map(item => `
        <article class="tradition-card">
            ${item.htmlContent}
        </article>
    `).join('');
}

if (typeof window !== 'undefined') {
    window.filterTraditions = filterTraditions;
}

document.addEventListener('DOMContentLoaded', loadTraditionsMarkdown);
