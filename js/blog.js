/* ======================================================= */
/* js/blog.js - Blog Logic (Final Corrected Manual Array) */
/* This script fetches content from the _posts/ directory   */
/* ======================================================= */

// --- CONFIGURATION ---
const POSTS_DIR = '_posts/'; 

// IMPORTANT: This array must be manually updated every time you publish a new post.
// The slug must match the Markdown file name (without the .md extension).
// Add new slugs to the START of the array to show the newest posts first!
const POST_SLUGS = [ "2025-10-04-seamless-bathrooms-the-rise-of-tile-insert-shower-drain-channels"
];

// --- UTILITY FUNCTIONS ---

// Function to format the date string
const formatDate = (dateString) => {
    try {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    } catch {
        return "Unknown Date";
    }
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
    const params = new URLSearchParams(window.location.search);
    return params.get('slug');
}

// Function to extract metadata (front matter) from the Markdown text
const extractMetadataAndBody = (markdownText) => {
    const parts = markdownText.split('---');
    if (parts.length < 3) return { metadata: null, bodyMarkdown: markdownText };

    const frontMatterText = parts[1];
    const bodyMarkdown = parts.slice(2).join('---').trim();

    const metadata = {};
    frontMatterText.split('\n').forEach(line => {
        const match = line.match(/(\w+):\s*(.*)/);
        if (match) {
            // Simple parsing to handle standard CMS fields
            metadata[match[1]] = match[2].replace(/"/g, '').trim(); 
        }
    });

    // Handle nested SEO object for easier access
    if (metadata.seo) {
        try {
            // Attempt to parse the YAML object if it spans multiple lines
            const seoMatch = frontMatterText.match(/seo:\s*([\s\S]*?)(\n\w+:|\n---)/);
            if (seoMatch && seoMatch[1]) {
                const seoLines = seoMatch[1].trim().split('\n').map(line => line.trim().replace(/^- /, ''));
                metadata.seo_title = seoLines.find(line => line.startsWith('seo_title:'))?.split('seo_title:')[1]?.trim().replace(/"/g, '') || metadata.seo_title;
                metadata.seo_description = seoLines.find(line => line.startsWith('seo_description:'))?.split('seo_description:')[1]?.trim().replace(/"/g, '') || metadata.seo_description;
            }
        } catch (e) {
            console.warn("Could not parse complex SEO object, using basic lines.");
        }
    }


    return { metadata, bodyMarkdown };
}


// --- 1. POST RENDERING LOGIC ---

// 1.1. Logic for rendering an individual blog post (post-template.html)
const renderPost = async (slug) => {
    if (!slug) {
        setContent('post-body-content', '<p style="text-align: center;">Error: No post slug found in URL.</p>');
        return;
    }
    
    // CRITICAL FIX: Use the absolute path from the domain root
    const postPath = `/${POSTS_DIR}${slug}.md`; 

    try {
        const cacheBustedPath = postPath + '?t=' + new Date().getTime();
		const response = await fetch(cacheBustedPath, { cache: 'no-cache' }); 

        if (!response.ok) {
            setContent('post-body-content', `<p style="text-align: center;">404: Article '${slug}' not found. Please check the slug.</p>`);
            return;
        }

        const markdownText = await response.text();
        const { metadata, bodyMarkdown } = extractMetadataAndBody(markdownText);
        
        if (!metadata) {
            setContent('post-body-content', `<p style="text-align: center;">Parsing Error: Could not extract metadata from post.</p>`);
            return;
        }

        // ------------------------------------
        // INJECTING CONTENT & SEO TAGS
        // ------------------------------------
        
        // a. Dynamic SEO Tags 
        document.title = metadata.seo_title || metadata.title || 'Excellux Blog';
        document.querySelector('meta[name="description"]').setAttribute('content', metadata.seo_description || metadata.excerpt || 'Latest insights from Excellux.');

        // b. Page Content
        setContent('post-title', metadata.title);
        setContent('post-date', `Published on: ${formatDate(metadata.date)}`);
        
        // c. Featured Image
        if (metadata.image) {
            // CRITICAL FIX: Ensure image URL starts with a single slash
            const imageUrl = metadata.image.startsWith('/') ? metadata.image : `/${metadata.image}`;
            document.getElementById('post-image-container').style.backgroundImage = `url('${imageUrl}')`;
        }

        // d. Body Content (Markdown to HTML conversion)
        const htmlContent = marked.parse(bodyMarkdown);
        setContent('post-body-content', htmlContent);

    } catch (error) {
        console.error("Error fetching or parsing post:", error);
        setContent('post-body-content', `<p style="text-align: center;">Failed to load article due to a network or parsing error.</p>`);
    }
}


// 1.2. Logic for rendering the list of all posts (blog.html)
const renderPostList = async () => {
    const container = document.getElementById('posts-container');
    const loadingMessage = document.getElementById('loading-message');
    
    // Hide the placeholder card
    const placeholder = container.querySelector('.placeholder-card');
    if (placeholder) placeholder.style.display = 'none';
    
    container.innerHTML = ''; // Clear any mock-up content

    if (POST_SLUGS.length === 0) {
        container.innerHTML = `<p style="text-align: center;">No blog posts published yet. Please update the POST_SLUGS array in js/blog.js or visit /admin to create a post.</p>`;
        if (loadingMessage) loadingMessage.style.display = 'none';
        return;
    }
    
    // Loop through the manually listed post slugs
    for (const slug of POST_SLUGS) {
        
        // CRITICAL FIX: Use the absolute path from the domain root
        const postPath = `/${POSTS_DIR}${slug}.md`; 
        
        try {
            const cacheBustedPath = postPath + '?t=' + new Date().getTime();
			const response = await fetch(cacheBustedPath, { cache: 'no-cache' }); 
            
            if (!response.ok) {
                console.error(`Could not fetch post: ${slug}`);
                continue; 
            }
            
            const markdownText = await response.text();
            const { metadata } = extractMetadataAndBody(markdownText);

            if (!metadata || !metadata.title) continue; // Skip if metadata is incomplete

            // --- RENDER THE POST CARD ---
            const imageUrl = metadata.image ? metadata.image.startsWith('/') ? metadata.image : `/${metadata.image}` : `https://via.placeholder.com/600x338/1A1A1A/FFFFFF?text=Excellux+Blog`;
            
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
    const pathname = window.location.pathname;

    if (pathname.includes('post-template.html')) {
        // Individual post page
        const slug = getSlugFromUrl();
        renderPost(slug);

    } else if (pathname.includes('blog.html')) {
        // Blog listing page
        renderPostList();

    }
});