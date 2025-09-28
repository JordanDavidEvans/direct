export function getHtmlDocument() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Duda Redirect CSV Builder</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f7f7f7;
      color: #333;
    }
    h1 {
      text-align: center;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }
    textarea {
      width: 100%;
      min-height: 120px;
      margin-bottom: 16px;
      padding: 10px;
      border-radius: 4px;
      border: 1px solid #ccc;
      font-family: monospace;
      font-size: 14px;
      resize: vertical;
    }
    button, select {
      font-size: 16px;
      padding: 8px 12px;
      border-radius: 4px;
      border: 1px solid #888;
      background: #f0f0f0;
      cursor: pointer;
    }
    button.primary {
      background: #0070f3;
      color: #fff;
      border-color: #0057c2;
    }
    button:disabled {
      background: #ddd;
      color: #888;
      cursor: not-allowed;
    }
    .hidden {
      display: none;
    }
    .step {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #eee;
    }
    .status {
      margin-bottom: 12px;
      font-weight: bold;
    }
    .controls {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      align-items: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Duda Redirect CSV Builder</h1>
    <p>Paste your Google Search Console export and sitemap XML to create a redirect CSV.</p>

    <label for="gscInput"><strong>GSC Export (\"URL    Last crawled\" format)</strong></label>
    <textarea id="gscInput" placeholder="URL    Last crawled\nhttps://example.com/old-page    Jan 1, 2024"></textarea>

    <label for="sitemapInput"><strong>sitemap.xml</strong></label>
    <textarea id="sitemapInput" placeholder="<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset>\n  <url><loc>https://example.com/</loc></url>\n</urlset>"></textarea>

    <button id="startBtn" class="primary">Start Mapping</button>

    <div id="mappingSection" class="step hidden">
      <div class="status" id="status"></div>
      <div class="controls">
        <label for="targetSelect">Select target URL:</label>
        <select id="targetSelect"></select>
        <button id="nextBtn" class="primary">Next</button>
      </div>
    </div>

    <div id="downloadSection" class="step hidden">
      <button id="downloadBtn" class="primary">Download CSV</button>
    </div>
  </div>

  <script>
    ${getClientScript()}
  </script>
</body>
</html>`;
}

function getClientScript() {
  return `(function() {
      const startBtn = document.getElementById('startBtn');
      const nextBtn = document.getElementById('nextBtn');
      const downloadBtn = document.getElementById('downloadBtn');
      const mappingSection = document.getElementById('mappingSection');
      const downloadSection = document.getElementById('downloadSection');
      const statusEl = document.getElementById('status');
      const targetSelect = document.getElementById('targetSelect');

      let gscUrls = [];
      let sitemapUrls = [];
      let currentIndex = 0;
      const mappings = [];

      function parseGsc(text) {
        if (!text) {
          return [];
        }

        const matches = text.match(/https?:\\/\\/[^\\s]+/gi) || [];
        const urls = matches
          .map(url => url.trim())
          .filter(url => url && !url.toLowerCase().startsWith('url'));

        // Remove any accidental trailing punctuation such as commas from copied text
        return Array.from(
          new Set(
            urls.map(url => url.replace(/["'`,;]+$/, ''))
          )
        );
      }

      function parseSitemap(text) {
        const matches = [...text.matchAll(/<loc>\\s*([^<]+)\\s*<\\/loc>/gi)];
        return matches.map(m => m[1].trim());
      }

      function populateSelect() {
        targetSelect.innerHTML = '';
        const options = ['/', ...sitemapUrls, 'Skip'];
        options.forEach(url => {
          const option = document.createElement('option');
          option.value = url;
          option.textContent = url;
          targetSelect.appendChild(option);
        });
      }

      function showCurrentUrl() {
        if (currentIndex >= gscUrls.length) {
          mappingSection.classList.add('hidden');
          downloadSection.classList.remove('hidden');
          return;
        }
        statusEl.textContent = 'Mapping ' + (currentIndex + 1) + ' of ' + gscUrls.length + ': ' + gscUrls[currentIndex];
        targetSelect.value = '/';
      }

      function startMapping() {
        const gscText = document.getElementById('gscInput').value;
        const sitemapText = document.getElementById('sitemapInput').value;

        gscUrls = parseGsc(gscText);
        sitemapUrls = parseSitemap(sitemapText);

        if (!gscUrls.length) {
          alert('No GSC URLs found. Please check your input.');
          return;
        }

        populateSelect();
        currentIndex = 0;
        mappings.length = 0;
        showCurrentUrl();
        mappingSection.classList.remove('hidden');
        downloadSection.classList.add('hidden');
      }

      function handleNext() {
        if (currentIndex >= gscUrls.length) {
          return;
        }
        const source = gscUrls[currentIndex];
        const target = targetSelect.value;
        if (target !== 'Skip') {
          mappings.push({ source, target });
        }
        currentIndex += 1;
        showCurrentUrl();
      }

      function downloadCsv() {
        if (!mappings.length) {
          alert('No mappings to download.');
          return;
        }
        const lines = ['Source URL,Target URL,Type'];
        mappings.forEach(({ source, target }) => {
          lines.push(escapeCsv(source) + ',' + escapeCsv(target) + ',301');
        });
        const blob = new Blob([lines.join('\\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'redirects.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      function escapeCsv(value) {
        if (value.includes(',') || value.includes('"') || value.includes('\\n')) {
          return '"' + value.replace(/"/g, '""') + '"';
        }
        return value;
      }

      startBtn.addEventListener('click', startMapping);
      nextBtn.addEventListener('click', handleNext);
      downloadBtn.addEventListener('click', downloadCsv);
    })();`;
}
