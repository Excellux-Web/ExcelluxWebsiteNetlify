const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const postsDir = path.join(__dirname, '_posts');
const outputFilePath = path.join(__dirname, 'posts.json');
const posts = [];

// 1. Read all files in the _posts directory
fs.readdirSync(postsDir).forEach(file => {
    if (path.extname(file) === '.md') {
        const fullPath = path.join(postsDir, file);
        const fileContent = fs.readFileSync(fullPath, 'utf8');
        
        // 2. Use gray-matter to extract front matter (metadata)
        const { data } = matter(fileContent);
        
        // 3. Create a unique slug (filename without extension)
        const slug = path.basename(file, '.md');
        
        // 4. Collect the essential data
        posts.push({
            slug: slug,
            title: data.title,
            date: data.date,
            excerpt: data.excerpt,
            image: data.image
            // We do NOT include the body content here, only metadata
        });
    }
});

// 5. Sort posts by date (newest first)
posts.sort((a, b) => new Date(b.date) - new Date(a.date));

// 6. Write the final index file to the project root
fs.writeFileSync(outputFilePath, JSON.stringify(posts, null, 2));

console.log(`Successfully generated index for ${posts.length} posts at ${outputFilePath}`);