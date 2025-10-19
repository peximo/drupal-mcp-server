// @ts-ignore
import axios from 'axios';
// @ts-ignore
// @ts-ignore
/**
 * Client for interacting with Drupal JSON:API
 * Handles authentication and common operations
 */
export class DrupalClient {
    client;
    baseUrl;
    constructor(config) {
        this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
        // Create axios instance with base configuration
        this.client = axios.create({
            baseURL: `${this.baseUrl}/jsonapi`,
            headers: {
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
            },
        });
        // Setup authentication if provided
        if (config.username && config.password) {
            const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
            this.client.defaults.headers.common['Authorization'] = `Basic ${auth}`;
        }
        else if (config.accessToken) {
            this.client.defaults.headers.common['Authorization'] = `Bearer ${config.accessToken}`;
        }
    }
    /**
     * Query content by type with optional filters
     */
    async queryContent(contentType, options = {}) {
        try {
            // Build query parameters for JSON:API
            const params = {
                'page[limit]': options.limit || 10,
            };
            // Add filters if provided
            const filters = [];
            if (options.title) {
                params['filter[title][operator]'] = 'CONTAINS';
                params['filter[title][value]'] = options.title;
            }
            if (options.status !== undefined) {
                params['filter[status]'] = options.status ? '1' : '0';
            }
            // Make the request to JSON:API
            const response = await this.client.get(`/node/${contentType}`, { params });
            // Return array of nodes (handle both single and multiple results)
            return Array.isArray(response.data.data)
                ? response.data.data
                : [response.data.data];
        }
        catch (error) {
            throw new Error(`Failed to query content: ${error.message}`);
        }
    }
    /**
     * Get a single node by ID with optional includes
     */
    async getNode(nodeId, include = []) {
        try {
            const params = {};
            // Include related entities if requested
            // Example: ['field_image', 'uid'] to include image and author
            if (include.length > 0) {
                params.include = include.join(',');
            }
            const response = await this.client.get(`/node/node/${nodeId}`, { params });
            // JSON:API returns single resource as object, not array
            return response.data.data;
        }
        catch (error) {
            if (error.response?.status === 404) {
                throw new Error(`Node ${nodeId} not found`);
            }
            throw new Error(`Failed to get node: ${error.message}`);
        }
    }
    /**
     * List all available content types
     */
    async listContentTypes() {
        try {
            const response = await this.client.get('/node_type/node_type');
            const contentTypes = Array.isArray(response.data.data)
                ? response.data.data
                : [response.data.data];
            return contentTypes.map((type) => ({
                id: type.attributes.drupal_internal__type,
                label: type.attributes.name,
            }));
        }
        catch (error) {
            throw new Error(`Failed to list content types: ${error.message}`);
        }
    }
    /**
     * Search across all content types
     */
    async searchContent(searchTerm, limit = 10) {
        try {
            // Get all content types first
            const contentTypes = await this.listContentTypes();
            // Search in each content type and combine results
            const allResults = [];
            for (const type of contentTypes) {
                try {
                    const results = await this.queryContent(type.id, {
                        title: searchTerm,
                        limit: Math.ceil(limit / contentTypes.length),
                        status: true,
                    });
                    allResults.push(...results);
                }
                catch (error) {
                    // Skip types that error (might not have permission)
                    continue;
                }
            }
            return allResults.slice(0, limit);
        }
        catch (error) {
            throw new Error(`Failed to search content: ${error.message}`);
        }
    }
}
//# sourceMappingURL=drupal-client.js.map