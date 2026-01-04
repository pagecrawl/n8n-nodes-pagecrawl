import { INodeProperties } from 'n8n-workflow';

export const checkOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['check'],
			},
		},
		options: [
			{
				name: 'Get History',
				value: 'getHistory',
				description: 'Get check history for a page',
				action: 'Get check history',
			},
			{
				name: 'Get Text Diff HTML',
				value: 'getDiffHtml',
				description: 'Get text difference as HTML',
				action: 'Get text diff HTML',
			},
			{
				name: 'Get Text Diff Image',
				value: 'getDiffImage',
				description: 'Get text difference as image',
				action: 'Get text diff image',
			},
			{
				name: 'Get Text Diff Markdown',
				value: 'getDiffMarkdown',
				description: 'Get text difference as Markdown',
				action: 'Get text diff markdown',
			},
		],
		default: 'getHistory',
	},
];

export const checkFields: INodeProperties[] = [
	// ========================================
	// check:getHistory
	// ========================================
	{
		displayName: 'Page',
		name: 'pageId',
		type: 'resourceLocator',
		required: true,
		displayOptions: {
			show: {
				resource: ['check'],
			},
		},
		default: { mode: 'list', value: '' },
		description: 'Select a page or enter slug/ID. Find the slug in your page URL (pagecrawl.io/app/pages/{slug}) or enable Debug mode in Settings to see page IDs.',
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
					regex: 'https://pagecrawl\\.io/app/pages/([a-z0-9_-]+)',
				},
				validation: [
					{
						type: 'regex',
						properties: {
							regex: '^https://pagecrawl\\.io/app/pages/[a-z0-9_-]+$',
							errorMessage: 'Must be a valid PageCrawl page URL (e.g. https://pagecrawl.io/app/pages/my-page)',
						},
					},
				],
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. 12345 or my-page-slug',
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
				resource: ['check'],
				operation: ['getHistory'],
			},
		},
		options: [
			{
				displayName: 'Advanced',
				name: 'advanced',
				type: 'boolean',
				default: false,
				description: 'Whether to return full response with all fields',
			},
			{
				displayName: 'Take',
				name: 'take',
				type: 'number',
				default: 2,
				description: 'Limit number of checks retrieved',
				typeOptions: {
					minValue: 0,
				},
			},
		],
	},

	// ========================================
	// check:getDiff*
	// ========================================
	{
		displayName: 'Check ID',
		name: 'checkId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['check'],
				operation: ['getDiffHtml', 'getDiffImage', 'getDiffMarkdown'],
			},
		},
		default: 'latest',
		description: 'The check ID to get diff for (defaults to "latest" for most recent)',
	},
];