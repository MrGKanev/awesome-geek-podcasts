const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');
const cheerio = require('cheerio');

// Ensure directories exist
fs.ensureDirSync(path.join(__dirname, '../public'));
fs.ensureDirSync(path.join(__dirname, '../public/css'));
fs.ensureDirSync(path.join(__dirname, '../public/js'));

// Read README.md content
const readmePath = path.join(__dirname, '../README.md');
const readmeContent = fs.readFileSync(readmePath, 'utf-8');

// Parse markdown to HTML
const rawHtml = marked.parse(readmeContent);

// Process HTML with cheerio
const $ = cheerio.load(rawHtml);

// Extract title and introduction
const title = $('h1').first().text();
const introduction = $('h1').first().next('p').text();

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

// Get tooling section if available
let toolingContent = '';
$('h3').each((i, elem) => {
  const sectionTitle = $(elem).text();
  if (sectionTitle === 'Tooling') {
    let current = $(elem).next();
    while (current.length && current[0].name !== 'h3' && current[0].name !== 'h2') {
      toolingContent += $.html(current);
      current = current.next();
    }
  }
});

// Create JSON data for search functionality
const allPodcasts = [];
Object.keys(languageSections).forEach(language => {
  languageSections[language].forEach(podcast => {
    allPodcasts.push({
      ...podcast,
      language
    });
  });
});

// Write JSON data file
fs.writeFileSync(
  path.join(__dirname, '../public/js/podcasts.json'), 
  JSON.stringify(allPodcasts)
);

// Create HTML template
const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
</head>
<body class="bg-gray-50 min-h-screen">
  <div class="container mx-auto px-4 py-8">
    <header class="mb-8 text-center">
      <h1 class="text-4xl font-bold text-gray-800 mb-4">${title}</h1>
      <p class="text-lg text-gray-600">${introduction}</p>
    </header>
    
    <div class="mb-8">
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="mb-6">
          <div class="relative">
            <input 
              type="text" 
              id="search-input" 
              placeholder="Search podcasts..." 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
            <div class="absolute right-3 top-2.5 text-gray-400">
              <i class="fas fa-search"></i>
            </div>
          </div>
        </div>
        
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Languages</h2>
        <div class="flex flex-wrap gap-2">
          <button 
            data-filter="all" 
            class="filter-btn bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600 transition"
          >
            All
          </button>
          ${languages.map(lang => `
            <button 
              data-filter="${lang.toLowerCase().replace(/\s+/g, '-')}" 
              class="filter-btn bg-blue-100 text-blue-800 px-3 py-1 rounded-full hover:bg-blue-200 transition"
            >
              ${lang}
            </button>
          `).join('')}
        </div>
      </div>
    </div>
    
    <div id="search-results" class="hidden mb-8 bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">Search Results</h2>
      <div id="results-container" class="space-y-6"></div>
    </div>
    
    <div id="language-sections" class="space-y-8">
      ${languages.map(lang => `
        <section 
          id="${lang.toLowerCase().replace(/\s+/g, '-')}" 
          data-language="${lang.toLowerCase().replace(/\s+/g, '-')}"
          class="language-section bg-white rounded-lg shadow-md p-6"
        >
          <h2 class="text-2xl font-bold text-gray-800 mb-6">In ${lang}</h2>
          <div class="space-y-6">
            ${(languageSections[lang] || []).map(podcast => `
              <div class="podcast-item border-b border-gray-200 pb-4 last:border-0">
                <a href="${podcast.url}" class="text-xl font-semibold text-blue-600 hover:text-blue-800 transition" target="_blank">
                  ${podcast.name}
                </a>
                <p class="text-gray-700 mt-1">${podcast.description}</p>
              </div>
            `).join('')}
          </div>
        </section>
      `).join('')}
    </div>
    
    ${toolingContent ? `
    <div class="mt-8 bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">Tooling</h2>
      ${toolingContent}
    </div>
    ` : ''}
    
    <footer class="mt-12 text-center text-gray-600">
      <p>Generated from <a href="https://github.com/avelino/awesome-geek-podcasts" class="text-blue-600 hover:underline">awesome-geek-podcasts</a>.</p>
      <p class="mt-2 text-sm">Last updated: ${new Date().toLocaleDateString()}</p>
    </footer>
  </div>
  
  <script>
    // DOM Elements
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const resultsContainer = document.getElementById('results-container');
    const languageSections = document.getElementById('language-sections');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const sections = document.querySelectorAll('.language-section');
    
    // Event Listeners
    searchInput.addEventListener('input', handleSearch);
    filterButtons.forEach(btn => {
      btn.addEventListener('click', handleFilter);
    });
    
    // Search functionality
    let podcasts = [];
    
    // Fetch podcast data
    fetch('js/podcasts.json')
      .then(response => response.json())
      .then(data => {
        podcasts = data;
      })
      .catch(error => console.error('Error loading podcast data:', error));
    
    function handleSearch() {
      const searchTerm = searchInput.value.toLowerCase().trim();
      
      if (searchTerm.length < 2) {
        searchResults.classList.add('hidden');
        languageSections.classList.remove('hidden');
        return;
      }
      
      const matches = podcasts.filter(podcast => 
        podcast.name.toLowerCase().includes(searchTerm) || 
        podcast.description.toLowerCase().includes(searchTerm)
      );
      
      if (matches.length > 0) {
        renderSearchResults(matches);
        searchResults.classList.remove('hidden');
        languageSections.classList.add('hidden');
      } else {
        resultsContainer.innerHTML = '<p class="text-gray-500">No podcasts found matching your search.</p>';
        searchResults.classList.remove('hidden');
        languageSections.classList.add('hidden');
      }
    }
    
    function renderSearchResults(results) {
      resultsContainer.innerHTML = '';
      
      results.forEach(podcast => {
        const podcastElement = document.createElement('div');
        podcastElement.className = 'podcast-item border-b border-gray-200 pb-4 last:border-0';
        podcastElement.innerHTML = 
          '<div class="flex items-start justify-between">' +
            '<div>' +
              '<a href="' + podcast.url + '" class="text-xl font-semibold text-blue-600 hover:text-blue-800 transition" target="_blank">' +
                podcast.name +
              '</a>' +
              '<p class="text-gray-700 mt-1">' + podcast.description + '</p>' +
            '</div>' +
            '<span class="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">' + podcast.language + '</span>' +
          '</div>';
        
        resultsContainer.appendChild(podcastElement);
      });
    }
    
    function handleFilter() {
      const filter = this.getAttribute('data-filter');
      
      // Reset search field
      searchInput.value = '';
      searchResults.classList.add('hidden');
      languageSections.classList.remove('hidden');
      
      // Update active button style
      filterButtons.forEach(btn => {
        btn.classList.remove('bg-blue-500', 'text-white');
        btn.classList.add('bg-blue-100', 'text-blue-800');
      });
      this.classList.remove('bg-blue-100', 'text-blue-800');
      this.classList.add('bg-blue-500', 'text-white');
      
      // Filter sections
      if (filter === 'all') {
        sections.forEach(section => {
          section.classList.remove('hidden');
        });
      } else {
        sections.forEach(section => {
          if (section.getAttribute('data-language') === filter) {
            section.classList.remove('hidden');
          } else {
            section.classList.add('hidden');
          }
        });
      }
    }
  </script>
</body>
</html>
`;

// Write HTML to file
fs.writeFileSync(path.join(__dirname, '../public/index.html'), htmlTemplate);

console.log('Website built successfully!');