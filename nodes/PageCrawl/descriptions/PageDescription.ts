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
				value: 'create',
				description: 'Create a new tracked page',
				action: 'Create a page',
			},
			{
				name: 'Create Simple',
				value: 'createSimple',
				description: 'Create a page with simplified options',
				action: 'Create a simple page',
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
		displayName: 'Page ID',
		name: 'pageId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['page'],
				operation: ['get', 'update', 'delete', 'runCheckNow'],
			},
		},
		default: '',
		description: 'The ID or slug of the page',
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
				displayName: 'CSS/XPath Selector',
				name: 'selector',
				type: 'string',
				default: '',
				description: 'CSS or XPath selector. If empty, tracks full page.',
			},
			{
				displayName: 'Frequency',
				name: 'frequency',
				type: 'options',
				options: [
					{ name: 'Every 3 Minutes', value: 3 },
					{ name: 'Every 5 Minutes', value: 5 },
					{ name: 'Every 10 Minutes', value: 10 },
					{ name: 'Every 15 Minutes', value: 15 },
					{ name: 'Every 30 Minutes', value: 30 },
					{ name: 'Hourly', value: 60 },
					{ name: 'Every 3 Hours', value: 180 },
					{ name: 'Every 6 Hours', value: 360 },
					{ name: 'Every 12 Hours', value: 720 },
					{ name: 'Daily', value: 1440 },
					{ name: 'Every 2 Days', value: 2880 },
					{ name: 'Weekly', value: 10080 },
				],
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
		options: [
			{ name: 'Every 3 Minutes', value: 3 },
			{ name: 'Every 5 Minutes', value: 5 },
			{ name: 'Every 10 Minutes', value: 10 },
			{ name: 'Every 15 Minutes', value: 15 },
			{ name: 'Every 30 Minutes', value: 30 },
			{ name: 'Hourly', value: 60 },
			{ name: 'Every 3 Hours', value: 180 },
			{ name: 'Every 6 Hours', value: 360 },
			{ name: 'Every 12 Hours', value: 720 },
			{ name: 'Daily', value: 1440 },
			{ name: 'Every 2 Days', value: 2880 },
			{ name: 'Weekly', value: 10080 },
		],
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
				displayName: 'Folder ID',
				name: 'folder_id',
				type: 'number',
				default: 0,
				description: 'Save page in a specific folder (by folder ID)',
			},
			{
				displayName: 'Template ID',
				name: 'template_id',
				type: 'number',
				default: 0,
				description: 'Use a specific template configuration (by template ID)',
			},
			{
				displayName: 'Auth ID',
				name: 'auth_id',
				type: 'number',
				default: 0,
				description: 'Use a specific authentication configuration (by auth ID)',
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
				options: [
					{ name: 'Every 3 Minutes', value: 3 },
					{ name: 'Every 5 Minutes', value: 5 },
					{ name: 'Every 10 Minutes', value: 10 },
					{ name: 'Every 15 Minutes', value: 15 },
					{ name: 'Every 30 Minutes', value: 30 },
					{ name: 'Hourly', value: 60 },
					{ name: 'Every 3 Hours', value: 180 },
					{ name: 'Every 6 Hours', value: 360 },
					{ name: 'Every 12 Hours', value: 720 },
					{ name: 'Daily', value: 1440 },
					{ name: 'Every 2 Days', value: 2880 },
					{ name: 'Weekly', value: 10080 },
				],
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