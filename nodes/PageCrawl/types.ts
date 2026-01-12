export interface IPageElement {
	type: 'text' | 'number' | 'fullpage';
	selector: string;
	label: string;
}

export interface INotificationRule {
	type: 'text_difference' | 'added' | 'removed' | 'contains' | 'ncontains' |
		'eq' | 'neq' | 'increased' | 'decreased' | 'is' |
		'gt' | 'lt' | 'gte' | 'lte' | 'ignore_text';
	value: string | number;
	element?: number;
}

export interface IPageAction {
	type: 'scroll_to_bottom' | 'remove_dates' | 'remove_cookies' | 'remove_cookies_v2' |
		'click' | 'hover' | 'type' | 'select' | 'remove_element' |
		'wait_element' | 'wait' | 'javascript' | 'back';
	selector?: string;
	value?: string | number;
}

export interface IPage {
	id: number;
	name: string;
	slug: string;
	url: string;
	url_tld: string;
	created_at: string | null;
	last_checked_at: string | null;
	status: string;
	failed: number;
	disabled?: boolean;
	frequency?: number;
	location?: string;
	folder_id?: number;
	template_id?: number;
	auth_id?: number;
	skip_first_notification?: boolean;
	notifications?: string[];
	notification_emails?: string;
	fail_silently?: number;
	check_always?: boolean;
	advanced?: boolean;
	auth_username?: string;
	auth_password?: string;
	user_agent?: string;
	proxies?: string;
	headers?: any;
	rules_enabled?: boolean;
	rules_and?: boolean;
	rules?: INotificationRule[];
	actions?: IPageAction[];
	elements?: IPageElement[];
	tags?: string[];
	latest?: {
		numeric: boolean;
		contents: string | null;
		changed_at: string | null;
		difference: number | null;
		human_difference: string | null;
		three_month_difference: number | null;
		three_month_human_difference: string | null;
	};
}

export interface ICheck {
	id: number;
	status: string;
	seen: string | null;
	created_at: string;
	content_type: string | null;
	visual_diff: number | null;
	elements: ICheckElement[];
}

export interface ICheckElement {
	id: number;
	contents: string | null;
	difference: number | null;
	hash: string;
	changed: boolean;
	original: string | null;
	elements: number;
}

export interface IWebhook {
	id?: number;
	change_id?: number;
	target_url: string;
	event_type?: string;
	events?: string[];
	payload_fields?: string[];
	is_active?: boolean;
	failures?: number;
}

export const FREQUENCIES = [
	{ value: 3, label: 'Every 3 minutes' },
	{ value: 5, label: 'Every 5 minutes' },
	{ value: 10, label: 'Every 10 minutes' },
	{ value: 15, label: 'Every 15 minutes' },
	{ value: 30, label: 'Every 30 minutes' },
	{ value: 60, label: 'Hourly' },
	{ value: 180, label: 'Every 3 hours' },
	{ value: 360, label: 'Every 6 hours' },
	{ value: 720, label: 'Every 12 hours' },
	{ value: 1440, label: 'Daily' },
	{ value: 2880, label: 'Every 2 days' },
	{ value: 10080, label: 'Weekly' },
];

export const LOCATIONS = [
	{ value: 'random1', label: 'Random Proxy' },
	{ value: 'lon1', label: 'London, UK' },
	{ value: 'tor1', label: 'Toronto, CA' },
	{ value: 'ny1', label: 'New York, US' },
	{ value: 'fra1', label: 'Frankfurt, DE' },
];

export const NOTIFICATION_CHANNELS = [
	{ value: 'mail', label: 'Email' },
	{ value: 'slack', label: 'Slack' },
	{ value: 'discord', label: 'Discord' },
	{ value: 'teams', label: 'Microsoft Teams' },
	{ value: 'telegram', label: 'Telegram' },
];

export const WEBHOOK_PAYLOAD_FIELDS: { value: string; description: string }[] = [
	{ value: 'id', description: 'Unique identifier of this check' },
	{ value: 'title', description: 'The page title extracted from the monitored page' },
	{ value: 'status', description: 'Check status (e.g., changed, unchanged, failed)' },
	{ value: 'event_type', description: 'Type of event that triggered the webhook (change_detected or error)' },
	{ value: 'content_type', description: 'Document content type (e.g., text/html, text/css, application/json)' },
	{ value: 'visual_diff', description: 'Visual difference percentage between current and previous screenshots (0-100)' },
	{ value: 'changed_at', description: 'ISO 8601 timestamp when the change was detected' },
	{ value: 'contents', description: 'Current content of tracked elements or full page text' },
	{ value: 'difference', description: 'Numerical difference value (e.g., price change percentage, text difference)' },
	{ value: 'human_difference', description: 'Human-readable description of the change (e.g., "+5.2% increased")' },
	{ value: 'page_screenshot_image', description: 'URL to the screenshot image of the current page state' },
	{ value: 'text_difference_image', description: 'URL to the image highlighting text differences' },
	{ value: 'html_difference', description: 'HTML diff markup showing added/removed content with highlighting' },
	{ value: 'markdown_difference', description: 'Markdown-formatted diff showing changes in text format' },
	{ value: 'page', description: 'Page object with metadata (URL, name, frequency, settings, etc.)' },
	{ value: 'page_elements', description: 'Array of tracked elements with their current values and change status' },
	{ value: 'json', description: 'Parsed JSON data if the page returns JSON content' },
	{ value: 'json_patch', description: 'RFC 6902 JSON Patch operations describing exact changes to JSON data' },
	{ value: 'previous_check', description: 'Data from the previous check for comparison' },
	{ value: 'ai_summary', description: 'AI-generated natural language summary of what changed and why it matters' },
	{ value: 'ai_priority_score', description: 'AI-generated priority score (1-100) indicating importance of the change' },
];