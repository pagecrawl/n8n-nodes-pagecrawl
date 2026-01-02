import { INodeProperties } from 'n8n-workflow';
import { WEBHOOK_PAYLOAD_FIELDS } from '../types';

export const webhookOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['webhook'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new webhook',
				action: 'Create a webhook',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a webhook',
				action: 'Delete a webhook',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get all webhooks',
				action: 'Get many webhooks',
			},
			{
				name: 'Test',
				value: 'test',
				description: 'Test a webhook',
				action: 'Test a webhook',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a webhook',
				action: 'Update a webhook',
			},
		],
		default: 'getAll',
	},
];

export const webhookFields: INodeProperties[] = [
	// ========================================
	// webhook:getAll
	// ========================================
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['webhook'],
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
				resource: ['webhook'],
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

	// ========================================
	// webhook:create
	// ========================================
	{
		displayName: 'Target URL',
		name: 'target_url',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['create'],
			},
		},
		default: '',
		placeholder: 'https://example.com/webhook',
		description: 'The URL where webhook data will be sent',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Page ID',
				name: 'change_id',
				type: 'string',
				default: '',
				description: 'Specific page ID to track (leave empty for all pages)',
			},
			{
				displayName: 'Payload Fields',
				name: 'payload_fields',
				type: 'multiOptions',
				options: WEBHOOK_PAYLOAD_FIELDS.map((field) => ({
					name: field.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
					value: field,
				})),
				default: [],
				description: 'Fields to include in webhook payload (all if empty)',
			},
		],
	},

	// ========================================
	// webhook:update, delete, test
	// ========================================
	{
		displayName: 'Webhook ID',
		name: 'webhookId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['update', 'delete', 'test'],
			},
		},
		default: '',
		description: 'The ID of the webhook',
	},

	// ========================================
	// webhook:update
	// ========================================
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Active',
				name: 'is_active',
				type: 'boolean',
				default: true,
				description: 'Whether the webhook is active',
			},
			{
				displayName: 'Page ID',
				name: 'change_id',
				type: 'string',
				default: '',
				description: 'Specific page ID to track',
			},
			{
				displayName: 'Payload Fields',
				name: 'payload_fields',
				type: 'multiOptions',
				options: WEBHOOK_PAYLOAD_FIELDS.map((field) => ({
					name: field.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
					value: field,
				})),
				default: [],
				description: 'Fields to include in webhook payload',
			},
			{
				displayName: 'Target URL',
				name: 'target_url',
				type: 'string',
				default: '',
				description: 'The URL where webhook data will be sent',
			},
		],
	},
];