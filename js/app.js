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
    const response = await fetch('../data.json');
    const data = await response.json();
    
    // Update last updated date
    const date = new Date(data.lastUpdated);
    lastUpdated.textContent = `Last updated: ${date.toLocaleDateString()}`;
    
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
    
  } catch (error) {
    console.error('Error loading podcast data:', error);
    podcastList.innerHTML = `
      <div class="col-span-full text-center py-8">
        <p class="text-red-500 font-medium">Failed to load podcast data</p>
        <p class="text-gray-600 mt-2">Please try again later</p>
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
      
      // Search filter
      const matchesSearch = searchTerm === '' || 
                          podcast.name.toLowerCase().includes(searchTerm) || 
                          podcast.description.toLowerCase().includes(searchTerm);
      
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
          <p class="text-gray-600">No podcasts match your search criteria</p>
        </div>
      `;
      return;
    }
    
    // Add podcasts
    podcastsToRender.forEach(podcast => {
      const podcastCard = document.createElement('div');
      podcastCard.className = 'bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition duration-200';
      
      const languageBadge = `<span class="inline-block text-xs font-medium bg-blue-100 text-blue-800 rounded-full px-2 py-1 mb-2">${podcast.language}</span>`;
      
      podcastCard.innerHTML = `
        ${languageBadge}
        <h3 class="text-lg font-semibold text-gray-800 mb-2">
          <a href="${podcast.url}" target="_blank" class="hover:text-blue-600 transition">${podcast.name}</a>
        </h3>
        <p class="text-gray-600 text-sm">${podcast.description}</p>
      `;
      
      podcastList.appendChild(podcastCard);
    });
  }
});