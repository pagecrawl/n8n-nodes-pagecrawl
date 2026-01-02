export interface IPageElement {
	type: 'text' | 'number' | 'fullpage';
	selector: string;
	label: string;
}

export interface INotificationRule {
	type: 'text_difference' | 'added' | 'removed' | 'contains' | 'ncontains' |
		'eq' | 'neq' | 'increased' | 'decreased' | 'is' |
		'gt' | 'lt' | 'gte' | 'lte';
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

export const WEBHOOK_PAYLOAD_FIELDS = [
	'id',
	'title',
	'status',
	'content_type',
	'visual_diff',
	'changed_at',
	'contents',
	'elements',
	'original',
	'difference',
	'human_difference',
	'page_screenshot_image',
	'text_difference_image',
	'html_difference',
	'markdown_difference',
	'page',
	'page_elements',
	'json',
	'json_patch',
	'previous_check',
];