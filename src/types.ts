// Define Drupal-specific types for better type safety

export interface DrupalConfig {
    baseUrl: string;
    username?: string | undefined;
    password?: string | undefined;
    accessToken?: string | undefined;
}

export interface DrupalNode {
    type: string;
    id: string;
    attributes: {
        title: string;
        created: string;
        changed: string;
        status: boolean;
        body?: {
            value: string;
            format: string;
            processed: string;
        };
        [key: string]: any;
    };
    relationships?: {
        [key: string]: any;
    };
}

export interface JsonApiResponse {
    data: DrupalNode | DrupalNode[];
    links?: {
        next?: { href: string };
        prev?: { href: string };
    };
    included?: any[];
    meta?: any;
}

export interface QueryContentArgs {
    contentType: string;
    limit?: number;
    title?: string;
    status?: boolean;
}

export interface GetNodeArgs {
    nodeType: string,
    nodeId: string;
    include?: string[]; // Related entities to include
}
