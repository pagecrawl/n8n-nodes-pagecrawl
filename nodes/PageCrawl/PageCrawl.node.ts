import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	ILoadOptionsFunctions,
	INodeListSearchResult,
	IDataObject,
} from 'n8n-workflow';

import { pageOperations, pageFields } from './descriptions/PageDescription';
import { checkOperations, checkFields } from './descriptions/CheckDescription';
import { screenshotOperations, screenshotFields } from './descriptions/ScreenshotDescription';
import { webhookOperations, webhookFields } from './descriptions/WebhookDescription';

export class PageCrawl implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'PageCrawl',
		name: 'pageCrawl',
		icon: 'file:pagecrawl.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with PageCrawl.io API for website monitoring',
		defaults: {
			name: 'PageCrawl',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'pageCrawlApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'https://pagecrawl.io/api',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Page',
						value: 'page',
						description: 'Manage tracked pages',
					},
					{
						name: 'Check',
						value: 'check',
						description: 'Access check history and diffs',
					},
					{
						name: 'Screenshot',
						value: 'screenshot',
						description: 'Get page screenshots',
					},
					{
						name: 'Webhook',
						value: 'webhook',
						description: 'Manage webhooks',
					},
				],
				default: 'page',
			},
			...pageOperations,
			...pageFields,
			...checkOperations,
			...checkFields,
			...screenshotOperations,
			...screenshotFields,
			...webhookOperations,
			...webhookFields,
		],
	};

	methods = {
		listSearch: {
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

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const baseUrl = 'https://pagecrawl.io';

		// Helper to extract value from resourceLocator
		const getPageId = (index: number): string => {
			const pageLocator = this.getNodeParameter('pageId', index) as IDataObject;
			return (pageLocator.value as string) || '';
		};

		for (let i = 0; i < items.length; i++) {
			const resource = this.getNodeParameter('resource', i) as string;
			const operation = this.getNodeParameter('operation', i) as string;

			try {
				let responseData: any;

				// Handle different resources and operations
				if (resource === 'page') {
					if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const options = this.getNodeParameter('options', i) as any;
						const endpoint = '/pages';
						const qs: any = {};

						if (options.simple) {
							qs.simple = 1;
						}
						if (options.take) {
							qs.take = options.take;
						}
						if (options.folder) {
							qs.folder = options.folder;
						}
						if (!returnAll) {
							qs.limit = this.getNodeParameter('limit', i) as number;
						}

						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pageCrawlApi',
							{
								method: 'GET',
								url: `${baseUrl}/api${endpoint}`,
								qs,
								json: true,
							},
						);

						if (!returnAll && Array.isArray(responseData)) {
							responseData = responseData.slice(0, qs.limit);
						}
					} else if (operation === 'get') {
						const pageId = getPageId(i);
						const options = this.getNodeParameter('options', i) as any;
						const qs: any = {};

						if (options.simple) {
							qs.simple = 1;
						}
						if (options.take) {
							qs.take = options.take;
						}

						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pageCrawlApi',
							{
								method: 'GET',
								url: `${baseUrl}/api/pages/${pageId}`,
								qs,
								json: true,
							},
						);
					} else if (operation === 'createSimple') {
						const url = this.getNodeParameter('url', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i) as any;
						const body: any = { url };

						if (additionalFields.selector) {
							body.selector = additionalFields.selector;
						}
						if (additionalFields.frequency !== undefined) {
							body.frequency = additionalFields.frequency;
						}
						if (additionalFields.ignore_duplicates !== undefined) {
							body.ignore_duplicates = additionalFields.ignore_duplicates;
						}

						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pageCrawlApi',
							{
								method: 'POST',
								url: `${baseUrl}/api/track-simple`,
								body,
								json: true,
							},
						);
					} else if (operation === 'create') {
						const url = this.getNodeParameter('url', i) as string;
						const name = this.getNodeParameter('name', i) as string;
						const frequency = this.getNodeParameter('frequency', i) as number;
						const elements = this.getNodeParameter('elements', i) as any;
						const additionalFields = this.getNodeParameter('additionalFields', i) as any;

						const body: any = {
							url,
							name,
							frequency,
							elements: elements.element || [],
						};

						// Add all additional fields
						Object.assign(body, additionalFields);

						// Convert tags from comma-separated string to array
						if (typeof body.tags === 'string' && body.tags) {
							body.tags = body.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
						}

						// Remove ID fields if they're 0 (not set)
						if (body.folder_id === 0) delete body.folder_id;
						if (body.template_id === 0) delete body.template_id;
						if (body.auth_id === 0) delete body.auth_id;

						// Parse JSON fields if they're strings
						if (typeof body.actions === 'string') {
							try {
								body.actions = JSON.parse(body.actions);
							} catch (e) {
								throw new NodeOperationError(this.getNode(), 'Invalid JSON in actions field', { itemIndex: i });
							}
						}
						if (typeof body.rules === 'string') {
							try {
								body.rules = JSON.parse(body.rules);
							} catch (e) {
								throw new NodeOperationError(this.getNode(), 'Invalid JSON in rules field', { itemIndex: i });
							}
						}
						if (typeof body.headers === 'string') {
							try {
								body.headers = JSON.parse(body.headers);
							} catch (e) {
								throw new NodeOperationError(this.getNode(), 'Invalid JSON in headers field', { itemIndex: i });
							}
						}

						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pageCrawlApi',
							{
								method: 'POST',
								url: `${baseUrl}/api/pages`,
								body,
								json: true,
							},
						);
					} else if (operation === 'update') {
						const pageId = getPageId(i);
						const updateFields = this.getNodeParameter('updateFields', i) as any;
						const additionalFields = this.getNodeParameter('additionalFields', i) as any;

						const body: any = { ...updateFields, ...additionalFields };

						// Convert tags from comma-separated string to array
						if (typeof body.tags === 'string' && body.tags) {
							body.tags = body.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
						}

						// Remove ID fields if they're 0 (not set)
						if (body.folder_id === 0) delete body.folder_id;
						if (body.template_id === 0) delete body.template_id;
						if (body.auth_id === 0) delete body.auth_id;

						// Parse JSON fields if they're strings
						if (typeof body.elements === 'string') {
							try {
								body.elements = JSON.parse(body.elements);
							} catch (e) {
								throw new NodeOperationError(this.getNode(), 'Invalid JSON in elements field', { itemIndex: i });
							}
						}
						if (typeof body.actions === 'string') {
							try {
								body.actions = JSON.parse(body.actions);
							} catch (e) {
								throw new NodeOperationError(this.getNode(), 'Invalid JSON in actions field', { itemIndex: i });
							}
						}
						if (typeof body.rules === 'string') {
							try {
								body.rules = JSON.parse(body.rules);
							} catch (e) {
								throw new NodeOperationError(this.getNode(), 'Invalid JSON in rules field', { itemIndex: i });
							}
						}
						if (typeof body.headers === 'string') {
							try {
								body.headers = JSON.parse(body.headers);
							} catch (e) {
								throw new NodeOperationError(this.getNode(), 'Invalid JSON in headers field', { itemIndex: i });
							}
						}

						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pageCrawlApi',
							{
								method: 'PUT',
								url: `${baseUrl}/api/pages/${pageId}`,
								body,
								json: true,
							},
						);
					} else if (operation === 'delete') {
						const pageId = getPageId(i);

						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pageCrawlApi',
							{
								method: 'DELETE',
								url: `${baseUrl}/api/pages/${pageId}`,
								json: true,
							},
						);

						responseData = { success: true, deleted: pageId };
					} else if (operation === 'runCheckNow') {
						const pageId = getPageId(i);
						const options = this.getNodeParameter('runCheckOptions', i) as any;
						const qs: any = {};

						if (options.skip_first_notification) {
							qs.skip_first_notification = 1;
						}

						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pageCrawlApi',
							{
								method: 'PUT',
								url: `${baseUrl}/api/pages/${pageId}/check`,
								qs,
								json: true,
							},
						);

						responseData = { success: true, message: 'Check triggered', pageId };
					}
				} else if (resource === 'check') {
					const pageId = getPageId(i);

					if (operation === 'getHistory') {
						const options = this.getNodeParameter('options', i) as any;
						const qs: any = {};

						if (options.simple) {
							qs.simple = 1;
						}
						if (options.take) {
							qs.take = options.take;
						}

						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pageCrawlApi',
							{
								method: 'GET',
								url: `${baseUrl}/api/pages/${pageId}/history`,
								qs,
								json: true,
							},
						);
					} else if (operation === 'getDiffImage') {
						const checkId = this.getNodeParameter('checkId', i) as string;

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pageCrawlApi',
							{
								method: 'GET',
								url: `${baseUrl}/api/pages/${pageId}/checks/${checkId}/diff.png`,
								encoding: 'arraybuffer',
							},
						) as Buffer;

						const binaryData = await this.helpers.prepareBinaryData(
							response,
							`diff-${pageId}-${checkId}.png`,
							'image/png',
						);

						const executionData = this.helpers.constructExecutionMetaData(
							[{ json: {}, binary: { data: binaryData } }],
							{ itemData: { item: i } },
						);

						returnData.push(...executionData);
						continue;
					} else if (operation === 'getDiffHtml') {
						const checkId = this.getNodeParameter('checkId', i) as string;

						const htmlContent = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pageCrawlApi',
							{
								method: 'GET',
								url: `${baseUrl}/api/pages/${pageId}/checks/${checkId}/diff.html`,
								headers: {
									Accept: 'text/html',
								},
							},
						);

						responseData = {
							html: htmlContent,
							pageId,
							checkId,
						};
					} else if (operation === 'getDiffMarkdown') {
						const checkId = this.getNodeParameter('checkId', i) as string;

						const markdownContent = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pageCrawlApi',
							{
								method: 'GET',
								url: `${baseUrl}/api/pages/${pageId}/checks/${checkId}/diff.markdown`,
								headers: {
									Accept: 'text/markdown',
								},
							},
						);

						responseData = {
							markdown: markdownContent,
							pageId,
							checkId,
						};
					}
				} else if (resource === 'screenshot') {
					const pageId = getPageId(i);
					let endpoint = '';

					if (operation === 'getLatest') {
						endpoint = `/pages/${pageId}/checks/latest/screenshot`;
					} else if (operation === 'getLatestDiff') {
						endpoint = `/pages/${pageId}/checks/latest/diff`;
					} else if (operation === 'getCheckScreenshot') {
						const checkId = this.getNodeParameter('checkId', i) as string;
						endpoint = `/pages/${pageId}/checks/${checkId}/screenshot`;
					} else if (operation === 'getCheckDiff') {
						const checkId = this.getNodeParameter('checkId', i) as string;
						endpoint = `/pages/${pageId}/checks/${checkId}/diff`;
					}

					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'pageCrawlApi',
						{
							method: 'GET',
							url: `${baseUrl}/api${endpoint}`,
							encoding: 'arraybuffer',
						},
					) as Buffer;

					const binaryData = await this.helpers.prepareBinaryData(
						response,
						`screenshot-${pageId}.png`,
						'image/png',
					);

					const executionData = this.helpers.constructExecutionMetaData(
						[{ json: {}, binary: { data: binaryData } }],
						{ itemData: { item: i } },
					);

					returnData.push(...executionData);
					continue;
				} else if (resource === 'webhook') {
					if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;

						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pageCrawlApi',
							{
								method: 'GET',
								url: `${baseUrl}/api/hooks`,
								json: true,
							},
						);

						if (!returnAll && Array.isArray(responseData)) {
							const limit = this.getNodeParameter('limit', i) as number;
							responseData = responseData.slice(0, limit);
						}
					} else if (operation === 'create') {
						const target_url = this.getNodeParameter('target_url', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i) as any;

						const body: any = { target_url };

						if (additionalFields.change_id) {
							body.change_id = additionalFields.change_id;
						}
						if (additionalFields.payload_fields) {
							body.payload_fields = additionalFields.payload_fields;
						}

						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pageCrawlApi',
							{
								method: 'POST',
								url: `${baseUrl}/api/hooks`,
								body,
								json: true,
							},
						);
					} else if (operation === 'update') {
						const webhookId = this.getNodeParameter('webhookId', i) as string;
						const updateFields = this.getNodeParameter('updateFields', i) as any;

						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pageCrawlApi',
							{
								method: 'PUT',
								url: `${baseUrl}/api/hooks/${webhookId}`,
								body: updateFields,
								json: true,
							},
						);
					} else if (operation === 'delete') {
						const webhookId = this.getNodeParameter('webhookId', i) as string;

						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pageCrawlApi',
							{
								method: 'DELETE',
								url: `${baseUrl}/api/hooks/${webhookId}`,
								json: true,
							},
						);

						responseData = { success: true, deleted: webhookId };
					} else if (operation === 'test') {
						const webhookId = this.getNodeParameter('webhookId', i) as string;

						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pageCrawlApi',
							{
								method: 'PUT',
								url: `${baseUrl}/api/hooks/${webhookId}/test`,
								json: true,
							},
						);

						responseData = { success: true, message: 'Test webhook sent' };
					}
				}

				const executionData = this.helpers.constructExecutionMetaData(
					[{ json: responseData }],
					{ itemData: { item: i } },
				);

				returnData.push(...executionData);
			} catch (error: any) {
				if (this.continueOnFail()) {
					// Extract detailed error message from API response if available
					const errorMessage = error.response?.body?.message
						|| error.response?.body?.error
						|| error.message
						|| 'An error occurred';
					const statusCode = error.statusCode || error.response?.statusCode;
					const executionData = this.helpers.constructExecutionMetaData(
						[{
							json: {
								error: errorMessage,
								statusCode,
								resource,
								operation,
							},
						}],
						{ itemData: { item: i } },
					);
					returnData.push(...executionData);
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}