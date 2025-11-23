import { apiClient } from '@/lib/apiClient'

export interface SitemapStory {
    slug: string
    updatedAt: string
    chapters: {
        number: number
        updatedAt: string
    }[]
}

export interface SitemapTag {
    slug: string
}

export interface SitemapBlog {
    slug: string
    updatedAt: string
}

export interface SitemapUser {
    username: string
    updatedAt: string
}

export const SitemapService = {
    getStories: async (): Promise<SitemapStory[]> => {
        const response = await apiClient.get<{ data: SitemapStory[] }>('/sitemap/stories')
        return response.data
    },

    getTags: async (): Promise<SitemapTag[]> => {
        const response = await apiClient.get<{ data: SitemapTag[] }>('/sitemap/tags')
        return response.data
    },

    getBlogs: async (): Promise<SitemapBlog[]> => {
        const response = await apiClient.get<{ data: SitemapBlog[] }>('/sitemap/blogs')
        return response.data
    },

    getUsers: async (): Promise<SitemapUser[]> => {
        const response = await apiClient.get<{ data: SitemapUser[] }>('/sitemap/users')
        return response.data
    },

    getForums: async (): Promise<SitemapUser[]> => {
        const response = await apiClient.get<{ data: SitemapUser[] }>('/sitemap/forums')
        return response.data
    },
}
