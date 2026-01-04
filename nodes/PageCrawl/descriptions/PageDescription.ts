import { INodeProperties } from 'n8n-workflow';
import { LANGUAGES } from '../data/languages';
import { TIMEZONES } from '../data/timezones';

export const pageOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['page'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'createSimple',
				description: 'Create a new tracked page with guided options',
				action: 'Create a page',
			},
			{
				name: 'Create (Advanced)',
				value: 'create',
				description: 'Create a page with full configuration options',
				action: 'Create an advanced page',
			},
			{
				name: 'Run Check Now',
				value: 'runCheckNow',
				description: 'Trigger an immediate check for a page',
				action: 'Run check now',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a tracked page configuration',
				action: 'Get a page',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a tracked page',
				action: 'Update a page',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a tracked page',
				action: 'Delete a page',
			},
		],
		default: 'get',
	},
];

export const pageFields: INodeProperties[] = [
	// ========================================
	// page:get
	// ========================================
	{
		displayName: 'Page',
		name: 'pageId',
		type: 'resourceLocator',
		required: true,
		displayOptions: {
			show: {
				resource: ['page'],
				operation: ['get', 'update', 'delete', 'runCheckNow'],
			},
		},
		default: { mode: 'list', value: '' },
		description: 'Select a page or enter slug/ID. <a href="https://pagecrawl.io/app/pages" target="_blank">View pages</a>.',
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'pageSearch',
					searchable: true,
					},
			},
			{
				displayName: 'By URL',
				name: 'url',
				type: 'string',
				placeholder: 'e.g. https://pagecrawl.io/app/pages/example-domain',
				extractValue: {
					type: 'regex',
					regex: 'https:\\/\\/pagecrawl\\.io\\/app\\/pages\\/([a-z0-9_-]+)',
				},
				validation: [
					{
						type: 'regex',
						properties: {
							regex: '^https:\\/\\/pagecrawl\\.io\\/app\\/pages\\/[a-z0-9_-]+$',
							errorMessage: 'Must be a valid PageCrawl page URL (e.g. https://pagecrawl.io/app/pages/my-page)',
						},
					},
				],
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. 12345',
				validation: [
					{
						type: 'regex',
						properties: {
							regex: '^[0-9]+$',
							errorMessage: 'ID must be a number',
						},
					},
				],
			},
		],
	},
	{
		displayName: 'Options',
		name: 'runCheckOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['page'],
				operation: ['runCheckNow'],
			},
		},
		options: [
			{
				displayName: 'Skip First Notification',
				name: 'skip_first_notification',
				type: 'boolean',
				default: false,
				description: 'Whether to skip notification for this check',
			},
		],
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['page'],
				operation: ['get'],
			},
		},
		options: [
			{
				displayName: 'Simple',
				name: 'simple',
				type: 'boolean',
				default: false,
				description: 'Whether to return simplified response without configuration options',
			},
			{
				displayName: 'Take',
				name: 'take',
				type: 'number',
				default: 0,
				description: 'Limit number of checks retrieved',
			},
		],
	},

	// ========================================
	// page:createSimple
	// ========================================
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['page'],
				operation: ['createSimple'],
			},
		},
		default: '',
		placeholder: 'https://example.com',
		description: 'The URL to track',
	},
	{
		displayName: 'Title',
		name: 'name',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['page'],
				operation: ['createSimple'],
			},
		},
		default: '',
		description: 'Optional title for this page (defaults to page title if empty)',
	},
	{
		displayName: 'Tracking Type',
		name: 'trackingType',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['page'],
				operation: ['createSimple'],
			},
		},
		options: [
			{
				name: 'Full Page',
				value: 'fullpage',
				description: 'Track the entire page for changes',
			},
			{
				name: 'Selected Area',
				value: 'text',
				description: 'Track a specific area using CSS/XPath selector',
			},
			{
				name: 'Number',
				value: 'number',
				description: 'Track a numeric value (e.g., stock count, ratings)',
			},
			{
				name: 'Price',
				value: 'price',
				description: 'Auto-detect and track price changes',
			},
		],
		default: 'fullpage',
		description: 'What type of content to track',
	},
	{
		displayName: 'Full Page Mode',
		name: 'fullpageMode',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['page'],
				operation: ['createSimple'],
				trackingType: ['fullpage'],
			},
		},
		options: [
			{
				name: 'Everything On Page',
				value: '*',
				description: 'Track all visible content on the page',
			},
			{
				name: 'Content Only',
				value: 'content',
				description: 'Track main content, ignoring navigation and sidebars',
			},
			{
				name: 'Reader Mode',
				value: 'article',
				description: 'Extract and track article content only',
			},
		],
		default: '*',
		description: 'How to extract page content',
	},
	{
		displayName: 'CSS/XPath Selector',
		name: 'selector',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['page'],
				operation: ['createSimple'],
				trackingType: ['text', 'number'],
			},
		},
		default: '',
		placeholder: 'e.g. .price, #stock-count, //div[@class="value"]',
		description: 'CSS selector or XPath expression to locate the element',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['page'],
				operation: ['createSimple'],
			},
		},
		options: [
			{
				displayName: 'Ignore Duplicates',
				name: 'ignore_duplicates',
				type: 'boolean',
				default: false,
				description: 'Whether to prevent duplicate page additions',
			},
			{
				displayName: 'Folder',
				name: 'folder_id',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				description: 'Save page in a specific folder',
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod: 'folderSearch',
							searchable: true,
							},
					},
					{
						displayName: 'By ID',
						name: 'id',
						type: 'string',
						placeholder: 'e.g. 123',
					},
				],
			},
			{
				displayName: 'Template',
				name: 'template_id',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				description: 'Use a template to pre-fill page settings',
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod: 'templateSearch',
							searchable: true,
							},
					},
					{
						displayName: 'By ID',
						name: 'id',
						type: 'string',
						placeholder: 'e.g. 123',
					},
				],
			},
		],
	},

	// ========================================
	// page:create
	// ========================================
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['page'],
				operation: ['create'],
			},
		},
		default: '',
		placeholder: 'https://example.com',
		description: 'The URL to track',
	},
	{
		displayName: 'Title',
		name: 'name',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['page'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Optional title for this page (defaults to page title if empty)',
	},
	{
		displayName: 'Tracked Elements',
		name: 'elements',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		displayOptions: {
			show: {
				resource: ['page'],
				operation: ['create'],
			},
		},
		description: 'Elements to track on the page',
		default: {},
		options: [
			{
				name: 'element',
				displayName: 'Element',
				values: [
					{
						displayName: 'Type',
						name: 'type',
						type: 'options',
						required: true,
						options: [
							// Commonly used
							{ name: 'Full Page Text', value: 'fullpage' },
							{ name: 'Text', value: 'text' },
							{ name: 'Number', value: 'number' },
							{ name: 'Visual', value: 'visual' },
							// Page Areas
							{ name: 'Price', value: 'price' },
							{ name: 'Links', value: 'links' },
							{ name: 'Iframes', value: 'fullpage_iframe' },
							// Files
							{ name: 'PDF File', value: 'pdf' },
							{ name: 'Word File', value: 'docx' },
							{ name: 'Excel File', value: 'xlsx' },
							{ name: 'CSV File', value: 'csv' },
							{ name: 'File Checksum', value: 'file_hash' },
							// Multiple matching elements
							{ name: 'Text (All Matches)', value: 'text_multiple' },
							{ name: 'Text (All Matches, Sorted)', value: 'text_multiple_sorted' },
							{ name: 'HTML (All Matches)', value: 'html_multiple' },
							// Advanced
							{ name: 'Text Presence', value: 'boolean' },
							{ name: 'HTML', value: 'html' },
							{ name: 'JavaScript', value: 'javascript' },
						],
						default: 'text',
						description: 'Type of element to track',
					},
					// Full Page mode dropdown
					{
						displayName: 'Page Mode',
						name: 'selector',
						type: 'options',
						required: true,
						displayOptions: {
							show: {
								type: ['fullpage'],
							},
						},
						options: [
							{ name: 'Everything On Page', value: '*' },
							{ name: 'Content Only', value: 'content' },
							{ name: 'Reader Mode', value: 'article' },
						],
						default: '*',
						description: 'How to extract page content',
					},
					// Links mode dropdown
					{
						displayName: 'Link Type',
						name: 'selector',
						type: 'options',
						required: true,
						displayOptions: {
							show: {
								type: ['links'],
							},
						},
						options: [
							{ name: 'Internal Links', value: 'internal' },
							{ name: 'External Links', value: '*' },
							{ name: 'All Links', value: 'both' },
						],
						default: '*',
						description: 'Which links to monitor',
					},
					// CSS/XPath selector for text-based types
					{
						displayName: 'CSS/XPath Selector',
						name: 'selector',
						type: 'string',
						required: true,
						displayOptions: {
							show: {
								type: ['text', 'number', 'visual', 'html', 'text_multiple', 'text_multiple_sorted', 'html_multiple'],
							},
						},
						default: '',
						placeholder: 'e.g. .price, #stock, //div[@class="value"]',
						description: 'CSS selector or XPath expression. For visual type, use coordinates format: x,y,width,height',
					},
					// Price min value
					{
						displayName: 'Min Price',
						name: 'selector',
						type: 'string',
						displayOptions: {
							show: {
								type: ['price'],
							},
						},
						default: '',
						placeholder: 'e.g. 50',
						description: 'Minimum price to track (leave empty for any price)',
					},
					// JavaScript code
					{
						displayName: 'JavaScript Code',
						name: 'selector',
						type: 'string',
						required: true,
						typeOptions: {
							rows: 4,
						},
						displayOptions: {
							show: {
								type: ['javascript'],
							},
						},
						default: '',
						placeholder: '(() => {\n  const el = document.querySelector(".price");\n  return el ? el.innerText : "Not found";\n})()',
						description: 'JavaScript code to execute and return a value',
					},
					// Boolean keywords
					{
						displayName: 'Keywords',
						name: 'selector',
						type: 'string',
						required: true,
						displayOptions: {
							show: {
								type: ['boolean'],
							},
						},
						default: '',
						placeholder: 'e.g. sold out, out of stock',
						description: 'Comma-separated keywords to search for. Prefix with NOT: to invert (e.g. NOT:in stock)',
					},
					{
						displayName: 'Label',
						name: 'label',
						type: 'string',
						default: '',
						description: 'Short label for the element',
					},
					{
						displayName: 'Threshold',
						name: 'threshold',
						type: 'options',
						options: [

							{ name: 'Any Change', value: null as unknown as number },
							{ name: 'Do Not Trigger', value: -1 },
							{ name: 'Tiny (1%)', value: 1 },
							{ name: 'Very Minor (3%)', value: 3 },
							{ name: 'Minor (5%)', value: 5 },
							{ name: 'Moderate (10%)', value: 10 },
							{ name: 'Significant (30%)', value: 30 },
							{ name: 'Very High (50%)', value: 50 },
							{ name: 'Extremely High (80%)', value: 80 },
						],
						default: null,
						description: 'Minimum change percentage to trigger notification',
					},
				],
			},
		],
	},
	{
		displayName: 'Actions',
		name: 'actions',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		displayOptions: {
			show: {
				resource: ['page'],
				operation: ['create'],
			},
		},
		default: {},
		description: 'Actions to perform before tracking the page',
		options: [
			{
				name: 'action',
				displayName: 'Action',
				values: [
					{
						displayName: 'Action Type',
						name: 'type',
						type: 'options',
						options: [
							{ name: 'Click Element', value: 'click' },
							{ name: 'Type Text', value: 'type' },
							{ name: 'Wait (Seconds)', value: 'wait' },
							{ name: 'Wait for Element', value: 'wait_element' },
							{ name: 'Scroll to Bottom', value: 'scroll_to_bottom' },
							{ name: 'Remove Element', value: 'remove_element' },
							{ name: 'Hide Cookie Banners', value: 'remove_cookies_v2' },
							{ name: 'Hover Element', value: 'hover' },
							{ name: 'Run JavaScript', value: 'javascript' },
							{ name: 'Go Back', value: 'back' },
						],
						default: 'click',
						description: 'Type of action to perform',
					},
					{
						displayName: 'CSS/XPath Selector',
						name: 'selector',
						type: 'string',
						default: '',
						placeholder: 'e.g. .button, #submit, //button[@type="submit"]',
						description: 'CSS selector or XPath to target element',
						displayOptions: {
							show: {
								type: ['click', 'hover', 'type', 'remove_element', 'wait_element'],
							},
						},
					},
					{
						displayName: 'Text to Type',
						name: 'value',
						type: 'string',
						default: '',
						description: 'Text to type into the element',
						displayOptions: {
							show: {
								type: ['type'],
							},
						},
					},
					{
						displayName: 'Seconds',
						name: 'value',
						type: 'number',
						default: 3,
						typeOptions: {
							minValue: 1,
							maxValue: 30,
						},
						description: 'Number of seconds to wait',
						displayOptions: {
							show: {
								type: ['wait'],
							},
						},
					},
					{
						displayName: 'JavaScript Code',
						name: 'value',
						type: 'string',
						typeOptions: {
							rows: 4,
						},
						default: '',
						placeholder: "document.querySelector('.popup').remove()",
						description: 'JavaScript code to execute on the page',
						displayOptions: {
							show: {
								type: ['javascript'],
							},
						},
					},
				],
			},
		],
	},
	{
		displayName: 'Enable Conditions & Filters',
		name: 'rules_enabled',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['page'],
				operation: ['create'],
			},
		},
		description: 'Whether to enable conditional notification rules',
	},
	{
		displayName: 'Match All Conditions',
		name: 'rules_and',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['page'],
				operation: ['create'],
				rules_enabled: [true],
			},
		},
		description: 'Whether all conditions must match (AND) or any condition (OR)',
	},
	{
		displayName: 'Always Record Changes',
		name: 'record_always',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['page'],
				operation: ['create'],
				rules_enabled: [true],
			},
		},
		description: 'Whether to record all change detections even when conditions are not met. Notifications are only sent when conditions match.',
	},
	{
		displayName: 'Conditions & Filters',
		name: 'rules',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		displayOptions: {
			show: {
				resource: ['page'],
				operation: ['create'],
				rules_enabled: [true],
			},
		},
		description: 'Only notify when these conditions are met',
		options: [
			{
				name: 'rule',
				displayName: 'Condition',
				values: [
					{
						displayName: 'Element Index',
						name: 'element',
						type: 'number',
						default: 0,
						description: 'Which tracked element to check (0 = first, 1 = second, etc.)',
					},
					{
						displayName: 'Condition',
						name: 'type',
						type: 'options',
						options: [
							{ name: 'Keyword Appeared', value: 'added', description: 'Notify when keyword appears' },
							{ name: 'Keyword Disappeared', value: 'removed', description: 'Notify when keyword disappears' },
							{ name: 'Text Contains', value: 'contains', description: 'Notify when text contains value' },
							{ name: 'Text Does Not Contain', value: 'ncontains', description: 'Notify when text does not contain value' },
							{ name: 'Text Equals', value: 'eq', description: 'Notify when text exactly matches value' },
							{ name: 'Text Does Not Equal', value: 'neq', description: 'Notify when text does not match value' },
							{ name: 'Greater Than', value: 'gt', description: 'Value is greater than threshold' },
							{ name: 'Less Than', value: 'lt', description: 'Value is less than threshold' },
							{ name: 'Increased By %', value: 'increased', description: 'Value increased by percentage' },
							{ name: 'Decreased By %', value: 'decreased', description: 'Value decreased by percentage' },
							{ name: 'Ignore Text', value: 'ignore_text', description: 'Ignore specific text patterns' },
						],
						default: 'contains',
						description: 'Type of condition to apply',
					},
					{
						displayName: 'Keywords',
						name: 'value',
						type: 'string',
						default: '',
						placeholder: 'sold out, unavailable',
						description: 'Comma-separated keywords to watch for',
						displayOptions: {
							show: {
								type: ['added', 'removed', 'contains', 'ncontains'],
							},
						},
					},
					{
						displayName: 'Text Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'Exact text value to match',
						displayOptions: {
							show: {
								type: ['eq', 'neq'],
							},
						},
					},
					{
						displayName: 'Threshold',
						name: 'value',
						type: 'number',
						default: 0,
						description: 'Numeric threshold value',
						displayOptions: {
							show: {
								type: ['gt', 'lt', 'increased', 'decreased'],
							},
						},
					},
					{
						displayName: 'Text to Ignore',
						name: 'value',
						type: 'string',
						typeOptions: {
							rows: 3,
						},
						default: '',
						placeholder: 'One pattern per line',
						description: 'Text patterns to ignore when detecting changes',
						displayOptions: {
							show: {
								type: ['ignore_text'],
							},
						},
					},
				],
			},
		],
	},
	{
		displayName: 'Frequency',
		name: 'frequency',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['page'],
				operation: ['create', 'createSimple'],
			},
		},
		typeOptions: {
			loadOptionsMethod: 'getFrequencies',
		},
		default: 1440,
		description: 'How often to check for changes',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['page'],
				operation: ['create', 'update'],
			},
		},
		options: [
			{
				displayName: 'Auth Password',
				name: 'auth_password',
				type: 'string',
				typeOptions: {
					password: true,
				},
				default: '',
				description: 'HTTP Basic authentication password',
			},
			{
				displayName: 'Auth Username',
				name: 'auth_username',
				type: 'string',
				default: '',
				description: 'HTTP Basic authentication username',
			},
			{
				displayName: 'Check Always',
				name: 'check_always',
				type: 'boolean',
				default: false,
				description: 'Whether to always check even on errors',
			},
			{
				displayName: 'Disabled',
				name: 'disabled',
				type: 'boolean',
				default: false,
				description: 'Whether to disable page monitoring',
			},
			{
				displayName: 'Headers',
				name: 'headers',
				type: 'json',
				default: '{}',
				description: 'Custom headers (JSON object)',
			},
			{
				displayName: 'Ignore Duplicates',
				name: 'ignore_duplicates',
				type: 'boolean',
				default: false,
				description: 'Whether to prevent duplicate page additions',
			},
			{
				displayName: 'Location',
				name: 'location',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getLocations',
				},
				default: 'random1',
				description: 'Server location to make requests from',
			},
			{
				displayName: 'Notification Channels',
				name: 'notifications',
				type: 'multiOptions',
				options: [
					{ name: 'Email', value: 'mail' },
					{ name: 'Slack', value: 'slack' },
					{ name: 'Discord', value: 'discord' },
					{ name: 'Microsoft Teams', value: 'teams' },
					{ name: 'Telegram', value: 'telegram' },
				],
				default: [],
				description: 'Notification channels to use',
			},
			{
				displayName: 'Notification Emails',
				name: 'notification_emails',
				type: 'string',
				default: '',
				description: 'Comma-separated list of notification email addresses',
			},
			{
				displayName: 'Proxies',
				name: 'proxies',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'List of proxies (one per line, user:password@hostname:port format)',
			},
			{
				displayName: 'Skip First Notification',
				name: 'skip_first_notification',
				type: 'boolean',
				default: false,
				description: 'Whether to skip the first notification after creating/updating',
			},
			{
				displayName: 'User Agent',
				name: 'user_agent',
				type: 'string',
				default: '',
				description: 'Custom browser User-Agent string',
			},
			{
				displayName: 'Tags',
				name: 'tags',
				type: 'string',
				default: '',
				description: 'Comma-separated list of tags for the page',
			},
			{
				displayName: 'Folder',
				name: 'folder_id',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				description: 'Save page in a specific folder',
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod: 'folderSearch',
							searchable: true,
							},
					},
					{
						displayName: 'By ID',
						name: 'id',
						type: 'string',
						placeholder: 'e.g. 123',
					},
				],
			},
			{
				displayName: 'Template',
				name: 'template_id',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				description: 'Use a template to pre-fill page settings',
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod: 'templateSearch',
							searchable: true,
							},
					},
					{
						displayName: 'By ID',
						name: 'id',
						type: 'string',
						placeholder: 'e.g. 123',
					},
				],
			},
			{
				displayName: 'Auth',
				name: 'auth_id',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				description: 'Use a saved authentication configuration',
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod: 'authSearch',
							searchable: true,
							},
					},
					{
						displayName: 'By ID',
						name: 'id',
						type: 'string',
						placeholder: 'e.g. 123',
					},
				],
			},
			{
				displayName: 'Device',
				name: 'device',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getDevices',
				},
				default: '',
				description: 'Device viewport simulation',
			},
			{
				displayName: 'Language',
				name: 'language',
				type: 'options',
				options: LANGUAGES,
				default: '',
				description: 'Browser language setting',
			},
			{
				displayName: 'Timezone',
				name: 'timezone',
				type: 'options',
				options: TIMEZONES,
				default: '',
				description: 'Browser timezone setting',
			},
			{
				displayName: 'Screenshots',
				name: 'screenshots',
				type: 'boolean',
				default: true,
				description: 'Whether to capture screenshots',
			},
			{
				displayName: 'AI Summaries Enabled',
				name: 'ai_summaries_enabled',
				type: 'boolean',
				default: true,
				description: 'Whether to enable AI-generated summaries',
			},
			{
				displayName: 'AI Context',
				name: 'ai_page_focus',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'Context to help AI generate more relevant summaries',
			},
			{
				displayName: 'AI Model',
				name: 'ai_model',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getAIModels',
				},
				default: '',
				description: 'Override AI model (leave empty for workspace default)',
			},
		],
	},

	// ========================================
	// page:update
	// ========================================
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['page'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Frequency',
				name: 'frequency',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getFrequencies',
				},
				default: 1440,
				description: 'How often to check for changes',
			},
			{
				displayName: 'Title',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Title for this page',
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				default: '',
				description: 'The URL to track',
			},
		],
	},
];