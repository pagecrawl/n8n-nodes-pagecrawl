import {
	IHookFunctions,
	IWebhookFunctions,
	IDataObject,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
} from 'n8n-workflow';

import { WEBHOOK_PAYLOAD_FIELDS } from '../PageCrawl/types';

export class PageCrawlTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'PageCrawl Trigger',
		name: 'pageCrawlTrigger',
		icon: 'file:pagecrawl.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '=Monitor: {{$parameter["event"]}}',
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
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				options: [
					{
						name: 'Change Detected',
						value: 'change',
						description: 'Trigger when any change is detected',
					},
					{
						name: 'Error',
						value: 'error',
						description: 'Trigger when page check fails',
					},
				],
				default: ['change'],
				required: true,
				description: 'The events to listen for',
			},
			{
				displayName: 'Page',
				name: 'pageId',
				type: 'string',
				default: '',
				description: 'Specific page ID to monitor (leave empty for all pages)',
			},
			{
				displayName: 'Payload Fields',
				name: 'payloadFields',
				type: 'multiOptions',
				options: WEBHOOK_PAYLOAD_FIELDS.map((field) => ({
					name: field.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
					value: field,
				})),
				default: ['id', 'title', 'status', 'changed_at', 'difference', 'page'],
				description: 'Fields to include in the webhook payload',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Simplify Output',
						name: 'simplify',
						type: 'boolean',
						default: true,
						description: 'Whether to return simplified output format',
					},
				],
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const webhookUrl = this.getNodeWebhookUrl('default');
				const credentials = await this.getCredentials('pageCrawlApi');
				const baseUrl = ((credentials.baseUrl as string) || 'https://pagecrawl.io').replace(/\/+$/, '');

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
				const pageId = this.getNodeParameter('pageId', '') as string;
				const payloadFields = this.getNodeParameter('payloadFields', []) as string[];
				const credentials = await this.getCredentials('pageCrawlApi');
				const baseUrl = ((credentials.baseUrl as string) || 'https://pagecrawl.io').replace(/\/+$/, '');

				const body: IDataObject = {
					target_url: webhookUrl,
					event_type: 'n8n',
				};

				if (pageId) {
					body.change_id = pageId;
				}

				if (payloadFields.length > 0) {
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
					return true;
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					throw new Error(`Failed to create PageCrawl webhook: ${errorMessage}`);
				}
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const credentials = await this.getCredentials('pageCrawlApi');
				const baseUrl = ((credentials.baseUrl as string) || 'https://pagecrawl.io').replace(/\/+$/, '');

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
		const events = this.getNodeParameter('events', []) as string[];
		const options = this.getNodeParameter('options', {}) as IDataObject;

		const webhookData = req.body as IDataObject;

		// Filter based on event type
		if (webhookData.status === 'error' && !events.includes('error')) {
			// Skip error events if not subscribed
			return {
				workflowData: [],
			};
		}

		if (webhookData.status !== 'error' && !events.includes('change')) {
			// Skip change events if not subscribed
			return {
				workflowData: [],
			};
		}

		// Simplify output if requested
		let responseData = webhookData;
		if (options.simplify) {
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