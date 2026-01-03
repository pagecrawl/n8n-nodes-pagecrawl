import { INodeProperties } from 'n8n-workflow';

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
				name: 'Delete',
				value: 'delete',
				description: 'Delete a tracked page',
				action: 'Delete a page',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a tracked page configuration',
				action: 'Get a page',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get all tracked pages',
				action: 'Get many pages',
			},
			{
				name: 'Run Check Now',
				value: 'runCheckNow',
				description: 'Trigger an immediate check for a page',
				action: 'Run check now',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a tracked page',
				action: 'Update a page',
			},
		],
		default: 'getAll',
	},
];

export const pageFields: INodeProperties[] = [
	// ========================================
	// page:getAll
	// ========================================
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['page'],
				operation: ['getAll'],
			},
		},
		default: true,
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['page'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
		typeOptions: {
			minValue: 1,
		},
		default: 50,
		description: 'Max number of results to return',
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
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Folder',
				name: 'folder',
				type: 'string',
				default: '',
				description: 'Filter by folder. Use "*" for all folders, or specify folder path.',
			},
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
				description: 'Limit number of checks retrieved per page',
			},
		],
	},

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
				displayName: 'By Slug',
				name: 'slug',
				type: 'string',
				placeholder: 'e.g. my-page-name',
				validation: [
					{
						type: 'regex',
						properties: {
							regex: '^[a-z0-9-]+$',
							errorMessage: 'Slug must contain only lowercase letters, numbers, and hyphens',
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
				value: 'everything',
				description: 'Track all visible content on the page',
			},
			{
				name: 'Content Only',
				value: 'content',
				description: 'Track main content, ignoring navigation and sidebars',
			},
			{
				name: 'Reader Mode',
				value: 'reader',
				description: 'Extract and track article content only',
			},
		],
		default: 'everything',
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
				displayName: 'Ignore Duplicates',
				name: 'ignore_duplicates',
				type: 'boolean',
				default: false,
				description: 'Whether to prevent duplicate page additions',
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
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['page'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Label for the page',
	},
	{
		displayName: 'Elements',
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
						options: [
							{ name: 'Text', value: 'text' },
							{ name: 'Number', value: 'number' },
							{ name: 'Full Page', value: 'fullpage' },
						],
						default: 'text',
						description: 'Type of element to track',
					},
					{
						displayName: 'Selector',
						name: 'selector',
						type: 'string',
						default: '',
						description: 'CSS or XPath selector',
					},
					{
						displayName: 'Label',
						name: 'label',
						type: 'string',
						default: '',
						description: 'Short label for the element',
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
				operation: ['create'],
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
				displayName: 'Actions',
				name: 'actions',
				type: 'json',
				default: '[]',
				description: 'Actions to perform before tracking (JSON array)',
			},
			{
				displayName: 'Advanced',
				name: 'advanced',
				type: 'boolean',
				default: false,
				description: 'Whether to use advanced settings',
			},
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
				displayName: 'Fail Silently',
				name: 'fail_silently',
				type: 'options',
				options: [
					{ name: 'Send Error Notifications', value: 0 },
					{ name: 'Never Send Error Notifications', value: 1 },
				],
				default: 0,
				description: 'Error notification behavior',
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
				options: [
					{ name: 'Random Proxy', value: 'random1' },
					{ name: 'London, UK', value: 'lon1' },
					{ name: 'Toronto, CA', value: 'tor1' },
					{ name: 'New York, US', value: 'ny1' },
					{ name: 'Frankfurt, DE', value: 'fra1' },
				],
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
				description: 'List of proxies (one per line)',
			},
			{
				displayName: 'Rules',
				name: 'rules',
				type: 'json',
				default: '[]',
				description: 'Notification rules (JSON array)',
			},
			{
				displayName: 'Rules AND Logic',
				name: 'rules_and',
				type: 'boolean',
				default: false,
				description: 'Whether all rules must match for notification',
			},
			{
				displayName: 'Rules Enabled',
				name: 'rules_enabled',
				type: 'boolean',
				default: false,
				description: 'Whether to enable notification rules',
			},
			{
				displayName: 'Skip First Notification',
				name: 'skip_first_notification',
				type: 'boolean',
				default: false,
				description: 'Whether to skip the first notification after creating/updating',
			},
			{
				displayName: 'Track Type',
				name: 'track_type',
				type: 'options',
				options: [
					{ name: 'Single URL', value: 'one' },
					{ name: 'Multiple URLs', value: 'multiple' },
				],
				default: 'one',
				description: 'Track single or multiple URLs',
			},
			{
				displayName: 'URLs',
				name: 'urls',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'URLs to track (one per line, use || for custom titles)',
				displayOptions: {
					show: {
						track_type: ['multiple'],
					},
				},
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
				displayName: 'Workspace',
				name: 'workspace_id',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				description: 'Save page in a specific workspace',
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod: 'workspaceSearch',
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
				displayName: 'Folder',
				name: 'folder_id',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				description: 'Save page in a specific folder (Parent → Child → Folder)',
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
				displayName: 'Elements',
				name: 'elements',
				type: 'json',
				default: '[]',
				description: 'Elements to track (JSON array)',
			},
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
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Label for the page',
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