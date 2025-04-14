const fs = require('fs');
const { marked } = require('marked');
const { JSDOM } = require('jsdom');

/**
 * Extracts podcast information from README.md and generates a data.json file
 */
function generatePodcastData() {
  try {
    console.log('Starting podcast data generation process...');
    
    // Read README content
    console.log('Reading README.md...');
    const readme = fs.readFileSync('README.md', 'utf8');
    
    // Convert markdown to HTML
    console.log('Converting markdown to HTML...');
    const html = marked.parse(readme);
    
    // Parse HTML
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Extract title and description
    const title = document.querySelector('h1') ? document.querySelector('h1').textContent : 'Awesome Geek Podcasts';
    let description = '';
    
    // Try to get description from the first paragraph after the title
    if (document.querySelector('h1+p')) {
      description = document.querySelector('h1+p').textContent;
    } else {
      // Get the first paragraph in the document if there's no direct h1+p match
      const firstParagraph = document.querySelector('p');
      if (firstParagraph) {
        description = firstParagraph.textContent;
      } else {
        description = 'A curated list of podcasts we like to listen to.';
      }
    }
    
    console.log(`Title: ${title}`);
    console.log(`Description: ${description}`);
    
    // Find language sections
    const languages = [];
    const languageMap = new Map(); // For quick lookup
    const allPodcasts = [];
    
    console.log('Extracting languages and podcasts...');
    
    // First, find all language sections
    Array.from(document.querySelectorAll('h2')).forEach(heading => {
      const text = heading.textContent;
      if (text.startsWith('In ')) {
        const language = text.replace('In ', '');
        const languageId = language.toLowerCase().replace(/[^a-z0-9]+/g, '');
        
        // Store language info
        languages.push({ name: language, id: languageId });
        languageMap.set(heading.id || heading.textContent, { language, languageId });
        
        console.log(`Found language section: ${language} (${languageId})`);
      }
    });
    
    // Then, extract podcasts from each language section
    Array.from(document.querySelectorAll('h2')).forEach(heading => {
      if (!languageMap.has(heading.id || heading.textContent)) {
        return; // Skip non-language sections
      }
      
      const { language, languageId } = languageMap.get(heading.id || heading.textContent);
      let podcastCount = 0;
      
      // Get podcasts under this language
      let current = heading.nextElementSibling;
      
      while (current && current.tagName !== 'H2') {
        if (current.tagName === 'UL') {
          Array.from(current.querySelectorAll('li')).forEach(item => {
            const link = item.querySelector('a');
            if (link) {
              const name = link.textContent.trim();
              const url = link.href;
              
              // Extract description (everything after the link text)
              let description = item.textContent.substring(item.textContent.indexOf(name) + name.length).trim();
              
              // Clean up the description
              if (description.startsWith('- ')) {
                description = description.substring(2).trim();
              }
              if (description.startsWith('– ')) {
                description = description.substring(2).trim();
              }
              if (description.startsWith(':')) {
                description = description.substring(1).trim();
              }
              
              // Make sure description ends with a period
              if (description && !description.endsWith('.') && !description.endsWith('!') && !description.endsWith('?')) {
                description += '.';
              }
              
              const podcast = {
                name,
                url,
                description,
                language,
                languageId
              };
              
              allPodcasts.push(podcast);
              podcastCount++;
            }
          });
        }
        current = current.nextElementSibling;
      }
      
      console.log(`Added ${podcastCount} podcasts for ${language}`);
    });
    
    // Extract tooling info
    console.log('Extracting tooling info...');
    let tooling = '';
    
    Array.from(document.querySelectorAll('h3')).forEach(heading => {
      if (heading.textContent === 'Tooling') {
        let current = heading.nextElementSibling;
        
        while (current && current.tagName !== 'H3' && current.tagName !== 'H2') {
          if (current.tagName === 'UL') {
            tooling = current.outerHTML;
            console.log('Found tooling section');
          }
          current = current.nextElementSibling;
        }
      }
    });
    
    // Create data object
    const data = {
      title,
      description,
      languages,
      podcasts: allPodcasts,
      tooling,
      lastUpdated: new Date().toISOString()
    };
    
    console.log(`Total languages: ${languages.length}`);
    console.log(`Total podcasts: ${allPodcasts.length}`);
    
    // Create output directory if it doesn't exist
    const outputDir = './';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write to file
    console.log('Writing data.json...');
    fs.writeFileSync(`${outputDir}/data.json`, JSON.stringify(data, null, 2));
    
    console.log('JSON data generated successfully!');
    return true;
  } catch (error) {
    console.error('Error generating podcast data:', error);
    return false;
  }
}

// Execute the function if this script is run directly
if (require.main === module) {
  generatePodcastData();
}

// Export the function for use in other scripts
module.exports = { generatePodcastData };