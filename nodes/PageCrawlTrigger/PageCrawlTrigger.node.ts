import {
	IHookFunctions,
	IWebhookFunctions,
	IDataObject,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	ILoadOptionsFunctions,
	INodeListSearchResult,
} from 'n8n-workflow';

import { WEBHOOK_PAYLOAD_FIELDS } from '../PageCrawl/types';

export class PageCrawlTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'PageCrawl Trigger',
		name: 'pageCrawlTrigger',
		icon: 'file:pagecrawl.svg',
		group: ['trigger'],
		version: 1,
		subtitle: 'On Change Detected',
		description: 'Receive notifications when PageCrawl.io detects changes',
		defaults: {
			name: 'PageCrawl Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'pageCrawlApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'pagecrawl',
			},
		],
		properties: [
			{
				displayName: 'Workspace',
				name: 'workspace',
				type: 'resourceLocator',
				required: true,
				default: { mode: 'list', value: '' },
				description: 'Select the workspace containing the pages you want to monitor.',
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
				displayName: 'Page',
				name: 'page',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				description: 'Select a page to monitor or leave empty for all pages in the workspace.',
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
				displayName: 'Simplify Output',
				name: 'simplifyOutput',
				type: 'boolean',
				default: true,
				description: 'Whether to return simplified output format with flattened fields',
			},
			{
				displayName: 'Payload Fields',
				name: 'payloadFields',
				type: 'multiOptions',
				displayOptions: {
					show: {
						simplifyOutput: [false],
					},
				},
				options: WEBHOOK_PAYLOAD_FIELDS.map((field) => ({
					name: field.value.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
					value: field.value,
					description: field.description,
				})),
				default: ['id', 'title', 'status', 'changed_at', 'difference', 'page', 'contents', 'html_difference'],
				description: 'Fields to include in the webhook payload',
			},
			{
				displayName: 'Send Test Event on Listen',
				name: 'sendTestOnListen',
				type: 'boolean',
				default: true,
				description: 'Whether to automatically send a test event when clicking "Listen for Test Event"',
			},
		],
	};

	methods = {
		listSearch: {
			async workspaceSearch(
				this: ILoadOptionsFunctions,
				filter?: string,
			): Promise<INodeListSearchResult> {
				const baseUrl = 'https://pagecrawl.io';

				try {
					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'pageCrawlApi',
						{
							method: 'GET',
							url: `${baseUrl}/api/workspaces`,
							json: true,
						},
					);

					let workspaces = response.data || response.workspaces || response;
					if (!Array.isArray(workspaces)) {
						return { results: [] };
					}

					let results = workspaces.map((workspace: any) => ({
						name: workspace.name || `Workspace ${workspace.id}`,
						value: String(workspace.id),
					}));

					if (filter) {
						const filterLower = filter.toLowerCase();
						results = results.filter((w: any) =>
							w.name.toLowerCase().includes(filterLower),
						);
					}

					return { results };
				} catch (error) {
					return { results: [] };
				}
			},

			async pageSearch(
				this: ILoadOptionsFunctions,
				filter?: string,
			): Promise<INodeListSearchResult> {
				const baseUrl = 'https://pagecrawl.io';

				const response = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'pageCrawlApi',
					{
						method: 'GET',
						url: `${baseUrl}/api/pages`,
						json: true,
					},
				);

				const pages = response.data || response;

				let results = pages.map((page: any) => ({
					name: page.name || page.url,
					value: page.slug,
					url: `https://pagecrawl.io/app/pages/${page.slug}`,
				}));

				// Filter results if search term provided
				if (filter) {
					const filterLower = filter.toLowerCase();
					results = results.filter(
						(page: any) =>
							page.name.toLowerCase().includes(filterLower) ||
							page.value.toLowerCase().includes(filterLower),
					);
				}

				return { results };
			},
		},
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const webhookUrl = this.getNodeWebhookUrl('default');
				const baseUrl = 'https://pagecrawl.io';

				if (!webhookData.webhookId) {
					return false;
				}

				try {
					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'pageCrawlApi',
						{
							method: 'GET',
							url: `${baseUrl}/api/hooks`,
							json: true,
						},
					);

					const existingWebhook = response.find(
						(webhook: any) => webhook.id === webhookData.webhookId,
					);

					if (!existingWebhook || existingWebhook.target_url !== webhookUrl) {
						return false;
					}

					return true;
				} catch (error) {
					return false;
				}
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const webhookData = this.getWorkflowStaticData('node');
				const workspaceLocator = this.getNodeParameter('workspace', { mode: 'list', value: '' }) as IDataObject;
				const workspaceValue = (workspaceLocator.value as string) || '';
				const pageLocator = this.getNodeParameter('page', { mode: 'list', value: '' }) as IDataObject;
				const pageValue = (pageLocator.value as string) || '';
				const simplifyOutput = this.getNodeParameter('simplifyOutput', true) as boolean;
				const sendTestOnListen = this.getNodeParameter('sendTestOnListen', true) as boolean;
				const baseUrl = 'https://pagecrawl.io';

				// Default payload fields for simplified output
				const defaultPayloadFields = ['id', 'title', 'status', 'changed_at', 'difference', 'human_difference', 'page', 'contents'];

				// Get custom payload fields if not using simplified output
				let payloadFields: string[];
				if (simplifyOutput) {
					payloadFields = defaultPayloadFields;
				} else {
					payloadFields = this.getNodeParameter('payloadFields', defaultPayloadFields) as string[];
				}

				const body: IDataObject = {
					target_url: webhookUrl,
					event_type: 'n8n',
				};

				// Add workspace_id (required)
				if (workspaceValue) {
					body.workspace_id = workspaceValue;
				}

				if (pageValue) {
					body.change_id = pageValue;
				}

				if (payloadFields && payloadFields.length > 0) {
					body.payload_fields = payloadFields;
				}

				try {
					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'pageCrawlApi',
						{
							method: 'POST',
							url: `${baseUrl}/api/hooks`,
							body,
							json: true,
						},
					);

					if (!response.id) {
						throw new Error('Failed to create webhook');
					}

					webhookData.webhookId = response.id;

					// Send test event if enabled
					if (sendTestOnListen) {
						try {
							await this.helpers.httpRequestWithAuthentication.call(
								this,
								'pageCrawlApi',
								{
									method: 'PUT',
									url: `${baseUrl}/api/hooks/${response.id}/test`,
									json: true,
								},
							);
						} catch (testError) {
							// Test might fail if no pages exist, but webhook was created successfully
							// Don't fail the webhook creation
						}
					}

					return true;
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					throw new Error(`Failed to create PageCrawl webhook: ${errorMessage}`);
				}
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const baseUrl = 'https://pagecrawl.io';

				if (!webhookData.webhookId) {
					return true;
				}

				try {
					await this.helpers.httpRequestWithAuthentication.call(
						this,
						'pageCrawlApi',
						{
							method: 'DELETE',
							url: `${baseUrl}/api/hooks/${webhookData.webhookId}`,
							json: true,
						},
					);
				} catch (error: any) {
					// If webhook is already deleted, consider it a success
					if (error.statusCode !== 404) {
						const errorMessage = error.response?.body?.message || error.message || 'Unknown error';
						throw new Error(`Failed to delete PageCrawl webhook: ${errorMessage}`);
					}
				} finally {
					// Always clean up the webhook ID, even if deletion failed
					delete webhookData.webhookId;
				}

				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const simplifyOutput = this.getNodeParameter('simplifyOutput', true) as boolean;

		const webhookData = req.body as IDataObject;

		// Simplify output if requested
		let responseData = webhookData;
		if (simplifyOutput) {
			responseData = {
				id: webhookData.id,
				title: webhookData.title,
				status: webhookData.status,
				changedAt: webhookData.changed_at,
				difference: webhookData.difference,
				humanDifference: webhookData.human_difference,
				pageUrl: webhookData.page ? (webhookData.page as IDataObject).url : undefined,
				pageName: webhookData.page ? (webhookData.page as IDataObject).name : undefined,
				pageLink: webhookData.page ? (webhookData.page as IDataObject).link : undefined,
				contents: webhookData.contents,
			};
		}

		return {
			workflowData: [this.helpers.returnJsonArray(responseData)],
		};
	}
}