#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    ListToolsRequestSchema,
    CallToolRequestSchema,
    Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { DrupalClient } from './drupal-client.js';
import { QueryContentArgs, GetNodeArgs } from './types.js';

// Configuration - in production, use environment variables
const DRUPAL_CONFIG = {
    baseUrl: process.env.DRUPAL_BASE_URL || 'https://your-drupal-site.com',
    username: process.env.DRUPAL_USERNAME,
    password: process.env.DRUPAL_PASSWORD,
};

// Initialize Drupal client
const drupalClient = new DrupalClient(DRUPAL_CONFIG);

// Create MCP server instance
const server = new Server(
    {
        name: 'drupal-mcp-server',
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

/**
 * Define available tools
 * Each tool represents an action Claude can perform on your Drupal site
 */
const TOOLS: Tool[] = [
    {
        name: 'query_content',
        description: 'Search and filter Drupal content by type. Returns a list of nodes matching the criteria.',
        inputSchema: {
            type: 'object',
            properties: {
                contentType: {
                    type: 'string',
                    description: 'The machine name of the content type (e.g., "article", "page", "blog_post")',
                },
                limit: {
                    type: 'number',
                    description: 'Maximum number of results to return (default: 10)',
                    default: 10,
                },
                title: {
                    type: 'string',
                    description: 'Filter by title (partial match)',
                },
                status: {
                    type: 'boolean',
                    description: 'Filter by publication status (true = published, false = unpublished)',
                },
            },
            required: ['contentType'],
        },
    },
    {
        name: 'get_node',
        description: 'Retrieve complete details of a specific Drupal node by its ID',
        inputSchema: {
            type: 'object',
            properties: {
                nodeType: {
                    type: 'string',
                    description: 'The machine name of the content type (e.g., "article", "page", "blog_post")',
                },
                nodeId: {
                    type: 'string',
                    description: 'The UUID or numeric ID of the node',
                },
                include: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Related entities to include (e.g., ["field_image", "uid"] to include image and author)',
                },
            },
            required: ['nodeType', 'nodeId'],
        },
    },
    {
        name: 'list_content_types',
        description: 'List all available content types on the Drupal site',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
    {
        name: 'search_content',
        description: 'Search across all content types by title. Useful when you don\'t know the specific content type.',
        inputSchema: {
            type: 'object',
            properties: {
                searchTerm: {
                    type: 'string',
                    description: 'The text to search for in content titles',
                },
                limit: {
                    type: 'number',
                    description: 'Maximum number of results (default: 10)',
                    default: 10,
                },
            },
            required: ['searchTerm'],
        },
    },
];

/**
 * Handle tool listing requests
 * Claude calls this to discover what tools are available
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
});

/**
 * Handle tool execution requests
 * This is where the actual work happens when Claude uses a tool
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        // Route to appropriate handler based on tool name
        switch (name) {
            case 'query_content': {
                const typedArgs = args as unknown as QueryContentArgs;
                const nodes = await drupalClient.queryContent(
                    typedArgs.contentType,
                    {
                        limit: typedArgs.limit,
                        title: typedArgs.title,
                        status: typedArgs.status,
                    }
                );

                // Format results for Claude
                const formattedResults = nodes.map(node => ({
                    id: node.id,
                    title: node.attributes.title,
                    type: node.type,
                    status: node.attributes.status ? 'published' : 'unpublished',
                    created: node.attributes.created,
                    changed: node.attributes.changed,
                }));

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(formattedResults, null, 2),
                        },
                    ],
                };
            }

            case 'get_node': {
                const typedArgs = args as unknown as GetNodeArgs;
                const node = await drupalClient.getNode(
                    typedArgs.nodeType,
                    typedArgs.nodeId,
                    typedArgs.include || []
                );

                // Return full node data
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(node, null, 2),
                        },
                    ],
                };
            }

            case 'list_content_types': {
                const contentTypes = await drupalClient.listContentTypes();

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(contentTypes, null, 2),
                        },
                    ],
                };
            }

            case 'search_content': {
                const { searchTerm, limit = 10 } = args as { searchTerm: string; limit?: number };
                const results = await drupalClient.searchContent(searchTerm, limit);

                const formattedResults = results.map(node => ({
                    id: node.id,
                    title: node.attributes.title,
                    type: node.type,
                    status: node.attributes.status ? 'published' : 'unpublished',
                }));

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(formattedResults, null, 2),
                        },
                    ],
                };
            }

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error: any) {
        // Return errors in a format Claude can understand
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
});

/**
 * Start the server
 */
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);

    // Log to stderr so it doesn't interfere with stdio communication
    console.error('Drupal MCP Server running');
    console.error(`Connected to: ${DRUPAL_CONFIG.baseUrl}`);
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
