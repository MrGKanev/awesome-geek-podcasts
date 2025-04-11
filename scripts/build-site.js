const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');
const cheerio = require('cheerio');

// Ensure directories exist
fs.ensureDirSync(path.join(__dirname, '../public'));

// Read README.md content
const readmePath = path.join(__dirname, '../README.md');
const readmeContent = fs.readFileSync(readmePath, 'utf-8');

// Parse markdown to HTML
const rawHtml = marked.parse(readmeContent);

// Process HTML with cheerio
const $ = cheerio.load(rawHtml);

// Organize podcast data by language
const languageSections = {};
const languages = [];

// Find language sections
$('h2').each((i, elem) => {
  const title = $(elem).text();
  if (title.startsWith('In ')) {
    const language = title.replace('In ', '');
    languages.push(language);
    
    // Get all podcasts under this language section
    const podcasts = [];
    let current = $(elem).next();
    
    while (current.length && current[0].name !== 'h2') {
      if (current[0].name === 'ul') {
        current.find('li').each((j, item) => {
          const podcastElem = $(item);
          const podcastHtml = podcastElem.html();
          const linkElem = podcastElem.find('a').first();
          
          const podcast = {
            name: linkElem.text(),
            url: linkElem.attr('href') || '#',
            description: podcastHtml.split('</a>')[1]?.trim() || ''
          };
          
          podcasts.push(podcast);
        });
      }
      current = current.next();
    }
    
    languageSections[language] = podcasts;
  }
});

// Create HTML content
let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Awesome Geek Podcasts</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50 min-h-screen">
  <div class="container mx-auto px-4 py-8">
    <header class="mb-8 text-center">
      <h1 class="text-4xl font-bold text-gray-800 mb-4">Awesome Geek Podcasts</h1>
      <p class="text-lg text-gray-600">A curated list of podcasts we like to listen to.</p>
    </header>
    
    <div class="mb-8">
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Languages</h2>
        <div class="flex flex-wrap gap-2">`;

// Add language buttons
htmlContent += `<button id="btn-all" class="filter-btn bg-blue-500 text-white px-3 py-1 rounded-full">All</button>`;

languages.forEach(lang => {
  const langId = lang.toLowerCase().replace(/\s+/g, '-');
  htmlContent += `<button id="btn-${langId}" class="filter-btn bg-blue-100 text-blue-800 px-3 py-1 rounded-full">${lang}</button>`;
});

htmlContent += `
        </div>
      </div>
    </div>
    
    <div id="language-sections" class="space-y-8">`;

// Add language sections
languages.forEach(lang => {
  const langId = lang.toLowerCase().replace(/\s+/g, '-');
  htmlContent += `
    <section id="section-${langId}" class="language-section bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">In ${lang}</h2>
      <div class="space-y-6">`;
  
  const podcasts = languageSections[lang] || [];
  podcasts.forEach(podcast => {
    htmlContent += `
      <div class="podcast-item border-b border-gray-200 pb-4 last:border-0">
        <a href="${podcast.url}" class="text-xl font-semibold text-blue-600 hover:text-blue-800 transition" target="_blank">
          ${podcast.name}
        </a>
        <p class="text-gray-700 mt-1">${podcast.description}</p>
      </div>`;
  });
  
  htmlContent += `
      </div>
    </section>`;
});

// Add footer and scripts
htmlContent += `
    </div>
    
    <footer class="mt-12 text-center text-gray-600">
      <p>Generated from <a href="https://github.com/avelino/awesome-geek-podcasts" class="text-blue-600 hover:underline">awesome-geek-podcasts</a>.</p>
      <p class="mt-2 text-sm">Last updated: ${new Date().toLocaleDateString()}</p>
    </footer>
  </div>
  
  <script>
    // Simple filter functionality
    document.getElementById('btn-all').addEventListener('click', function() {
      document.querySelectorAll('.language-section').forEach(function(section) {
        section.style.display = 'block';
      });
      
      // Update active button
      document.querySelectorAll('.filter-btn').forEach(function(btn) {
        btn.classList.remove('bg-blue-500', 'text-white');
        btn.classList.add('bg-blue-100', 'text-blue-800');
      });
      this.classList.remove('bg-blue-100', 'text-blue-800');
      this.classList.add('bg-blue-500', 'text-white');
    });
    
    // Add event listeners for language buttons
    document.querySelectorAll('.filter-btn').forEach(function(btn) {
      if (btn.id !== 'btn-all') {
        btn.addEventListener('click', function() {
          const langId = this.id.replace('btn-', '');
          
          // Hide all sections
          document.querySelectorAll('.language-section').forEach(function(section) {
            section.style.display = 'none';
          });
          
          // Show selected section
          document.getElementById('section-' + langId).style.display = 'block';
          
          // Update active button
          document.querySelectorAll('.filter-btn').forEach(function(btn) {
            btn.classList.remove('bg-blue-500', 'text-white');
            btn.classList.add('bg-blue-100', 'text-blue-800');
          });
          this.classList.remove('bg-blue-100', 'text-blue-800');
          this.classList.add('bg-blue-500', 'text-white');
        });
      }
    });
  </script>
</body>
</html>`;

// Write HTML to file
fs.writeFileSync(path.join(__dirname, '../public/index.html'), htmlContent);

console.log('Website built successfully!');