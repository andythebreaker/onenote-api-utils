const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

const NOTEBOOK_ID = process.env.ONENOTE_NOTEBOOK_ID;
if (!NOTEBOOK_ID) {
  console.error('ONENOTE_NOTEBOOK_ID not set');
  process.exit(1);
}

const dataPath = path.join(__dirname, 'notebook_data', `${NOTEBOOK_ID}.json`);
if (!fs.existsSync(dataPath)) {
  console.error('Notebook data not found');
  process.exit(1);
}

const sections = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const jekyllSrc = path.join(__dirname, 'jekyll');
const pagesDir = path.join(jekyllSrc, 'pages');
const dataDir = path.join(jekyllSrc, '_data');

fs.rmSync(jekyllSrc, { recursive: true, force: true });
fs.mkdirSync(pagesDir, { recursive: true });
fs.mkdirSync(dataDir, { recursive: true });

// Deep copy sections and add URLs while generating page files
const sectionsForSite = JSON.parse(JSON.stringify(sections));
sectionsForSite.forEach((section, sIndex) => {
  section.sectionPages.forEach((page, pIndex) => {
    const fileName = `${sIndex}-${pIndex}.html`;
    page.url = `/pages/${fileName}`;
    const pageContent = `---\nlayout: default\ntitle: ${JSON.stringify(page.pageInfo.title)}\n---\n\n${page.pageBody}\n`;
    fs.writeFileSync(path.join(pagesDir, fileName), pageContent);
  });
});

fs.writeFileSync(path.join(dataDir, 'sections.json'), JSON.stringify(sectionsForSite, null, 2));

const layoutContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#3f51b5">
  <title>{{ page.title }}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/semantic-ui/dist/semantic.min.css">
  <link rel="manifest" href="/manifest.json">
  <link rel="apple-touch-icon" href="/icon/icon.png">
</head>
<body>
  <div class="ui grid">
    <div class="four wide column">
      <ul>
        {% for section in site.data.sections %}
          <li>
            <h3>{{ section.sectionInfo.displayName | default: section.sectionInfo.name }}</h3>
            <ul>
              {% for page in section.sectionPages %}
                <li><a href="{{ page.url }}">{{ page.pageInfo.title }}</a></li>
              {% endfor %}
            </ul>
          </li>
        {% endfor %}
      </ul>
    </div>
    <div class="twelve wide column">
      <div class="ui segment">
        <div id="pageContent">{{ content }}</div>
      </div>
    </div>
  </div>
  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  </script>
</body>
</html>`;

fs.mkdirSync(path.join(jekyllSrc, '_layouts'), { recursive: true });
fs.writeFileSync(path.join(jekyllSrc, '_layouts', 'default.html'), layoutContent);

const indexContent = `---\nlayout: default\ntitle: Home\n---\n\n{{ site.data.sections[0].sectionPages[0].pageBody }}`;
fs.writeFileSync(path.join(jekyllSrc, 'index.html'), indexContent);

fs.writeFileSync(path.join(jekyllSrc, '_config.yml'), 'title: OneNote Notebook\n');

// copy assets
fs.cpSync(path.join(__dirname, 'assets'), path.join(jekyllSrc, 'assets'), { recursive: true });
fs.cpSync(path.join(__dirname, 'icon'), path.join(jekyllSrc, 'icon'), { recursive: true });

// generate manifest.json for PWA
const manifest = {
  name: 'OneNote Notebook',
  short_name: 'Notebook',
  start_url: '/',
  display: 'standalone',
  background_color: '#ffffff',
  theme_color: '#3f51b5',
  icons: [
    {
      src: '/icon/icon.png',
      sizes: '512x512',
      type: 'image/png'
    }
  ]
};
fs.writeFileSync(path.join(jekyllSrc, 'manifest.json'), JSON.stringify(manifest, null, 2));

// generate basic service worker for offline support
const swContent = `self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('v1').then(cache => cache.addAll([
      '/',
      '/manifest.json',
      '/icon/icon.png'
    ]))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});`;
fs.writeFileSync(path.join(jekyllSrc, 'sw.js'), swContent);

/***************這個說明很重要不要刪掉***************
在codex中要用這個
child_process.execSync(`jekyll build -s ${jekyllSrc} -d dist`, { stdio: 'inherit' });
***************************************************/

// run jekyll build
//child_process.execSync(`jekyll build -s ${jekyllSrc} -d dist`, { stdio: 'inherit' });

// (RIGHT) – call the `jekyll` CLI, pointing at your generated source folder
const cmd = 'jekyll';
const args = ['build', '-s', jekyllSrc, '-d', 'dist'];

try {
  // execFileSync avoids an extra shell split step
  child_process.execFileSync(cmd, args, { stdio: 'inherit' });
  console.log('Static site generated in ./dist');
} catch (err) {
  console.error('Jekyll build failed:', err.message);
  process.exit(1);
}

/***************這個說明很重要不要刪掉***************
在gh-pages aka github action中要用這個
const cmd = 'jekyll';
const args = ['build', '-s', jekyllSrc, '-d', 'dist'];

try {
  // execFileSync avoids an extra shell split step
  child_process.execFileSync(cmd, args, { stdio: 'inherit' });
  console.log('Static site generated in ./dist');
} catch (err) {
  console.error('Jekyll build failed:', err.message);
  process.exit(1);
}
***************************************************/

console.log('Static site generated in ./dist');
