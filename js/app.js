document.addEventListener('DOMContentLoaded', async function() {
  // DOM elements
  const podcastList = document.getElementById('podcastList');
  const searchInput = document.getElementById('searchInput');
  const languageFilter = document.getElementById('languageFilter');
  const resultsCount = document.getElementById('resultsCount');
  const lastUpdated = document.getElementById('lastUpdated');
  
  // State
  let podcasts = [];
  let filteredPodcasts = [];
  let languages = [];
  
  try {
    // Fetch podcast data
    const response = await fetch('./data.json');
    const data = await response.json();
    
    // Update last updated date in DD.MM.YYYY format
    const date = new Date(data.lastUpdated);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    lastUpdated.textContent = `Last updated: ${day}.${month}.${year}`;
    
    // Store podcasts
    podcasts = data.podcasts;
    filteredPodcasts = [...podcasts];
    
    // Populate language filter
    languages = data.languages;
    languages.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang.id;
      option.textContent = lang.name;
      languageFilter.appendChild(option);
    });
    
    // Remove loading skeletons
    const skeletons = document.querySelectorAll('.podcast-skeleton');
    skeletons.forEach(skeleton => skeleton.remove());
    
    // Render initial podcasts
    renderPodcasts(filteredPodcasts);
    
    // Setup event listeners
    searchInput.addEventListener('input', filterPodcasts);
    languageFilter.addEventListener('change', filterPodcasts);
    
    // Add accessible keyboard handlers for filter
    languageFilter.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        languageFilter.click();
      }
    });
    
  } catch (error) {
    console.error('Error loading podcast data:', error);
    podcastList.innerHTML = `
      <div class="col-span-full text-center py-8">
        <p class="text-red-500 dark:text-red-400 font-medium">Failed to load podcast data</p>
        <p class="text-gray-600 dark:text-gray-400 mt-2">Please try again later</p>
      </div>
    `;
  }
  
  // Filter podcasts based on search and language selection
  function filterPodcasts() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const languageSelected = languageFilter.value;
    
    filteredPodcasts = podcasts.filter(podcast => {
      // Language filter
      const matchesLanguage = languageSelected === 'all' || 
                            podcast.languageId === languageSelected;
      
      // Search filter (expanded to be more thorough)
      const matchesSearch = searchTerm === '' || 
                          podcast.name.toLowerCase().includes(searchTerm) || 
                          podcast.description.toLowerCase().includes(searchTerm) ||
                          podcast.language.toLowerCase().includes(searchTerm);
      
      return matchesLanguage && matchesSearch;
    });
    
    renderPodcasts(filteredPodcasts);
  }
  
  // Render podcasts to the page
  function renderPodcasts(podcastsToRender) {
    // Update results count
    resultsCount.textContent = `Showing ${podcastsToRender.length} of ${podcasts.length} podcasts`;
    
    // Clear current podcasts
    podcastList.innerHTML = '';
    
    if (podcastsToRender.length === 0) {
      podcastList.innerHTML = `
        <div class="col-span-full text-center py-8">
          <p class="text-gray-600 dark:text-gray-400">No podcasts match your search criteria</p>
          <button id="resetFilters" class="mt-4 px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors">Reset Filters</button>
        </div>
      `;
      
      // Add event listener to reset button
      document.getElementById('resetFilters').addEventListener('click', function() {
        searchInput.value = '';
        languageFilter.value = 'all';
        filterPodcasts();
      });
      
      return;
    }
    
    // Add podcasts with animation delay for staggered appearance
    podcastsToRender.forEach((podcast, index) => {
      const podcastCard = document.createElement('div');
      podcastCard.className = 'podcast-card bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 hover:shadow-lg transition-colors fade-in';
      podcastCard.style.animationDelay = `${index * 50}ms`;
      
      const truncatedDescription = podcast.description.length > 120 
        ? podcast.description.substring(0, 120) + '...'
        : podcast.description;
      
      const languageBadge = `
        <span class="language-badge bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
          ${podcast.language}
        </span>
      `;
      
      podcastCard.innerHTML = `
        ${languageBadge}
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
          <a href="${podcast.url}" target="_blank" rel="noopener" 
            class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-start"
            aria-label="Listen to ${podcast.name}">
            ${podcast.name}
            <svg class="w-4 h-4 ml-1 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
            </svg>
          </a>
        </h3>
        <p class="text-gray-600 dark:text-gray-400 text-sm">${truncatedDescription}</p>
      `;
      
      podcastList.appendChild(podcastCard);
    });
  }
});