import { INodeProperties } from 'n8n-workflow';

export const dataSourceOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['dataSource'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a data source that receives values instead of checking a URL',
				action: 'Create a data source',
			},
			{
				name: 'Push Value',
				value: 'pushValue',
				description: 'Record new values in a data source',
				action: 'Push a value to a data source',
			},
		],
		default: 'pushValue',
	},
];

export const dataSourceFields: INodeProperties[] = [
	// ========================================
	// dataSource:create
	// ========================================
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['dataSource'], operation: ['create'] } },
		default: '',
		placeholder: 'e.g. Competitor price',
	},
	{
		displayName: 'Fields',
		name: 'fields',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		displayOptions: { show: { resource: ['dataSource'], operation: ['create'] } },
		default: {},
		placeholder: 'Add Field',
		description: 'Named values to track. Leave empty to track a single value.',
		options: [
			{
				displayName: 'Field',
				name: 'field',
				values: [
					{
						displayName: 'Label',
						name: 'label',
						type: 'string',
						default: '',
						placeholder: 'e.g. price',
						description: 'The field name, used as the key when pushing values',
					},
					{
						displayName: 'Type',
						name: 'type',
						type: 'options',
						options: [
							{ name: 'Number', value: 'number' },
							{ name: 'Price', value: 'price' },
							{ name: 'Text', value: 'text' },
						],
						default: 'text',
					},
				],
			},
		],
	},

	// ========================================
	// dataSource:pushValue
	// ========================================
	{
		displayName: 'Ingest URL',
		name: 'ingestUrl',
		type: 'string',
		typeOptions: { password: true },
		required: true,
		displayOptions: { show: { resource: ['dataSource'], operation: ['pushValue'] } },
		default: '',
		placeholder: 'https://pagecrawl.io/api/ingest/data-...',
		description:
			'The data source\'s secret ingest URL, shown in its "Send data" panel and returned when it is created. Treat it like a password.',
	},
	{
		displayName: 'Send',
		name: 'valueMode',
		type: 'options',
		displayOptions: { show: { resource: ['dataSource'], operation: ['pushValue'] } },
		options: [
			{ name: 'One Value', value: 'single', description: 'For a data source without named fields' },
			{ name: 'Named Fields', value: 'fields', description: 'One value per field. New names become new fields.' },
		],
		default: 'single',
	},
	{
		displayName: 'Value',
		name: 'value',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['dataSource'], operation: ['pushValue'], valueMode: ['single'] } },
		default: '',
	},
	{
		displayName: 'Values',
		name: 'values',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		displayOptions: { show: { resource: ['dataSource'], operation: ['pushValue'], valueMode: ['fields'] } },
		default: {},
		placeholder: 'Add Value',
		options: [
			{
				displayName: 'Value',
				name: 'value',
				values: [
					{ displayName: 'Field', name: 'name', type: 'string', default: '', placeholder: 'e.g. price' },
					{ displayName: 'Value', name: 'value', type: 'string', default: '' },
				],
			},
		],
	},
];
