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
import { verifySignature } from './signature';
import { version } from '../../package.json';

const API_CLIENT_HEADER = { 'X-Api-Client': `n8n/${version}` };

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
				description: 'Select the workspace containing the pages you want to monitor',
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
				description: 'Select a page to monitor or leave empty for all pages in the workspace',
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
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				options: [
					{
						name: 'Change Detected',
						value: 'change_detected',
						description: 'Triggered when a monitored page content changes',
					},
					{
						name: 'Error',
						value: 'error',
						description: 'Triggered when a page check fails (timeout, blocked, etc.)',
					},
				],
				default: ['change_detected'],
				description: 'Which events should trigger this workflow',
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
				description: 'Whether to automatically send a test event when clicking "Listen for Test Event" or "Execute Step"',
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
							url: `${baseUrl}/api/user`,
							headers: API_CLIENT_HEADER,
							json: true,
						},
					);

					// Extract workspaces from user response (may be nested under user)
					let workspaces = response.workspaces || response.user?.workspaces || [];
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

				// Get workspace ID - return empty if not selected
				const workspaceLocator = this.getNodeParameter('workspace', 0, {}) as IDataObject;
				const workspaceId = (workspaceLocator?.value as string) || '';
				if (!workspaceId) {
					return { results: [] };
				}

				try {
					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'pageCrawlApi',
						{
							method: 'GET',
							url: `${baseUrl}/api/pages`,
							qs: { workspace_id: workspaceId },
							headers: API_CLIENT_HEADER,
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
				} catch {
					return { results: [] };
				}
			},
		},
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const webhookUrl = this.getNodeWebhookUrl('default');
				const baseUrl = 'https://pagecrawl.io';
				const workspaceLocator = this.getNodeParameter('workspace', { mode: 'list', value: '' }) as IDataObject;
				const workspaceId = (workspaceLocator.value as string) || '';

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
							qs: workspaceId ? { workspace_id: workspaceId } : {},
							headers: API_CLIENT_HEADER,
							json: true,
						},
					);

					const existingWebhook = response.find(
						(webhook: any) => webhook.id === webhookData.webhookId,
					);

					if (!existingWebhook || existingWebhook.target_url !== webhookUrl) {
						return false;
					}

					// Workflows activated before deliveries were verified have no stored secret yet.
					if (typeof existingWebhook.signing_secret === 'string') {
						webhookData.signingSecret = existingWebhook.signing_secret;
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
				const events = this.getNodeParameter('events', ['change_detected']) as string[];
				const simplifyOutput = this.getNodeParameter('simplifyOutput', true) as boolean;
				const sendTestOnListen = this.getNodeParameter('sendTestOnListen', true) as boolean;
				const baseUrl = 'https://pagecrawl.io';

				// Default payload fields for simplified output
				const defaultPayloadFields = ['id', 'title', 'status', 'changed_at', 'difference', 'human_difference', 'short_summary', 'page', 'contents'];

				// Get custom payload fields if not using simplified output
				let payloadFields: string[];
				if (simplifyOutput) {
					payloadFields = defaultPayloadFields;
				} else {
					payloadFields = this.getNodeParameter('payloadFields', defaultPayloadFields) as string[];
				}

				// Add event_type to payload fields if both events are selected
				if (events.includes('change_detected') && events.includes('error') && !payloadFields.includes('event_type')) {
					payloadFields = [...payloadFields, 'event_type'];
				}

				const body: IDataObject = {
					target_url: webhookUrl,
					event_type: 'n8n',
					events: events,
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
							headers: API_CLIENT_HEADER,
							json: true,
						},
					);

					if (!response.id) {
						throw new Error('Failed to create webhook');
					}

					webhookData.webhookId = response.id;
					// Every delivery is signed with this secret; webhook() refuses any that is not.
					if (typeof response.signing_secret === 'string') {
						webhookData.signingSecret = response.signing_secret;
					}

					// Send test event if enabled
					if (sendTestOnListen) {
						try {
							await this.helpers.httpRequestWithAuthentication.call(
								this,
								'pageCrawlApi',
								{
									method: 'PUT',
									url: `${baseUrl}/api/hooks/${response.id}/test`,
									headers: API_CLIENT_HEADER,
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
							headers: API_CLIENT_HEADER,
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
					delete webhookData.signingSecret;
				}

				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();

		// Anyone who learns this workflow's webhook URL could post to it, so only deliveries
		// signed with this webhook's secret start the workflow.
		const secret = await signingSecret.call(this);
		const headers = this.getHeaderData() as IDataObject;
		const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody ?? JSON.stringify(req.body ?? {});
		if (!secret || !verifySignature(secret, rawBody, headers['x-pagecrawl-signature'], headers['x-pagecrawl-timestamp'])) {
			this.getResponseObject().status(401).json({ message: 'Invalid or missing PageCrawl signature' });
			return { noWebhookResponse: true };
		}
		const simplifyOutput = this.getNodeParameter('simplifyOutput', true) as boolean;
		const events = this.getNodeParameter('events', ['change_detected']) as string[];

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
				shortSummary: webhookData.short_summary,
				pageUrl: webhookData.page ? (webhookData.page as IDataObject).url : undefined,
				pageName: webhookData.page ? (webhookData.page as IDataObject).name : undefined,
				pageLink: webhookData.page ? (webhookData.page as IDataObject).link : undefined,
				contents: webhookData.contents,
			};

			// Include eventType if both events are selected
			if (events.includes('change_detected') && events.includes('error')) {
				responseData.eventType = webhookData.event_type;
			}
		}

		return {
			workflowData: [this.helpers.returnJsonArray(responseData)],
		};
	}
}

/**
 * The webhook's signing secret, from the workflow's stored data or, for a workflow activated
 * before deliveries were verified, from the PageCrawl API (then stored).
 */
async function signingSecret(this: IWebhookFunctions): Promise<string | undefined> {
	const webhookData = this.getWorkflowStaticData('node');
	if (typeof webhookData.signingSecret === 'string' && webhookData.signingSecret) {
		return webhookData.signingSecret;
	}
	if (!webhookData.webhookId) {
		return undefined;
	}

	try {
		const webhook = await this.helpers.httpRequestWithAuthentication.call(this, 'pageCrawlApi', {
			method: 'GET',
			url: `https://pagecrawl.io/api/hooks/${webhookData.webhookId}`,
			headers: API_CLIENT_HEADER,
			json: true,
		});
		const secret = (webhook as IDataObject)?.signing_secret ?? ((webhook as IDataObject)?.data as IDataObject)?.signing_secret;
		if (typeof secret === 'string' && secret) {
			webhookData.signingSecret = secret;
			return secret;
		}
	} catch {
		// Unreachable API: the delivery is refused, and PageCrawl reports it as failed.
	}

	return undefined;
}
