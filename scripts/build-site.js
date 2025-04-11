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

// Create a basic HTML wrapper with TailwindCSS
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Awesome Geek Podcasts</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <style>
    .markdown-body {
      max-width: 100%;
      overflow-x: auto;
    }
    .markdown-body h1 {
      font-size: 2.25rem;
      font-weight: bold;
      margin-top: 1.5rem;
      margin-bottom: 1rem;
      color: #1a202c;
    }
    .markdown-body h2 {
      font-size: 1.875rem;
      font-weight: bold;
      margin-top: 1.5rem;
      margin-bottom: 1rem;
      color: #2d3748;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .markdown-body h3 {
      font-size: 1.5rem;
      font-weight: bold;
      margin-top: 1.25rem;
      margin-bottom: 0.75rem;
      color: #4a5568;
    }
    .markdown-body ul {
      list-style-type: disc;
      margin-left: 1.5rem;
      margin-bottom: 1rem;
    }
    .markdown-body li {
      margin-bottom: 0.5rem;
    }
    .markdown-body a {
      color: #4299e1;
      text-decoration: none;
    }
    .markdown-body a:hover {
      text-decoration: underline;
    }
    .markdown-body p {
      margin-bottom: 1rem;
    }
  </style>
</head>
<body class="bg-gray-50 min-h-screen">
  <div class="container mx-auto px-4 py-8">
    <header class="mb-6 text-center">
      <h1 class="text-4xl font-bold text-gray-800">Awesome Geek Podcasts</h1>
      <div class="mt-4">
        <a href="https://github.com/avelino/awesome-geek-podcasts" class="text-blue-600 hover:underline">
          View on GitHub
        </a>
      </div>
    </header>
    
    <main class="bg-white rounded-lg shadow-md p-6 markdown-body">
      ${rawHtml}
    </main>
    
    <footer class="mt-8 text-center text-gray-600">
      <p>Generated from <a href="https://github.com/avelino/awesome-geek-podcasts" class="text-blue-600 hover:underline">awesome-geek-podcasts</a> repository.</p>
      <p class="mt-2 text-sm">Last updated: ${new Date().toLocaleDateString()}</p>
    </footer>
  </div>
</body>
</html>
`;

// Write HTML to file
fs.writeFileSync(path.join(__dirname, '../public/index.html'), htmlContent);

console.log('Website built successfully!');