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
				name: 'Get Check Screenshot',
				value: 'getCheckScreenshot',
				description: 'Get screenshot for a specific check',
				action: 'Get check screenshot',
			},
			{
				name: 'Get Check Screenshot Diff',
				value: 'getCheckDiff',
				description: 'Get screenshot diff for a specific check',
				action: 'Get check screenshot diff',
			},
			{
				name: 'Get Latest Screenshot',
				value: 'getLatest',
				description: 'Get latest full-page screenshot',
				action: 'Get latest screenshot',
			},
			{
				name: 'Get Latest Screenshot Diff',
				value: 'getLatestDiff',
				description: 'Get latest screenshot diff',
				action: 'Get latest screenshot diff',
			},
		],
		default: 'getLatest',
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

	// ========================================
	// screenshot:getCheckScreenshot, getCheckDiff
	// ========================================
	{
		displayName: 'Check ID',
		name: 'checkId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['screenshot'],
				operation: ['getCheckScreenshot', 'getCheckDiff'],
			},
		},
		default: '',
		description: 'The check ID (use "latest" for most recent)',
	},
];