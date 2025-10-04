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
const renderPostList = async () => {
    const container = document.getElementById('posts-container');
    const loadingMessage = document.getElementById('loading-message');
    
    // Hide the placeholder card
    const placeholder = container.querySelector('.placeholder-card');
    if (placeholder) placeholder.style.display = 'none';
    
    container.innerHTML = ''; // Clear any existing content

    try {
        // Fetch the automatically generated index file
        const response = await fetch(`${getRepoRoot()}/posts.json`);
        
        if (!response.ok) {
             throw new Error('Could not fetch posts index. Check build script.');
        }

        const posts = await response.json();

        if (posts.length === 0) {
            container.innerHTML = `<p style="text-align: center;">No blog posts published yet. Visit /admin to create one!</p>`;
            return;
        }

        // Loop through the indexed posts and render the cards
        posts.forEach(post => {
            const imageUrl = post.image ? `${getRepoRoot()}${post.image}` : `https://via.placeholder.com/600x338/1A1A1A/FFFFFF?text=Excellux+Blog`;
            
            const postCardHTML = `
                <article class="post-card">
                    <div class="post-card-image" style="background-image: url('${imageUrl}');"></div>
                    <div class="post-card-content">
                        <div class="post-card-date">${formatDate(post.date)}</div>
                        <h2>${post.title}</h2>
                        <p>${post.excerpt}</p>
                        <a href="post-template.html?slug=${post.slug}" class="read-more">Read Article &rarr;</a>
                    </div>
                </article>
            `;
            container.innerHTML += postCardHTML;
        });

    } catch (error) {
        console.error("Error generating post list:", error);
        container.innerHTML = `<p style="text-align: center;">Failed to load blog list. Error: ${error.message}</p>`;
    } finally {
        if (loadingMessage) loadingMessage.style.display = 'none';
    }
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