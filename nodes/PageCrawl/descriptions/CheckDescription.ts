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
				displayName: 'Simple',
				name: 'simple',
				type: 'boolean',
				default: false,
				description: 'Whether to return simplified response',
			},
			{
				displayName: 'Take',
				name: 'take',
				type: 'number',
				default: 0,
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
		default: '',
		description: 'The check ID (use "latest" for most recent)',
	},
];