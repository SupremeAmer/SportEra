import { Client, Databases, Storage, Account, ID } from 'appwrite';
import '../css/styles.css';

// Initialize Appwrite
const client = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const databases = new Databases(client);
const storage = new Storage(client);

// DOM Elements
const contentGrid = document.querySelector('.content-grid');

// Fetch and display posts
async function fetchPosts() {
    try {
        const response = await databases.listDocuments(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_POSTS_COLLECTION_ID,
            [Query.orderDesc('createdAt')]
        );
        
        renderPosts(response.documents);
    } catch (error) {
        console.error('Error fetching posts:', error);
        contentGrid.innerHTML = '<p class="error">Failed to load posts. Please try again later.</p>';
    }
}

function renderPosts(posts) {
    contentGrid.innerHTML = '';

    if (posts.length === 0) {
        contentGrid.innerHTML = '<p>No posts available yet.</p>';
        return;
    }

    posts.forEach(post => {
        const imageUrl = storage.getFilePreview(
            import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID,
            post.imageId
        );

        const postEl = document.createElement('article');
        postEl.className = 'news-card';
        postEl.innerHTML = `
            <img src="${imageUrl}" alt="${post.title}" loading="lazy">
            <div class="news-source">${post.source}</div>
            <h2 class="news-title">${post.title}</h2>
            <div class="news-content">${post.content}</div>
            <div class="engagement">
                <button class="like-btn" data-post-id="${post.$id}">
                    <span class="like-icon">👍</span>
                    <span class="like-count">${post.likes}</span>
                </button>
                <span class="comment-count">${post.comments?.length || 0} comments</span>
            </div>
            <div class="comment-section">
                <div class="comments-list" id="comments-${post.$id}">
                    ${renderComments(post.comments)}
                </div>
                <form class="comment-form" data-post-id="${post.$id}">
                    <input type="text" placeholder="Your name (optional)" class="comment-author">
                    <textarea placeholder="Add a comment..." required></textarea>
                    <button type="submit">Post Comment</button>
                </form>
            </div>
        `;
        
        contentGrid.appendChild(postEl);
    });

    // Add event listeners
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', handleLike);
    });

    document.querySelectorAll('.comment-form').forEach(form => {
        form.addEventListener('submit', handleCommentSubmit);
    });
}

// Handle like button click
async function handleLike(e) {
    const postId = e.currentTarget.getAttribute('data-post-id');
    const likeCountEl = e.currentTarget.querySelector('.like-count');
    
    try {
        // Get current post
        const post = await databases.getDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_POSTS_COLLECTION_ID,
            postId
        );
        
        // Update likes count
        const updatedPost = await databases.updateDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_POSTS_COLLECTION_ID,
            postId,
            {
                likes: post.likes + 1
            }
        );
        
        // Update UI
        likeCountEl.textContent = updatedPost.likes;
    } catch (error) {
        console.error('Error liking post:', error);
        alert('Failed to like post. Please try again.');
    }
}

// Handle comment submission
async function handleCommentSubmit(e) {
    e.preventDefault();
    const postId = e.currentTarget.getAttribute('data-post-id');
    const author = e.target.querySelector('.comment-author').value || 'Anonymous';
    const text = e.target.querySelector('textarea').value;
    
    try {
        // Get current post
        const post = await databases.getDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_POSTS_COLLECTION_ID,
            postId
        );
        
        // Create new comment
        const newComment = {
            author,
            text,
            date: new Date().toISOString()
        };
        
        // Update post with new comment
        const updatedComments = [...(post.comments || []), newComment];
        
        await databases.updateDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_POSTS_COLLECTION_ID,
            postId,
            {
                comments: updatedComments
            }
        );
        
        // Refresh comments display
        const commentsContainer = document.getElementById(`comments-${postId}`);
        commentsContainer.innerHTML = renderComments(updatedComments);
        
        // Reset form
        e.target.querySelector('textarea').value = '';
    } catch (error) {
        console.error('Error posting comment:', error);
        alert('Failed to post comment. Please try again.');
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', fetchPosts);