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
				],
				default: 'page',
			},
			...pageOperations,
			...pageFields,
			...checkOperations,
			...checkFields,
			...screenshotOperations,
			...screenshotFields,
		],
	};

	methods = {
		loadOptions: {
			async getFrequencies(this: ILoadOptionsFunctions) {
				const baseUrl = 'https://pagecrawl.io';

				// All frequency options (Daily is 1440, used as default)
				const allFrequencies = [
					{ name: 'Every 1 Minute', value: 1 },
					{ name: 'Every 2 Minute', value: 2 },
					{ name: 'Every 3 Minutes', value: 3 },
					{ name: 'Every 5 Minutes', value: 5 },
					{ name: 'Every 15 Minutes', value: 15 },
					{ name: 'Every 30 Minutes', value: 30 },
					{ name: 'Every 45 Minutes', value: 45 },
					{ name: 'Hourly', value: 60 },
					{ name: 'Every 2 Hours', value: 120 },
				    { name: 'Every 3 Hours', value: 180 },
					{ name: 'Every 6 Hours', value: 360 },
					{ name: 'Every 12 Hours', value: 720 },
					{ name: 'Daily', value: 1440 },
					{ name: 'Every 2 Days', value: 2880 },
					{ name: 'Every 3 Days', value: 4320 },
					{ name: 'Weekly', value: 10080 },
					{ name: 'Every 2 weeks', value: 20160 },
					{ name: 'Monthly', value: 40320 },
				];

				try {
					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'pageCrawlApi',
						{
							method: 'GET',
							url: `${baseUrl}/api/user`,
							json: true,
						},
					);

					// Get available frequencies from user account
					const availableFrequencies = response.frequencies || response.data?.frequencies;
					if (Array.isArray(availableFrequencies) && availableFrequencies.length > 0) {
						// Filter to only show frequencies available for this account
						return allFrequencies.filter(f => availableFrequencies.includes(f.value));
					}

					return allFrequencies;
				} catch (error) {
					// Return all frequencies if API call fails
					return allFrequencies;
				}
			},
		},
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

			async templateSearch(
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
							url: `${baseUrl}/api/templates`,
							json: true,
						},
					);

					// Handle various response formats
					let templates = response.data || response.templates || response;
					if (!Array.isArray(templates)) {
						return { results: [] };
					}

					let results = templates.map((template: any) => ({
						name: template.name || `Template ${template.id}`,
						value: String(template.id),
					}));

					if (filter) {
						const filterLower = filter.toLowerCase();
						results = results.filter((t: any) =>
							t.name.toLowerCase().includes(filterLower),
						);
					}

					return { results };
				} catch (error) {
					// Return empty results if API endpoint doesn't exist or fails
					return { results: [] };
				}
			},

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
							json: true,
						},
					);

					// Extract workspaces from user response
					let workspaces = response.workspaces || [];
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
					// Return empty results if API endpoint doesn't exist or fails
					return { results: [] };
				}
			},

			async folderSearch(
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
							url: `${baseUrl}/api/folders`,
							qs: { all: true },
							json: true,
						},
					);

					// Handle various response formats
					let folders = response.data || response.folders || response;
					if (!Array.isArray(folders)) {
						return { results: [] };
					}

					// Build folder names with tree path (e.g., "Parent / Child / Folder")
					let results = folders.map((folder: any) => {
						let displayName = folder.name || `Folder ${folder.id}`;
						// If folder has a tree (parent path), show full path
						if (folder.tree && Array.isArray(folder.tree) && folder.tree.length > 0) {
							const pathParts = folder.tree.map((f: any) => f.name);
							pathParts.push(folder.name);
							displayName = pathParts.join(' → ');
						}
						return {
							name: displayName,
							value: String(folder.id),
						};
					});

					if (filter) {
						const filterLower = filter.toLowerCase();
						results = results.filter((f: any) =>
							f.name.toLowerCase().includes(filterLower),
						);
					}

					return { results };
				} catch (error) {
					// Return empty results if API endpoint doesn't exist or fails
					return { results: [] };
				}
			},

			async authSearch(
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
							url: `${baseUrl}/api/auths`,
							json: true,
						},
					);

					// Handle various response formats
					let auths = response.data || response.auths || response;
					if (!Array.isArray(auths)) {
						return { results: [] };
					}

					let results = auths.map((auth: any) => ({
						name: auth.name || `Auth ${auth.id}`,
						value: String(auth.id),
					}));

					if (filter) {
						const filterLower = filter.toLowerCase();
						results = results.filter((a: any) =>
							a.name.toLowerCase().includes(filterLower),
						);
					}

					return { results };
				} catch (error) {
					// Return empty results if API endpoint doesn't exist or fails
					return { results: [] };
				}
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

		// Helper to transform fixedCollection to array
		const transformFixedCollection = (collection: any, key: string): any[] => {
			if (!collection) return [];
			if (Array.isArray(collection)) return collection;
			if (typeof collection === 'object' && collection[key]) {
				return collection[key];
			}
			return [];
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
						const name = this.getNodeParameter('name', i, '') as string;
						const additionalFields = this.getNodeParameter('additionalFields', i) as any;
						const body: any = { url };

						if (name) {
							body.name = name;
						}
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

						// Extract values from resourceLocator fields
						if (body.workspace_id && typeof body.workspace_id === 'object') {
							body.workspace_id = (body.workspace_id as IDataObject).value || '';
						}
						if (body.folder_id && typeof body.folder_id === 'object') {
							body.folder_id = (body.folder_id as IDataObject).value || '';
						}
						if (body.template_id && typeof body.template_id === 'object') {
							body.template_id = (body.template_id as IDataObject).value || '';
						}
						if (body.auth_id && typeof body.auth_id === 'object') {
							body.auth_id = (body.auth_id as IDataObject).value || '';
						}

						// Remove ID fields if empty or 0 (not set)
						if (!body.workspace_id || body.workspace_id === 0) delete body.workspace_id;
						if (!body.folder_id || body.folder_id === 0) delete body.folder_id;
						if (!body.template_id || body.template_id === 0) delete body.template_id;
						if (!body.auth_id || body.auth_id === 0) delete body.auth_id;

						// Transform fixedCollection fields to arrays
						if (body.actions && typeof body.actions === 'object') {
							body.actions = transformFixedCollection(body.actions, 'action');
						}
						if (body.rules && typeof body.rules === 'object') {
							body.rules = transformFixedCollection(body.rules, 'rule');
							if (body.rules.length > 0) {
								body.rules_enabled = true;
							}
						}

						// Parse JSON fields if they're strings (backwards compatibility)
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

						// Extract values from resourceLocator fields
						if (body.workspace_id && typeof body.workspace_id === 'object') {
							body.workspace_id = (body.workspace_id as IDataObject).value || '';
						}
						if (body.folder_id && typeof body.folder_id === 'object') {
							body.folder_id = (body.folder_id as IDataObject).value || '';
						}
						if (body.template_id && typeof body.template_id === 'object') {
							body.template_id = (body.template_id as IDataObject).value || '';
						}
						if (body.auth_id && typeof body.auth_id === 'object') {
							body.auth_id = (body.auth_id as IDataObject).value || '';
						}

						// Remove ID fields if empty or 0 (not set)
						if (!body.workspace_id || body.workspace_id === 0) delete body.workspace_id;
						if (!body.folder_id || body.folder_id === 0) delete body.folder_id;
						if (!body.template_id || body.template_id === 0) delete body.template_id;
						if (!body.auth_id || body.auth_id === 0) delete body.auth_id;

						// Parse JSON fields if they're strings
						if (typeof body.elements === 'string') {
							try {
								body.elements = JSON.parse(body.elements);
							} catch (e) {
								throw new NodeOperationError(this.getNode(), 'Invalid JSON in elements field', { itemIndex: i });
							}
						}

						// Transform fixedCollection fields to arrays
						if (body.actions && typeof body.actions === 'object') {
							body.actions = transformFixedCollection(body.actions, 'action');
						}
						if (body.rules && typeof body.rules === 'object') {
							body.rules = transformFixedCollection(body.rules, 'rule');
							if (body.rules.length > 0) {
								body.rules_enabled = true;
							}
						}

						// Parse JSON fields if they're strings (backwards compatibility)
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
								method: 'POST',
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

						// Default to simple mode unless advanced is enabled
						if (!options.advanced) {
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
					const checkId = this.getNodeParameter('checkId', i, 'latest') as string;
					let endpoint = '';

					if (operation === 'getScreenshot') {
						endpoint = `/pages/${pageId}/checks/${checkId}/screenshot`;
					} else if (operation === 'getScreenshotDiff') {
						endpoint = `/pages/${pageId}/checks/${checkId}/diff`;
					}

					const previous = operation === 'getScreenshot' ? this.getNodeParameter('previous', i, false) as boolean : false;
					const qs: any = {};
					if (previous) {
						qs.previous = 1;
					}

					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'pageCrawlApi',
						{
							method: 'GET',
							url: `${baseUrl}/api${endpoint}`,
							qs,
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
