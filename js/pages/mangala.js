/**
 * Mangala Page Script
 * Loads and renders data/mangala.md with note-box and verse-block styling.
 */

export async function loadMangalaMarkdown() {
    const contentSection = document.getElementById('mangalaContent');
    if (!contentSection) return;

    try {
        const response = await fetch('../data/mangala.md');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const rawMarkdown = await response.text();
        const markdownText = rawMarkdown.normalize ? rawMarkdown.normalize('NFC') : rawMarkdown;
        
        let rawHtml = typeof marked !== 'undefined' ? marked.parse(markdownText) : markdownText;

        rawHtml = rawHtml.replace(/<blockquote>\s*<p>(.*?)<\/p>\s*<\/blockquote>/gi, '<div class="note-box highlight"><p>$1</p></div>');
        rawHtml = rawHtml.replace(/(<p>[\s\S]*?<\/p>)(?=\s*(<hr>|<h3|$))/gi, '<div class="verse-block">$1</div>');

        contentSection.innerHTML = rawHtml;

    } catch (error) {
        console.error('Error loading mangala.md:', error);
        contentSection.innerHTML = `
            <div class="error-box">
                <p><strong>ಮಾಹಿತಿಯನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.</strong></p>
                <p class="error-help">(ಫೈಲ್ ಮಾರ್ಗ <code>../data/mangala.md</code> ಸರಿಯಾಗಿದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ)</p>
            </div>`;
    }
}

document.addEventListener('DOMContentLoaded', loadMangalaMarkdown);
