import { DrupalConfig, DrupalNode } from './types.js';
/**
 * Client for interacting with Drupal JSON:API
 * Handles authentication and common operations
 */
export declare class DrupalClient {
    private client;
    private baseUrl;
    constructor(config: DrupalConfig);
    /**
     * Query content by type with optional filters
     */
    queryContent(contentType: string, options?: {
        limit?: number | undefined;
        title?: string | undefined;
        status?: boolean | undefined;
    }): Promise<DrupalNode[]>;
    /**
     * Get a single node by ID with optional includes
     */
    getNode(nodeId: string, include?: string[]): Promise<DrupalNode>;
    /**
     * List all available content types
     */
    listContentTypes(): Promise<Array<{
        id: string;
        label: string;
    }>>;
    /**
     * Search across all content types
     */
    searchContent(searchTerm: string, limit?: number): Promise<DrupalNode[]>;
}
//# sourceMappingURL=drupal-client.d.ts.map