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
  <title>{{ page.title }}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/semantic-ui/dist/semantic.min.css">
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/semantic-ui/dist/semantic.min.js"></script>
</head>
<body>
  <div class="ui sidebar vertical menu" id="mobileMenu">
    {% for section in site.data.sections %}
      <div class="item">
        <div class="header">{{ section.sectionInfo.displayName | default: section.sectionInfo.name }}</div>
        <div class="menu">
          {% for page in section.sectionPages %}
            <a class="item" href="{{ page.url }}">{{ page.pageInfo.title }}</a>
          {% endfor %}
        </div>
      </div>
    {% endfor %}
  </div>
  <div class="pusher">
    <div class="ui top fixed menu mobile only">
      <a class="item" id="sidebarToggle"><i class="bars icon"></i></a>
      <div class="header item">{{ page.title }}</div>
    </div>
    <div class="ui container" style="margin-top:3em">
      <div class="ui grid stackable">
        <div class="four wide computer five wide tablet column mobile hidden" id="desktopMenu">
          <div class="ui vertical menu">
            {% for section in site.data.sections %}
              <div class="item">
                <div class="header">{{ section.sectionInfo.displayName | default: section.sectionInfo.name }}</div>
                <div class="menu">
                  {% for page in section.sectionPages %}
                    <a class="item" href="{{ page.url }}">{{ page.pageInfo.title }}</a>
                  {% endfor %}
                </div>
              </div>
            {% endfor %}
          </div>
        </div>
        <div class="twelve wide computer eleven wide tablet sixteen wide mobile column">
          <div class="ui segment">
            <div id="pageContent">{{ content }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <script>
    $('#sidebarToggle').on('click', function() {
      $('#mobileMenu').sidebar('toggle');
    });
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
