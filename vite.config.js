import { defineConfig } from 'vite'
import environment from 'vite-plugin-environment'

export default defineConfig({
  plugins: [
    environment(['VITE_APPWRITE_ENDPOINT', 'VITE_APPWRITE_PROJECT_ID', 
                'VITE_APPWRITE_DATABASE_ID', 'VITE_APPWRITE_POSTS_COLLECTION_ID',
                'VITE_APPWRITE_STORAGE_BUCKET_ID'])
  ]
})