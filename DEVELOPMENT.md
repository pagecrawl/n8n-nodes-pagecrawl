# Development Guide for n8n-nodes-pagecrawl

## Quick Start

There are several ways to test this n8n node during development:

## Option 1: Using npx (Recommended - No global install needed)

```bash
# Install dependencies
npm install

# Build the node
npm run build

# Start n8n with npx (this will download n8n if needed)
npm run dev
```

This will:
1. Build the TypeScript files
2. Start n8n using npx (no global installation needed)
3. Open n8n at http://localhost:5678

## Option 2: Install n8n Globally

```bash
# Install n8n globally
npm install -g n8n

# Install node dependencies
npm install

# Build and run
npm run dev
```

## Option 3: Link to Existing n8n Installation

If you already have n8n installed elsewhere:

```bash
# Build the node
npm run build

# Create a global link
npm link

# In your n8n custom nodes folder (usually ~/.n8n/custom/)
npm link n8n-nodes-pagecrawl

# Start your regular n8n instance
n8n start
```

## Option 4: Use with Docker

Create a `docker-compose.yml`:

```yaml
version: '3'

services:
  n8n:
    image: n8nio/n8n
    ports:
      - 5678:5678
    volumes:
      - ./dist:/home/node/.n8n/custom
    environment:
      - N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom
```

Then run:

```bash
npm run build
docker-compose up
```

## Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Build and start n8n with npx
- `npm run dev:build` - Just build the node
- `npm run n8n:start` - Start n8n separately (after building)
- `npm run lint` - Check for linting errors
- `npm run lint:fix` - Fix linting errors

## Testing Your Node

1. After starting n8n, go to http://localhost:5678
2. Create a new workflow
3. Add a node and search for "PageCrawl"
4. You should see both nodes:
   - **PageCrawl** - Main operations node
   - **PageCrawl Trigger** - Webhook trigger node

## Creating Credentials

1. When you add a PageCrawl node, click on "Credentials"
2. Select "Create New"
3. Enter your PageCrawl.io API token
4. The base URL defaults to https://pagecrawl.io
5. Click "Create"

## Troubleshooting

### "n8n: command not found"

Use `npm run dev` which uses npx, or install n8n globally with `npm install -g n8n`

### Node not appearing in n8n

1. Make sure you've built the node: `npm run build`
2. Check that the `dist` folder exists and contains files
3. Restart n8n

### Permission errors

If you get EACCES errors, you might need to configure npm to use a different directory for global packages:

```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### TypeScript errors

Make sure all dependencies are installed:
```bash
npm install
```

## Development Workflow

1. Make changes to TypeScript files in `nodes/` or `credentials/`
2. Run `npm run build` to compile
3. Restart n8n or reload the workflow editor
4. Test your changes

## Making Changes

- Node logic: `nodes/PageCrawl/PageCrawl.node.ts`
- Trigger logic: `nodes/PageCrawlTrigger/PageCrawlTrigger.node.ts`
- Credentials: `credentials/PageCrawlApi.credentials.ts`
- Operation descriptions: `nodes/PageCrawl/descriptions/*.ts`

After making changes, always rebuild:
```bash
npm run build
```

## Publishing

When ready to publish to npm:

1. Update version in `package.json`
2. Build the node: `npm run build`
3. Test thoroughly
4. Publish: `npm publish`

Users can then install it from the n8n UI under Settings > Community Nodes.