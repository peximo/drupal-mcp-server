# Drupal MCP Server

A Model Context Protocol (MCP) server that enables Claude to interact with Drupal 10+ sites via JSON:API. This server allows Claude to query, search, and retrieve content from your Drupal installation.

## Features

- **Query Content**: Search and filter nodes by content type with flexible options
- **Get Node Details**: Retrieve complete node information including relationships
- **List Content Types**: Discover all available content types on your site
- **Search Across Types**: Search for content across all content types by title

## Prerequisites

- Node.js 18+ and npm
- TypeScript 5+
- A Drupal 10+ site with JSON:API enabled (enabled by default)
- Valid Drupal credentials (username/password or OAuth token)

## Installation

```bash
# Clone or create the project directory
mkdir drupal-mcp-server
cd drupal-mcp-server

# Initialize and install dependencies
npm init -y
npm install @modelcontextprotocol/sdk axios
npm install -D typescript @types/node
```

## Project Structure

```
drupal-mcp-server/
├── src/
│   ├── index.ts          # Main MCP server
│   ├── drupal-client.ts  # Drupal API client
│   └── types.ts          # TypeScript type definitions
├── dist/                 # Compiled JavaScript (generated)
├── package.json
└── tsconfig.json
```

## Building

```bash
# Compile TypeScript
npm run build

# Watch mode (optional)
npm run watch
```

The compiled JavaScript files will be output to the `dist/` directory.

## Configuration

### For Claude Desktop

Edit your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`  
**Linux**: `~/.config/Claude/claude_desktop_config.json`

Add the following configuration:

```json
{
  "mcpServers": {
    "drupal": {
      "command": "node",
      "args": ["/absolute/path/to/drupal-mcp-server/dist/index.js"],
      "env": {
        "DRUPAL_BASE_URL": "https://your-drupal-site.com",
        "DRUPAL_USERNAME": "your-username",
        "DRUPAL_PASSWORD": "your-password"
      }
    }
  }
}
```

**Note**: Replace `/absolute/path/to/drupal-mcp-server` with the actual path on your system. Use `pwd` in the project directory to get the full path.

### For Cline (VS Code)

Add to your VS Code `settings.json`:

```json
{
  "cline.mcpServers": {
    "drupal": {
      "command": "node",
      "args": ["/absolute/path/to/drupal-mcp-server/dist/index.js"],
      "env": {
        "DRUPAL_BASE_URL": "https://your-drupal-site.com",
        "DRUPAL_USERNAME": "your-username",
        "DRUPAL_PASSWORD": "your-password"
      }
    }
  }
}
```

### Environment Variables

- `DRUPAL_BASE_URL` (required): Your Drupal site URL
- `DRUPAL_USERNAME` (optional): Basic auth username
- `DRUPAL_PASSWORD` (optional): Basic auth password
- `DRUPAL_ACCESS_TOKEN` (optional): OAuth access token (alternative to username/password)

## Testing

### Manual Server Test

Test the server directly from the command line:

```bash
cd /path/to/drupal-mcp-server

DRUPAL_BASE_URL="https://your-site.com" \
DRUPAL_USERNAME="admin" \
DRUPAL_PASSWORD="password" \
node dist/index.js
```

You should see:
```
Drupal MCP Server running
Connected to: https://your-site.com
```

Press `Ctrl+C` to stop.

### Test Connection to Drupal

Verify your Drupal site is accessible:

```bash
curl -I https://your-site.com/jsonapi
```

Should return a `200 OK` status.

### Testing in Claude Desktop

1. Restart Claude Desktop after updating the configuration
2. Look for the 🔌 icon at the bottom of the interface
3. Click it to see connected MCP servers
4. Start a new conversation and try:

```
What tools do you have available?
```

### Example Queries

**List content types:**
```
List all available content types on my Drupal site
```

**Query content:**
```
Show me 5 published articles
```

**Search content:**
```
Search for content with "tutorial" in the title
```

**Get node details:**
```
Get the full details of node [UUID]
```

**Complex query:**
```
1. List all content types
2. Find 3 articles
3. Show me the complete details of the first article
```

## Available Tools

### `query_content`
Search and filter Drupal content by type.

**Parameters:**
- `contentType` (required): Machine name of the content type (e.g., "article", "page")
- `limit` (optional): Maximum results to return (default: 10)
- `title` (optional): Filter by title (partial match)
- `status` (optional): Filter by publication status (true/false)

### `get_node`
Retrieve complete details of a specific node.

**Parameters:**
- `nodeId` (required): UUID or numeric ID of the node
- `include` (optional): Array of related entities to include (e.g., ["field_image", "uid"])

### `list_content_types`
List all available content types on the site.

**Parameters:** None

### `search_content`
Search across all content types by title.

**Parameters:**
- `searchTerm` (required): Text to search for in titles
- `limit` (optional): Maximum results (default: 10)

## Troubleshooting

### "Server disconnected" error

1. Check that the server starts manually
2. Verify the path in the configuration is absolute
3. Check Claude Desktop logs:
   ```bash
   # macOS
   tail -f ~/Library/Logs/Claude/mcp*.log
   ```

### SSL Certificate errors (DDEV/local development)

If using self-signed certificates, the server automatically disables certificate verification for local development.

### Permission errors

Ensure your Drupal user has permission to access JSON:API endpoints. The "View published content" permission is usually sufficient for read operations.

### JSON:API not enabled

JSON:API is enabled by default in Drupal 10+. If you get 404 errors, verify it's enabled at:
`/admin/modules` → Search for "JSON:API"

## Development

### Adding new tools

1. Define the tool schema in `TOOLS` array in `src/index.ts`
2. Implement the handler in the `CallToolRequestSchema` switch statement
3. Add any new methods to `DrupalClient` class as needed
4. Rebuild: `npm run build`

### Extending functionality

Potential enhancements:
- Create/update content (POST/PATCH requests)
- Manage taxonomy terms
- Query users
- Execute Views
- Upload media/files
- Manage menus

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
