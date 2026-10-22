# @pagecrawl/n8n-nodes-pagecrawl

This is an n8n community node that provides integration with [PageCrawl.io](https://pagecrawl.io) for website monitoring and change detection.

## Installation

You can install this node directly in n8n:

1. Go to **Settings** > **Community Nodes**
2. Search for `@pagecrawl/n8n-nodes-pagecrawl`
3. Click **Install**

## Authentication

To use this node, you'll need a PageCrawl.io API token.

> **Note:** The API is available on every PageCrawl.io plan, including Free.

1. Sign up or log in to [PageCrawl.io](https://pagecrawl.io)
2. Go to **Settings > API**
3. Create an API token and copy it
4. In n8n, create new PageCrawl credentials and paste your token

## Available Nodes

### PageCrawl Node

The main node for interacting with PageCrawl.io API, supporting the following resources:

#### Page Operations
- **Get Page** - Get specific page configuration
- **Get Many** - List the pages in a workspace: every active page, the paused ones, or one folder, optionally with each page's newest values
- **Pause** / **Resume** - Stop or restart checking a page (sets the state, so a re-run does not flip it back)
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
- **Get Text Diff Patch** - Get text differences as a unified patch
- **Get Before and After Image** - The screenshots from before and after a change, side by side (a placeholder image, flagged in the output, when there is nothing to compare)

#### Screenshot Operations
- **Get Latest Screenshot** - Get the most recent full-page screenshot
- **Get Latest Screenshot Diff** - Visual diff of latest vs previous
- **Get Check Screenshot** - Screenshot for specific check
- **Get Check Screenshot Diff** - Visual diff for specific check

#### Data Source Operations
- **Create** - Create a data source that records values you send instead of checking a URL, with optional named fields (number, price or text)
- **Push Value** - Record one value, or several named values, through the data source's secret ingest URL. Pushing an unchanged value stores nothing new, so it is safe on a schedule.

The PageCrawl node can also be used as a tool by n8n AI agents.

Webhooks are managed by the PageCrawl Trigger node, which registers and removes
its own webhook automatically. The main node has no webhook resource.

### PageCrawl Trigger Node

Webhook trigger node that starts a workflow each time a check detects a change.

Features:
- Automatic webhook registration/deregistration
- Configurable payload fields
- Event filtering (changes, errors)
- Simplified output option
- Only deliveries signed by PageCrawl start the workflow: each one is checked against the webhook's signing secret, and deliveries older than five minutes are refused

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
- **Frequency**: How often to check (2 minutes to monthly, depending on plan)
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

- **Documentation**: [PageCrawl.io Docs](https://pagecrawl.io/developers)
- **API Reference**: [API Documentation](https://pagecrawl.io/developers)
- **Issues**: [GitHub Issues](https://github.com/pagecrawl/n8n-nodes-pagecrawl/issues)
- **Support**: support@pagecrawl.io

## License

MIT - See LICENSE file for details