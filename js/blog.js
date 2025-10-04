/* ========================================= */
/* blog.js - Logic for fetching, parsing, and */
/* rendering blog content from the _posts/ folder */
/* ========================================= */

// --- CONFIGURATION ---
// The path where Decap CMS stores your Markdown files
const POSTS_DIR = '_posts/'; 

// Netlify makes all repository files available via its CDN.
// This function gets the root of the repository.
const getRepoRoot = () => {
    // In a live environment on Netlify, this will be your domain root.
    // For local testing, we assume the files are relative to the site root.
    return window.location.origin;
}

// --- UTILITY FUNCTIONS ---

// Function to format the date string
const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Function to safely set the HTML content
const setContent = (elementId, content) => {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = content;
    }
}

// Function to get the slug from the URL (for individual post fetching)
const getSlugFromUrl = () => {
    // Expects URL format like: post-template.html?slug=2023-10-04-my-post-title
    const params = new URLSearchParams(window.location.search);
    return params.get('slug');
}


// --- 1. POST RENDERING LOGIC (The Main Functions) ---

// 1.1. Logic for rendering an individual blog post (Used on post-template.html)
const renderPost = async (slug) => {
    if (!slug) {
        setContent('post-body-content', '<p style="text-align: center;">Error: No post slug found in URL.</p>');
        return;
    }

    try {
        const postPath = `${getRepoRoot()}/${POSTS_DIR}${slug}.md`;
        const response = await fetch(postPath);

        if (!response.ok) {
            setContent('post-body-content', `<p style="text-align: center;">404: Article '${slug}' not found. Please check the URL.</p>`);
            return;
        }

        const markdownText = await response.text();
        
        // Use front-matter parser (simple manual approach) to extract metadata (SEO/Title/Date)
        const parts = markdownText.split('---');
        const frontMatterText = parts[1];
        const bodyMarkdown = parts.slice(2).join('---').trim();

        const metadata = {};
        frontMatterText.split('\n').forEach(line => {
            const match = line.match(/(\w+):\s*(.*)/);
            if (match) {
                // Simple parsing, works for standard CMS fields
                metadata[match[1]] = match[2].replace(/"/g, '').trim(); 
            }
        });

        // ------------------------------------
        // INJECTING CONTENT & SEO TAGS
        // ------------------------------------
        
        // a. Dynamic SEO Tags (from config.yml fields)
        document.title = metadata.seo_title || metadata.title || 'Excellux Blog';
        document.querySelector('meta[name="description"]').setAttribute('content', metadata.seo_description || metadata.excerpt);

        // b. Page Content
        setContent('post-title', metadata.title);
        setContent('post-date', `Published on: ${formatDate(metadata.date)}`);
        
        // c. Featured Image
        if (metadata.image) {
            const imageUrl = `${getRepoRoot()}${metadata.image}`;
            document.getElementById('post-image-container').style.backgroundImage = `url('${imageUrl}')`;
        }

        // d. Body Content (Markdown to HTML conversion)
        const htmlContent = marked.parse(bodyMarkdown);
        setContent('post-body-content', htmlContent);

    } catch (error) {
        console.error("Error fetching or parsing post:", error);
        setContent('post-body-content', `<p style="text-align: center;">Failed to load article due to a parsing or network error.</p>`);
    }
}


// 1.2. Logic for rendering the list of all posts (Used on blog.html)
// 1.2. Logic for rendering the list of all posts (Used on blog.html)
// 1.2. Logic for rendering the list of all posts (Used on blog.html)
const renderPostList = async () => {
    const container = document.getElementById('posts-container');
    const loadingMessage = document.getElementById('loading-message');
    
    // Hide the placeholder card
    const placeholder = container.querySelector('.placeholder-card');
    if (placeholder) placeholder.style.display = 'none';
    
    // --- STEP 1: DEFINE ALL POST SLUGS MANUALLY ---
    // IMPORTANT: As you add new posts via the CMS, you must manually 
    // add their file names (slugs) to this array and commit this change to Git.
    // This is the simplest way to get the list without a build tool.
    
    // REPLACE THIS SLUG WITH YOUR REAL POST SLUG
    const postSlugs = [
        "2025-10-04-seamless-bathrooms-the-rise-of-tile-insert-shower-drain-channels" // e.g., "2025-10-04-the-power-of-simplicity"
    ];
    // Add more slugs here: "2025-11-01-another-post-title"

    container.innerHTML = ''; // Clear the mock-up content

    // --- STEP 2: LOOP THROUGH POSTS AND FETCH METADATA ---
    for (const slug of postSlugs) {
        try {
            const postPath = `${getRepoRoot()}/${POSTS_DIR}${slug}.md`;
            const response = await fetch(postPath);
            
            if (!response.ok) {
                console.error(`Could not fetch post: ${slug}`);
                continue; // Skip this post if the file isn't found
            }
            
            const markdownText = await response.text();
            
            // Basic parsing to get front matter (metadata)
            const parts = markdownText.split('---');
            const frontMatterText = parts[1];
            
            const metadata = {};
            frontMatterText.split('\n').forEach(line => {
                const match = line.match(/(\w+):\s*(.*)/);
                if (match) {
                    metadata[match[1]] = match[2].replace(/"/g, '').trim(); 
                }
            });

            // --- STEP 3: RENDER THE POST CARD ---
            const imageUrl = metadata.image ? `${getRepoRoot()}${metadata.image}` : `https://via.placeholder.com/600x338/1A1A1A/FFFFFF?text=Excellux+Blog`;
            
            const postCardHTML = `
                <article class="post-card">
                    <div class="post-card-image" style="background-image: url('${imageUrl}');"></div>
                    <div class="post-card-content">
                        <div class="post-card-date">${formatDate(metadata.date)}</div>
                        <h2>${metadata.title}</h2>
                        <p>${metadata.excerpt}</p>
                        <a href="post-template.html?slug=${slug}" class="read-more">Read Article &rarr;</a>
                    </div>
                </article>
            `;
            
            container.innerHTML += postCardHTML;

        } catch (error) {
            console.error(`Error processing post ${slug}:`, error);
        }
    }
    
    if (loadingMessage) loadingMessage.style.display = 'none';
};


// --- 2. INITIALIZATION ---

document.addEventListener('DOMContentLoaded', () => {
    // Determine which page we are on and run the corresponding function
    const pathname = window.location.pathname;

    if (pathname.includes('post-template.html')) {
        // We are on the individual post page
        const slug = getSlugFromUrl();
        renderPost(slug);

    } else if (pathname.includes('blog.html')) {
        // We are on the blog listing page
        renderPostList();

    }
});