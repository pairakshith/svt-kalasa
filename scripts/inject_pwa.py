import os

pwa_head = """    <!-- Progressive Web App (PWA) Manifest & Meta -->
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#800020">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="SVT Kalasa">
    <link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">"""

# Process index.html
with open('index.html', 'r', encoding='utf-8') as f:
    idx_content = f.read()

if 'manifest.json' not in idx_content:
    idx_content = idx_content.replace('</head>', pwa_head + '\n</head>')

if 'pwa.js' not in idx_content:
    idx_content = idx_content.replace('</body>', '    <script src="js/pwa.js"></script>\n</body>')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(idx_content)
print('Updated index.html')

pages_dir = 'pages'
for fname in os.listdir(pages_dir):
    if fname.endswith('.html') and fname != 'footer.html':
        fpath = os.path.join(pages_dir, fname)
        with open(fpath, 'r', encoding='utf-8') as f:
            c = f.read()
        
        if 'manifest.json' not in c:
            c = c.replace('</head>', pwa_head + '\n</head>')
        
        if 'pwa.js' not in c:
            c = c.replace('</body>', '    <script src="../js/pwa.js"></script>\n</body>')
        
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(c)
        print(f'Updated {fname}')
