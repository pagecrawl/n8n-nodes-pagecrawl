# @pagecrawl/n8n-nodes-pagecrawl

This is an n8n community node that provides integration with [PageCrawl.io](https://pagecrawl.io) for website monitoring and change detection.

## Installation

You can install this node directly in n8n:

1. Go to **Settings** > **Community Nodes**
2. Search for `@pagecrawl/n8n-nodes-pagecrawl`
3. Click **Install**

## Authentication

To use this node, you'll need a PageCrawl.io API token.

> **Note:** API access requires a paid PageCrawl.io plan. Free accounts do not have API access.

1. Sign up or log in to [PageCrawl.io](https://pagecrawl.io)
2. Upgrade to a paid plan if you haven't already
3. Go to **Settings > API**
4. Copy your API token
5. In n8n, create new PageCrawl credentials and paste your token

## Available Nodes

### PageCrawl Node

The main node for interacting with PageCrawl.io API, supporting the following resources:

#### Page Operations
- **List All Pages** - Get all tracked pages
- **Get Page** - Get specific page configuration
- **Create Page** - Create new tracked page with full configuration
- **Create Simple Page** - Quick page creation with minimal options
- **Update Page** - Update existing page configuration
- **Delete Page** - Remove a tracked page
- **Run Check Now** - Trigger an immediate check for a page

#### Check Operations (History)
- **Get History** - Retrieve check history for a page
- **Get Text Diff HTML** - Get text differences as HTML
- **Get Text Diff Image** - Get text differences as an image
- **Get Text Diff Markdown** - Get text differences as Markdown

#### Screenshot Operations
- **Get Latest Screenshot** - Get the most recent full-page screenshot
- **Get Latest Screenshot Diff** - Visual diff of latest vs previous
- **Get Check Screenshot** - Screenshot for specific check
- **Get Check Screenshot Diff** - Visual diff for specific check

#### Webhook Operations
- **List Webhooks** - Get all configured webhooks
- **Create Webhook** - Set up a new webhook
- **Update Webhook** - Modify webhook configuration
- **Delete Webhook** - Remove a webhook
- **Test Webhook** - Send test notification

### PageCrawl Trigger Node

Webhook trigger node that receives real-time notifications when changes are detected.

Features:
- Automatic webhook registration/deregistration
- Configurable payload fields
- Event filtering (changes, errors)
- Simplified output option

## Example Workflows

### 1. Monitor Website and Send Email on Change

```
[PageCrawl Trigger] → [Gmail Send Email]
```

Configure the trigger to monitor specific pages and send notifications via email when changes are detected.

### 2. Track Price Changes

```
[Schedule Trigger] → [PageCrawl Get Page] → [IF Price Changed] → [Slack Message]
```

Periodically check product prices and notify via Slack when they change.

### 3. Archive Website Screenshots

```
[Schedule Trigger] → [PageCrawl Get Screenshot] → [Google Drive Upload]
```

Automatically save website screenshots to Google Drive for compliance or archival.

### 4. Sync Changes to Database

```
[PageCrawl Trigger] → [MySQL Insert]
```

Store all detected changes in a database for analysis and reporting.

## Configuration Options

### Page Tracking Configuration

- **URL**: The webpage to monitor
- **Elements**: Specific page elements to track (CSS/XPath selectors)
- **Frequency**: How often to check (3 minutes to weekly)
- **Location**: Server location for checks (US, UK, CA, DE)
- **Authentication**: HTTP Basic auth support
- **Actions**: Pre-check actions (scroll, click, wait, etc.)
- **Rules**: Conditional notifications based on content

### Notification Settings

- **Channels**: Email, Slack, Discord, Teams, Telegram
- **Rules**: Text difference, content contains, number comparisons
- **Advanced**: Headers, proxies, user agent customization

## API Rate Limits

- Default: 60 requests per minute
- Contact support for higher limits
- Rate limit errors return HTTP 429

## Common Use Cases

1. **E-commerce Price Monitoring** - Track competitor prices and stock levels
2. **Content Updates** - Monitor news sites, blogs, or documentation
3. **Compliance Monitoring** - Ensure website content meets requirements
4. **SEO Tracking** - Monitor meta tags, titles, and content changes
5. **Security Monitoring** - Detect unauthorized website changes
6. **Data Extraction** - Regular scraping of structured data

## Error Handling

The node includes comprehensive error handling:
- Validation errors (HTTP 422) with detailed messages
- Rate limiting (HTTP 429) with retry guidance
- Authentication errors with clear instructions
- Network errors with appropriate retry logic

## Support

- **Documentation**: [PageCrawl.io Docs](https://pagecrawl.io/docs)
- **API Reference**: [API Documentation](https://pagecrawl.io/docs/api)
- **Issues**: [GitHub Issues](https://github.com/pagecrawl/n8n-nodes-pagecrawl/issues)
- **Support**: support@pagecrawl.io

## License

MIT - See LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## Testing

### Unit Tests

Run unit tests (mocked, no API connection required):

```bash
npm test
```

### Integration Tests

Integration tests connect to a real PageCrawl API to verify operations work correctly.

1. Copy the example environment file:
   ```bash
   cp .env.test.example .env.test
   ```

2. Edit `.env.test` with your test credentials:
   ```bash
   PAGECRAWL_TEST_API_KEY=your-api-key-here
   PAGECRAWL_TEST_WORKSPACE_ID=your-workspace-id-here
   PAGECRAWL_TEST_BASE_URL=https://pagecrawl.test
   ```

3. Run integration tests:
   ```bash
   npm run test:integration
   ```

**Note:** Integration tests will be skipped if environment variables are not configured.

## Changelog

### 0.1.0
- Initial release
- Full API coverage for Pages, Checks, Screenshots, and Webhooks
- Trigger node for real-time notifications
- Comprehensive error handling
- TypeScript implementation