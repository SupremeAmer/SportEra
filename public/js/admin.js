import { Client, Databases, Storage, Account, ID } from 'appwrite';
import '../css/admin.css';

// Initialize Appwrite
const client = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const databases = new Databases(client);
const storage = new Storage(client);
const account = new Account(client);

// DOM Elements
const loginSection = document.getElementById('login-section');
const adminDashboard = document.getElementById('admin-dashboard');
const loginForm = document.getElementById('login-form');
const postForm = document.getElementById('post-form');
const postsList = document.getElementById('posts-list');
const logoutBtn = document.getElementById('logout-btn');

// Check existing session
async function checkSession() {
    try {
        const user = await account.get();
        if (user) {
            showAdminDashboard();
            fetchPosts();
        }
    } catch (error) {
        console.log('No active session');
    }
}

// Handle login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target[0].value;
    const password = e.target[1].value;

    try {
        await account.createEmailSession(email, password);
        showAdminDashboard();
        fetchPosts();
    } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed. Please check your credentials.');
    }
});

// Handle logout
logoutBtn.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await account.deleteSession('current');
        showLogin();
        loginForm.reset();
    } catch (error) {
        console.error('Logout failed:', error);
    }
});

// Handle post creation
postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = e.target[0].value;
    const content = e.target[1].value;
    const source = e.target[2].value;
    const imageFile = document.getElementById('image-upload').files[0];

    if (!imageFile) {
        alert('Please select an image');
        return;
    }

    try {
        // Upload image
        const imageResponse = await storage.createFile(
            import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID,
            ID.unique(),
            imageFile
        );

        // Create post
        await databases.createDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_POSTS_COLLECTION_ID,
            ID.unique(),
            {
                title,
                content,
                source,
                imageId: imageResponse.$id,
                likes: 0,
                comments: [],
                createdAt: new Date().toISOString()
            }
        );

        alert('Post created successfully!');
        postForm.reset();
        fetchPosts();
    } catch (error) {
        console.error('Error creating post:', error);
        alert('Error creating post. Please try again.');
    }
});

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
        postsList.innerHTML = '<p>Failed to load posts. Please try again.</p>';
    }
}

// Render posts in admin view
function renderPosts(posts) {
    postsList.innerHTML = '';

    if (posts.length === 0) {
        postsList.innerHTML = '<p>No posts yet. Create your first post!</p>';
        return;
    }

    posts.forEach(post => {
        const imageUrl = storage.getFilePreview(
            import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID,
            post.imageId
        );

        const postEl = document.createElement('div');
        postEl.className = 'post-item';
        postEl.innerHTML = `
            <div class="post-header">
                <h3>${post.title}</h3>
                <span class="post-date">${new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="post-preview">
                <img src="${imageUrl}" alt="${post.title}">
                <p>${post.content.substring(0, 100)}...</p>
            </div>
            <div class="post-stats">
                <span>👍 ${post.likes} likes</span>
                <span>💬 ${post.comments?.length || 0} comments</span>
            </div>
            <div class="post-actions">
                <button class="edit-btn" data-post-id="${post.$id}">Edit</button>
                <button class="delete-btn" data-post-id="${post.$id}">Delete</button>
            </div>
        `;
        
        postsList.appendChild(postEl);
    });

    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', handleDeletePost);
    });
}

// Handle post deletion
async function handleDeletePost(e) {
    const postId = e.currentTarget.getAttribute('data-post-id');
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
        // Get post first to get image ID
        const post = await databases.getDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_POSTS_COLLECTION_ID,
            postId
        );

        // Delete image
        await storage.deleteFile(
            import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID,
            post.imageId
        );

        // Delete post
        await databases.deleteDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_POSTS_COLLECTION_ID,
            postId
        );

        alert('Post deleted successfully!');
        fetchPosts();
    } catch (error) {
        console.error('Error deleting post:', error);
        alert('Error deleting post. Please try again.');
    }
}

// UI Helper functions
function showAdminDashboard() {
    loginSection.classList.add('hidden');
    adminDashboard.classList.remove('hidden');
}

function showLogin() {
    loginSection.classList.remove('hidden');
    adminDashboard.classList.add('hidden');
}

// Initialize admin portal
document.addEventListener('DOMContentLoaded', checkSession);