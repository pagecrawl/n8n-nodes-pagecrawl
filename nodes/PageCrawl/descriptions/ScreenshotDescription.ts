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
		displayName: 'Page ID',
		name: 'pageId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['screenshot'],
			},
		},
		default: '',
		description: 'The ID or slug of the page',
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