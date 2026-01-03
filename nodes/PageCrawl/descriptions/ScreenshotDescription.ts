import { INodeProperties } from 'n8n-workflow';

export const screenshotOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['screenshot'],
			},
		},
		options: [
			{
				name: 'Get Screenshot',
				value: 'getScreenshot',
				description: 'Get full-page screenshot for a check',
				action: 'Get screenshot',
			},
			{
				name: 'Get Screenshot Diff',
				value: 'getScreenshotDiff',
				description: 'Get screenshot diff for a check',
				action: 'Get screenshot diff',
			},
		],
		default: 'getScreenshot',
	},
];

export const screenshotFields: INodeProperties[] = [
	// ========================================
	// screenshot:all
	// ========================================
	{
		displayName: 'Page',
		name: 'pageId',
		type: 'resourceLocator',
		required: true,
		displayOptions: {
			show: {
				resource: ['screenshot'],
			},
		},
		default: { mode: 'list', value: '' },
		description: 'Select a page or enter slug/ID. Find the slug in your page URL (pagecrawl.io/app/pages/{slug}). Enable Debug mode in Settings to see page IDs.',
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
		displayName: 'Check ID',
		name: 'checkId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['screenshot'],
			},
		},
		default: 'latest',
		description: 'The check ID to get screenshot for (defaults to "latest" for most recent)',
	},
	{
		displayName: 'Previous',
		name: 'previous',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['screenshot'],
				operation: ['getScreenshot'],
			},
		},
		default: false,
		description: 'Whether to get the screenshot from the previous check (before the specified one)',
	},
];