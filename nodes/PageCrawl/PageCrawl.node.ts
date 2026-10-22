import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	NodeApiError,
	JsonObject,
	ILoadOptionsFunctions,
	INodeListSearchResult,
	IDataObject,
} from 'n8n-workflow';

import { pageOperations, pageFields } from './descriptions/PageDescription';
import { checkOperations, checkFields } from './descriptions/CheckDescription';
import { screenshotOperations, screenshotFields } from './descriptions/ScreenshotDescription';
import { dataSourceOperations, dataSourceFields } from './descriptions/DataSourceDescription';
import { version } from '../../package.json';

const API_CLIENT_HEADER = { 'X-Api-Client': `n8n/${version}` };

// The "Full Page Mode" choices read like selectors in the UI, but the API
// expresses them as distinct tracking modes.
// Used when /api/user cannot be read; every value is accepted by the API.
const DEFAULT_LOCATIONS = [
	{ name: 'Automatic', value: 'auto' },
	{ name: 'Automatic (Europe)', value: 'auto_eu' },
	{ name: 'United States', value: 'us_dc1' },
	{ name: 'Germany', value: 'de_dc1' },
	{ name: 'United Kingdom', value: 'gb_dc1' },
	{ name: 'London, UK', value: 'lon1' },
	{ name: 'New York, US', value: 'ny1' },
	{ name: 'Frankfurt, Germany', value: 'fra1' },
];

// Human labels for the location slugs /api/user returns.
const LOCATION_LABELS: Record<string, string> = {
	auto: 'Automatic',
	auto_eu: 'Automatic (Europe)',
	us_dc1: 'United States',
	de_dc1: 'Germany',
	gb_dc1: 'United Kingdom',
	ca_dc1: 'Canada',
	sg_dc1: 'Singapore',
	au_dc1: 'Australia',
	fixed1: 'Fixed IP',
	lon1: 'London, UK',
	fra1: 'Frankfurt, Germany',
	tel1: 'Tel Aviv, Israel',
	ny1: 'New York, US',
	sfo3: 'San Francisco, US',
	tor1: 'Toronto, Canada',
	random1: 'Random',
	random2: 'Random (alternate)',
};

const FULLPAGE_TRACKING_MODES: Record<string, string> = {
	'*': 'fullpage',
	content: 'content_only',
	article: 'reader',
};

/** Unwrap a resourceLocator ({ mode, value }) to its plain id, or '' if unset. */
function resolveLocatorValue(raw: unknown): string {
	if (raw && typeof raw === 'object') {
		const value = (raw as IDataObject).value;
		return value ? String(value) : '';
	}
	return raw ? String(raw) : '';
}

export class PageCrawl implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'PageCrawl',
		name: 'pageCrawl',
		icon: 'file:pagecrawl.svg',
		group: ['transform'],
		version: 1,
		// Lets n8n AI agents call PageCrawl operations as a tool.
		usableAsTool: true,
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
				...API_CLIENT_HEADER,
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
						name: 'Data Source',
						value: 'dataSource',
						description: 'Record your own values and get alerts when they change',
					},
				],
				default: 'page',
			},
			{
				displayName: 'Workspace',
				name: 'workspace',
				type: 'resourceLocator',
				required: true,
				default: { mode: 'list', value: '' },
				description: 'Select workspace to use for this operation',
				// A push goes to the data source's own ingest URL, which already names it.
				displayOptions: { hide: { resource: ['dataSource'], operation: ['pushValue'] } },
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
			...pageOperations,
			...pageFields,
			...checkOperations,
			...checkFields,
			...screenshotOperations,
			...screenshotFields,
			...dataSourceOperations,
			...dataSourceFields,
		],
	};

	methods = {
		loadOptions: {
			async getLocations(this: ILoadOptionsFunctions) {
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

					// /api/user exposes the allow-list as `proxies`, a flat list of
					// slugs (custom team pools arrive as "pool:<id>").
					const locations = response.proxies || [];
					if (Array.isArray(locations) && locations.length > 0) {
						return locations.map((loc: any) => {
							const value = typeof loc === 'string' ? loc : loc.value;
							return { name: LOCATION_LABELS[value] ?? value, value };
						});
					}

					// Fallback to default locations
					return DEFAULT_LOCATIONS;
				} catch (error) {
					// Return default locations if API call fails
					return DEFAULT_LOCATIONS;
				}
			},
			async getFrequencies(this: ILoadOptionsFunctions) {
				const baseUrl = 'https://pagecrawl.io';

				// All frequency options (Daily is 1440, used as default)
				const allFrequencies = [
					{ name: 'Every 2 Minutes', value: 2 },
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
					{ name: 'Every 4 Days', value: 5760 },
					{ name: 'Every 5 Days', value: 7200 },
					{ name: 'Every 6 Days', value: 8640 },
					{ name: 'Weekly', value: 10080 },
					{ name: 'Every 10 Days', value: 14400 },
					{ name: 'Every 2 Weeks', value: 20160 },
					{ name: 'Every 3 Weeks', value: 30240 },
					{ name: 'Monthly', value: 40320 },
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
							headers: API_CLIENT_HEADER,
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
			async getDevices(this: ILoadOptionsFunctions) {
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

					// Get available devices from user account
					const devices = response.devices || {};
					if (typeof devices === 'object' && Object.keys(devices).length > 0) {
						return Object.entries(devices).map(([key, label]) => ({
							name: label as string,
							value: key,
						}));
					}

					// Fallback to default devices
					// Desktop is the empty string server-side and every other valid
					// value is a named device, so 'mobile'/'tablet' would 422.
					return [{ name: 'Desktop (1920x1080)', value: '' }];
				} catch (error) {
					// Return default devices if API call fails
					// Desktop is the empty string server-side and every other valid
					// value is a named device, so 'mobile'/'tablet' would 422.
					return [{ name: 'Desktop (1920x1080)', value: '' }];
				}
			},
			async getAIModels(this: ILoadOptionsFunctions) {
				const baseUrl = 'https://pagecrawl.io';

				try {
					// Get workspace ID from node parameter
					const workspaceLocator = this.getNodeParameter('workspace', 0) as IDataObject;
					const workspaceId = (workspaceLocator?.value as string) || '';

					if (!workspaceId) {
						return [{ name: 'Use Workspace Default', value: '' }];
					}

					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'pageCrawlApi',
						{
							method: 'GET',
							url: `${baseUrl}/api/workspaces/${workspaceId}/ai/available-models`,
							headers: API_CLIENT_HEADER,
							json: true,
						},
					);

					// Get available AI models
					const models = response.models || [];
					const currentModel = response.current || '';

					const options = [
						{ name: currentModel ? `Use Workspace Default (${currentModel})` : 'Use Workspace Default', value: '' },
					];

					if (Array.isArray(models) && models.length > 0) {
						models.forEach((model: string) => {
							options.push({ name: model, value: model });
						});
					}

					return options;
				} catch (error) {
					// Return default option if API call fails
					return [{ name: 'Use Workspace Default', value: '' }];
				}
			},
		},
		listSearch: {
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

			async templateSearch(
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
							url: `${baseUrl}/api/templates`,
							qs: { workspace_id: workspaceId },
							headers: API_CLIENT_HEADER,
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
					// Return empty results if API endpoint doesn't exist or fails
					return { results: [] };
				}
			},

			async folderSearch(
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
							url: `${baseUrl}/api/folders`,
							qs: { all: true, workspace_id: workspaceId },
							headers: API_CLIENT_HEADER,
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
							url: `${baseUrl}/api/authentications`,
							qs: { workspace_id: workspaceId },
							headers: API_CLIENT_HEADER,
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

		// Helper to get workspace ID from the required workspace field
		const getWorkspaceId = (index: number): string => {
			const workspaceLocator = this.getNodeParameter('workspace', index, {}) as IDataObject;
			const workspaceId = workspaceLocator?.value as string;

			if (!workspaceId) {
				throw new NodeOperationError(this.getNode(), 'Workspace is required', { itemIndex: index });
			}

			return workspaceId;
		};

		for (let i = 0; i < items.length; i++) {
			const resource = this.getNodeParameter('resource', i) as string;
			const operation = this.getNodeParameter('operation', i) as string;

			try {
				let responseData: any;

				// Handle different resources and operations
				if (resource === 'page') {
					if (operation === 'get') {
						const pageId = getPageId(i);
						const workspaceId = getWorkspaceId(i);
						const options = this.getNodeParameter('options', i) as any;
						const qs: any = { workspace_id: workspaceId };

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
								headers: API_CLIENT_HEADER,
								json: true,
							},
						);
					} else if (operation === 'createSimple') {
						const url = this.getNodeParameter('url', i) as string;
						const name = this.getNodeParameter('name', i, '') as string;
						const trackingType = this.getNodeParameter('trackingType', i, 'fullpage') as string;
						const workspaceId = getWorkspaceId(i);
						const additionalFields = this.getNodeParameter('additionalFields', i) as any;
						const body: any = { url };

						if (name) {
							body.name = name;
						}

						// track-simple is driven by tracking_mode. It has no `type` input,
						// and full-page selectors are resolved server-side.
						if (trackingType === 'fullpage') {
							const fullpageMode = this.getNodeParameter('fullpageMode', i, '*') as string;
							body.tracking_mode = FULLPAGE_TRACKING_MODES[fullpageMode] ?? 'fullpage';
						} else if (trackingType === 'text' || trackingType === 'number') {
							const selector = this.getNodeParameter('selector', i, '') as string;
							if (!selector) {
								throw new NodeOperationError(
									this.getNode(),
									`A CSS or XPath selector is required when tracking a ${
										trackingType === 'text' ? 'selected area' : 'number'
									}`,
									{ itemIndex: i },
								);
							}
							body.selector = selector;
							body.tracking_mode = trackingType === 'text' ? 'specific_text' : 'specific_number';
						} else {
							body.tracking_mode = trackingType;
						}

						if (additionalFields.frequency !== undefined) {
							body.frequency = additionalFields.frequency;
						}
						if (additionalFields.ignore_duplicates !== undefined) {
							body.ignore_duplicates = additionalFields.ignore_duplicates;
						}
						const simpleFolderId = resolveLocatorValue(additionalFields.folder_id);
						if (simpleFolderId) {
							body.folder_id = simpleFolderId;
						}
						const simpleTemplateId = resolveLocatorValue(additionalFields.template_id);
						if (simpleTemplateId) {
							body.template_id = simpleTemplateId;
						}

						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pageCrawlApi',
							{
								method: 'POST',
								url: `${baseUrl}/api/track-simple`,
								// SetTeamAndWorkspace reads the workspace override from the query
								// string only; a body value is ignored.
								qs: { workspace_id: workspaceId },
								body,
								headers: API_CLIENT_HEADER,
								json: true,
							},
						);
					} else if (operation === 'create') {
						const url = this.getNodeParameter('url', i) as string;
						const name = this.getNodeParameter('name', i, '') as string;
						const frequency = this.getNodeParameter('frequency', i) as number;
						const elements = this.getNodeParameter('elements', i) as any;
						const actions = this.getNodeParameter('actions', i, {}) as any;
						const additionalFields = this.getNodeParameter('additionalFields', i) as any;
						const rulesEnabled = this.getNodeParameter('rules_enabled', i, false) as boolean;
						const rulesAnd = this.getNodeParameter('rules_and', i, false) as boolean;
						const recordAlways = this.getNodeParameter('record_always', i, false) as boolean;
						const rules = this.getNodeParameter('rules', i, {}) as any;

						const body: any = {
							url,
							name,
							frequency,
							elements: elements.element || [],
						};

						// Add actions if provided
						if (actions && actions.action) {
							body.actions = actions.action;
						}

						// Add rules settings if enabled
						if (rulesEnabled) {
							body.rules_enabled = true;
							body.rules_and = rulesAnd;
							body.record_always = recordAlways;
							// Add rules if provided
							if (rules && rules.rule) {
								body.rules = rules.rule;
							}
						}

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
						// The workspace override is a query param (SetTeamAndWorkspace); a
						// body value is silently ignored, so it is applied to qs below.
						const createWorkspaceId = getWorkspaceId(i);
						delete body.workspace_id;

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
								qs: { workspace_id: createWorkspaceId },
								body,
								headers: API_CLIENT_HEADER,
								json: true,
							},
						);
					} else if (operation === 'update') {
						const pageId = getPageId(i);
						const workspaceId = getWorkspaceId(i);
						const updateFields = this.getNodeParameter('updateFields', i) as any;
						const additionalFields = this.getNodeParameter('additionalFields', i) as any;

						const body: any = { ...updateFields, ...additionalFields };
						const qs: any = { workspace_id: workspaceId };

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
								qs,
								body,
								headers: API_CLIENT_HEADER,
								json: true,
							},
						);
					} else if (operation === 'getMany') {
						const workspaceId = getWorkspaceId(i);
						const pageSet = this.getNodeParameter('pageSet', i, 'active') as string;
						const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
						const limit = this.getNodeParameter('limit', i, 50) as number;
						const includeLatest = this.getNodeParameter('includeLatest', i, true) as boolean;
						const qs: IDataObject = { workspace_id: workspaceId };
						if (pageSet === 'paused') {
							qs.disabled = 1;
						} else if (pageSet === 'folder') {
							qs.folder = this.getNodeParameter('folder', i) as string;
						} else {
							qs.folder = '*';
						}
						// With simple, take is checks per page; without it, take caps pages unsorted.
						if (includeLatest) {
							qs.simple = 1;
							qs.take = 1;
						}

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pageCrawlApi',
							{
								method: 'GET',
								url: `${baseUrl}/api/pages`,
								qs,
								headers: API_CLIENT_HEADER,
								json: true,
							},
						);
						const pages = (Array.isArray(response) ? response : (response?.data ?? [])) as IDataObject[];
						const selected = returnAll ? pages : pages.slice(0, limit);

						returnData.push(
							...this.helpers.constructExecutionMetaData(
								selected.map((page) => ({ json: page })),
								{ itemData: { item: i } },
							),
						);
						continue;
					} else if (operation === 'pause' || operation === 'resume') {
						const pageId = getPageId(i);
						const workspaceId = getWorkspaceId(i);

						// Set the state rather than toggle it, so a re-run never flips it back.
						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pageCrawlApi',
							{
								method: 'PUT',
								url: `${baseUrl}/api/pages/${pageId}`,
								qs: { workspace_id: workspaceId },
								body: { disabled: operation === 'pause' },
								headers: API_CLIENT_HEADER,
								json: true,
							},
						);
					} else if (operation === 'delete') {
						const pageId = getPageId(i);
						const workspaceId = getWorkspaceId(i);

						await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pageCrawlApi',
							{
								method: 'DELETE',
								url: `${baseUrl}/api/pages/${pageId}`,
								qs: { workspace_id: workspaceId },
								headers: API_CLIENT_HEADER,
								json: true,
							},
						);

						responseData = { success: true, deleted: pageId };
					} else if (operation === 'runCheckNow') {
						const pageId = getPageId(i);
						const workspaceId = getWorkspaceId(i);
						const options = this.getNodeParameter('runCheckOptions', i) as any;
						const qs: any = { workspace_id: workspaceId };

						if (options.skip_first_notification) {
							qs.skip_first_notification = 1;
						}

						await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pageCrawlApi',
							{
								method: 'PUT',
								url: `${baseUrl}/api/pages/${pageId}/check`,
								qs,
								headers: API_CLIENT_HEADER,
								json: true,
							},
						);

						responseData = { success: true, message: 'Check triggered', pageId };
					}
				} else if (resource === 'check') {
					const pageId = getPageId(i);
					const workspaceId = getWorkspaceId(i);

					if (operation === 'getHistory') {
						const options = this.getNodeParameter('options', i) as any;
						const qs: any = { workspace_id: workspaceId };

						// Default to simple mode unless advanced is enabled
						if (!options.advanced) {
							qs.simple = 1;
						}
						qs.take = options.take ?? 2;

						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pageCrawlApi',
							{
								method: 'GET',
								url: `${baseUrl}/api/pages/${pageId}/history`,
								qs,
								headers: API_CLIENT_HEADER,
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
								qs: { workspace_id: workspaceId },
								headers: API_CLIENT_HEADER,
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
								qs: { workspace_id: workspaceId },
								headers: {
									...API_CLIENT_HEADER,
									Accept: 'text/html',
								},
							},
						);

						responseData = {
							html: htmlContent,
							pageId,
							checkId,
						};
					} else if (operation === 'getDiffPatch') {
						const checkId = this.getNodeParameter('checkId', i) as string;

						const patch = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pageCrawlApi',
							{
								method: 'GET',
								url: `${baseUrl}/api/pages/${pageId}/checks/${checkId}/diff.patch`,
								qs: { workspace_id: workspaceId },
								headers: { ...API_CLIENT_HEADER, Accept: 'text/plain' },
							},
						);

						responseData = { patch, pageId, checkId };
					} else if (operation === 'getBeforeAfter') {
						const checkId = this.getNodeParameter('checkId', i) as string;

						const image = (await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pageCrawlApi',
							{
								method: 'GET',
								url: `${baseUrl}/api/pages/${pageId}/checks/${checkId}/before-after.jpg`,
								qs: { workspace_id: workspaceId },
								headers: API_CLIENT_HEADER,
								encoding: 'arraybuffer',
							},
						)) as Buffer;
						// A PNG placeholder comes back when the check has nothing to compare.
						const png = Buffer.from(image).subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
						const binaryData = await this.helpers.prepareBinaryData(
							Buffer.from(image),
							`before-after-${pageId}-${checkId}.${png ? 'png' : 'jpg'}`,
							png ? 'image/png' : 'image/jpeg',
						);

						returnData.push(
							...this.helpers.constructExecutionMetaData(
								[{ json: { pageId, checkId, placeholder: png }, binary: { data: binaryData } }],
								{ itemData: { item: i } },
							),
						);
						continue;
					} else if (operation === 'getDiffMarkdown') {
						const checkId = this.getNodeParameter('checkId', i) as string;

						const markdownContent = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pageCrawlApi',
							{
								method: 'GET',
								url: `${baseUrl}/api/pages/${pageId}/checks/${checkId}/diff.markdown`,
								qs: { workspace_id: workspaceId },
								headers: {
									...API_CLIENT_HEADER,
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
				} else if (resource === 'dataSource') {
					if (operation === 'create') {
						const workspaceId = getWorkspaceId(i);
						const fields = transformFixedCollection(this.getNodeParameter('fields', i, {}), 'field')
							.filter((field: IDataObject) => String(field.label ?? '').trim() !== '');
						const body: IDataObject = { name: this.getNodeParameter('name', i) as string };
						if (fields.length > 0) {
							body.fields = fields;
						}

						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'pageCrawlApi',
							{
								method: 'POST',
								url: `${baseUrl}/api/data-sources`,
								qs: { workspace_id: workspaceId },
								body,
								headers: API_CLIENT_HEADER,
								json: true,
							},
						);
					} else if (operation === 'pushValue') {
						const ingestUrl = String(this.getNodeParameter('ingestUrl', i)).trim();
						// The URL is the credential, so only ever send values to PageCrawl itself.
						if (!/^https:\/\/pagecrawl\.io\/api\/ingest\/[A-Za-z0-9_-]+$/.test(ingestUrl)) {
							throw new NodeOperationError(
								this.getNode(),
								'The ingest URL must look like https://pagecrawl.io/api/ingest/data-...',
								{ itemIndex: i },
							);
						}
						const valueMode = this.getNodeParameter('valueMode', i, 'single') as string;
						let body: IDataObject;
						if (valueMode === 'fields') {
							const values: IDataObject = {};
							for (const row of transformFixedCollection(this.getNodeParameter('values', i, {}), 'value')) {
								const name = String(row.name ?? '').trim();
								if (name) {
									values[name] = row.value;
								}
							}
							if (Object.keys(values).length === 0) {
								throw new NodeOperationError(this.getNode(), 'Add at least one field and value', { itemIndex: i });
							}
							body = { values };
						} else {
							body = { value: this.getNodeParameter('value', i) as string };
						}

						responseData = await this.helpers.httpRequest({
							method: 'POST',
							url: ingestUrl,
							body,
							headers: API_CLIENT_HEADER,
							json: true,
						});
					}
				} else if (resource === 'screenshot') {
					const pageId = getPageId(i);
					const workspaceId = getWorkspaceId(i);
					const checkId = this.getNodeParameter('checkId', i, 'latest') as string;
					let endpoint = '';

					if (operation === 'getScreenshot') {
						endpoint = `/pages/${pageId}/checks/${checkId}/screenshot`;
					} else if (operation === 'getScreenshotDiff') {
						endpoint = `/pages/${pageId}/checks/${checkId}/diff`;
					}

					const previous = operation === 'getScreenshot' ? this.getNodeParameter('previous', i, false) as boolean : false;
					const qs: any = { workspace_id: workspaceId };
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
							headers: API_CLIENT_HEADER,
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
				if (error instanceof NodeOperationError || error instanceof NodeApiError) {
					throw error;
				}
				// An HTTP failure from the API: show its status and PageCrawl's own message.
				if (error?.response || error?.statusCode || error?.httpCode) {
					const message = error.response?.body?.message || error.response?.body?.error;
					throw new NodeApiError(this.getNode(), error as JsonObject, {
						itemIndex: i,
						...(typeof message === 'string' ? { message } : {}),
					});
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
