/**
 * Integration tests for PageCrawl n8n node
 *
 * These tests verify that the n8n node correctly communicates with the PageCrawl API.
 * They test the node's execute method with real API calls.
 *
 * Required environment variables:
 * - PAGECRAWL_TEST_API_KEY: API key for authentication
 * - PAGECRAWL_TEST_WORKSPACE_ID: Workspace ID to use for tests
 * - PAGECRAWL_TEST_BASE_URL: Base URL (defaults to https://pagecrawl.test)
 *
 * Run with: npm run test:integration
 */

import axios from 'axios';
import { IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { PageCrawl } from '../PageCrawl.node';

const baseUrl = process.env.PAGECRAWL_TEST_BASE_URL || 'https://pagecrawl.test';
const apiKey = process.env.PAGECRAWL_TEST_API_KEY;
const workspaceId = process.env.PAGECRAWL_TEST_WORKSPACE_ID;

// Skip all tests if credentials not provided
const describeIfCredentials = apiKey && workspaceId ? describe : describe.skip;

/**
 * Creates a mock execution context that makes real API calls
 */
function createExecutionContext(parameterValues: Record<string, any>): IExecuteFunctions {
	const parameterCalls: string[] = [];

	return {
		getInputData: () => [{ json: {} }],
		getCredentials: async () => ({
			apiToken: apiKey,
		}),
		getNodeParameter: (name: string, _index: number, defaultValue?: any) => {
			parameterCalls.push(name);
			return parameterValues[name] ?? defaultValue;
		},
		getNode: () => ({ name: 'PageCrawl' }),
		continueOnFail: () => false,
		helpers: {
			httpRequestWithAuthentication: {
				call: async (_context: any, _credType: string, options: any) => {
					// Rewrite URL from production to test environment
					const url = options.url.replace('https://pagecrawl.io', baseUrl);

					const response = await axios({
						method: options.method,
						url: url,
						data: options.body,
						params: options.qs,
						headers: {
							Authorization: `Bearer ${apiKey}`,
							'Content-Type': 'application/json',
							Accept: 'application/json',
						},
						validateStatus: () => true,
					});

					if (response.status >= 400) {
						const error: any = new Error(response.data?.message || `Request failed with status ${response.status}`);
						error.statusCode = response.status;
						error.responseData = response.data;
						throw error;
					}

					return response.data;
				},
			},
			prepareBinaryData: async (buffer: Buffer, fileName: string, mimeType: string) => ({
				data: buffer.toString('base64'),
				fileName,
				mimeType,
			}),
			constructExecutionMetaData: (
				items: INodeExecutionData[],
				_options: { itemData: { item: number } }
			) => items,
		},
	} as unknown as IExecuteFunctions;
}

describeIfCredentials('PageCrawl Node Integration Tests', () => {
	let node: PageCrawl;
	const createdPageIds: number[] = [];
	const testRunId = Date.now();

	beforeAll(() => {
		if (!apiKey) {
			throw new Error('PAGECRAWL_TEST_API_KEY environment variable is required');
		}
		if (!workspaceId) {
			throw new Error('PAGECRAWL_TEST_WORKSPACE_ID environment variable is required');
		}
	});

	beforeEach(() => {
		node = new PageCrawl();
	});

	afterAll(async () => {
		// Cleanup: delete all pages created during tests
		for (const pageId of createdPageIds) {
			try {
				await axios.delete(`${baseUrl}/api/pages/${pageId}`, {
					headers: {
						Authorization: `Bearer ${apiKey}`,
					},
				});
			} catch (error) {
				// Ignore cleanup errors
			}
		}
	});

	describe('Create Page Operation', () => {
		it('should create a page with minimal required fields through the node', async () => {
			const context = createExecutionContext({
				resource: 'page',
				operation: 'create',
				workspace: { mode: 'id', value: workspaceId },
				url: 'https://example.com/node-test',
				name: `Node Integration Test - ${testRunId}`,
				frequency: 1440,
				elements: {
					element: [
						{ type: 'fullpage', selector: '*', label: 'Full Page' },
					],
				},
				additionalFields: {},
			});

			const boundExecute = node.execute.bind(context);
			const result = await boundExecute();

			expect(result).toBeDefined();
			expect(result[0]).toBeDefined();
			expect(result[0].length).toBeGreaterThan(0);

			const pageData = result[0][0].json;
			expect(pageData.slug).toBeDefined();
			expect(pageData.name).toContain('Node Integration Test');

			if (pageData.id) {
				createdPageIds.push(pageData.id as number);
			}
		});

		it('should create a page with actions through the node', async () => {
			const context = createExecutionContext({
				resource: 'page',
				operation: 'create',
				workspace: { mode: 'id', value: workspaceId },
				url: 'https://example.com/node-actions-test',
				name: `Node Actions Test - ${testRunId}`,
				frequency: 1440,
				elements: {
					element: [
						{ type: 'fullpage', selector: '*', label: 'Full Page' },
					],
				},
				additionalFields: {
					actions: {
						action: [
							{ type: 'wait', value: '2' },
							{ type: 'scroll_to_bottom' },
						],
					},
				},
			});

			const boundExecute = node.execute.bind(context);
			const result = await boundExecute();

			expect(result).toBeDefined();
			expect(result[0]).toBeDefined();
			expect(result[0].length).toBeGreaterThan(0);

			const pageData = result[0][0].json;
			expect(pageData.slug).toBeDefined();

			if (pageData.id) {
				createdPageIds.push(pageData.id as number);
			}
		});

		it('should create a page with tags as comma-separated string', async () => {
			const context = createExecutionContext({
				resource: 'page',
				operation: 'create',
				workspace: { mode: 'id', value: workspaceId },
				url: 'https://example.com/node-tags-test',
				name: `Node Tags Test - ${testRunId}`,
				frequency: 1440,
				elements: {
					element: [
						{ type: 'fullpage', selector: '*', label: 'Full Page' },
					],
				},
				additionalFields: {
					tags: 'node-test, integration, automated',
				},
			});

			const boundExecute = node.execute.bind(context);
			const result = await boundExecute();

			expect(result).toBeDefined();
			const pageData = result[0][0].json;
			expect(pageData.slug).toBeDefined();

			if (pageData.id) {
				createdPageIds.push(pageData.id as number);
			}
		});
	});

	describe('Get Page Operation', () => {
		let testPageId: number;
		let testPageSlug: string;

		beforeAll(async () => {
			// Create a test page first
			const response = await axios.post(
				`${baseUrl}/api/pages`,
				{
					workspace_id: workspaceId,
					url: 'https://example.com/node-get-test',
					name: `Node Get Test - ${testRunId}`,
					frequency: 1440,
					elements: [{ type: 'fullpage', selector: '*', label: 'Full Page' }],
				},
				{
					headers: {
						Authorization: `Bearer ${apiKey}`,
						'Content-Type': 'application/json',
					},
				}
			);
			testPageId = response.data.id;
			testPageSlug = response.data.slug;
			createdPageIds.push(testPageId);
		});

		it('should retrieve a page by ID through the node', async () => {
			const context = createExecutionContext({
				resource: 'page',
				operation: 'get',
				pageId: { mode: 'id', value: String(testPageId) },
				options: {},
			});

			const boundExecute = node.execute.bind(context);
			const result = await boundExecute();

			expect(result).toBeDefined();
			expect(result[0]).toBeDefined();
			expect(result[0].length).toBeGreaterThan(0);

			const pageData = result[0][0].json;
			expect(pageData.id).toBe(testPageId);
			expect(pageData.slug).toBe(testPageSlug);
		});

		it('should retrieve a page by slug through the node', async () => {
			const context = createExecutionContext({
				resource: 'page',
				operation: 'get',
				pageId: { mode: 'slug', value: testPageSlug },
				options: {},
			});

			const boundExecute = node.execute.bind(context);
			const result = await boundExecute();

			expect(result).toBeDefined();
			const pageData = result[0][0].json;
			expect(pageData.slug).toBe(testPageSlug);
		});
	});

	describe('Update Page Operation', () => {
		let testPageId: number;

		beforeAll(async () => {
			// Create a test page first
			const response = await axios.post(
				`${baseUrl}/api/pages`,
				{
					workspace_id: workspaceId,
					url: 'https://example.com/node-update-test',
					name: `Node Update Test - ${testRunId}`,
					frequency: 1440,
					elements: [{ type: 'fullpage', selector: '*', label: 'Full Page' }],
				},
				{
					headers: {
						Authorization: `Bearer ${apiKey}`,
						'Content-Type': 'application/json',
					},
				}
			);
			testPageId = response.data.id;
			createdPageIds.push(testPageId);
		});

		it('should update page name through the node', async () => {
			const newName = `Updated via Node - ${testRunId}`;
			const context = createExecutionContext({
				resource: 'page',
				operation: 'update',
				pageId: { mode: 'id', value: String(testPageId) },
				updateFields: {
					name: newName,
				},
			});

			const boundExecute = node.execute.bind(context);
			const result = await boundExecute();

			expect(result).toBeDefined();
			const pageData = result[0][0].json;
			expect(pageData.name).toBe(newName);
		});

		it('should update page frequency through the node', async () => {
			const context = createExecutionContext({
				resource: 'page',
				operation: 'update',
				pageId: { mode: 'id', value: String(testPageId) },
				updateFields: {
					frequency: 60,
				},
			});

			const boundExecute = node.execute.bind(context);
			const result = await boundExecute();

			expect(result).toBeDefined();
			const pageData = result[0][0].json;
			expect(pageData.frequency).toBe(60);
		});
	});

	describe('Delete Page Operation', () => {
		it('should delete a page through the node', async () => {
			// Create a page to delete
			const createResponse = await axios.post(
				`${baseUrl}/api/pages`,
				{
					workspace_id: workspaceId,
					url: 'https://example.com/node-delete-test',
					name: `Node Delete Test - ${testRunId}`,
					frequency: 1440,
					elements: [{ type: 'fullpage', selector: '*', label: 'Full Page' }],
				},
				{
					headers: {
						Authorization: `Bearer ${apiKey}`,
						'Content-Type': 'application/json',
					},
				}
			);
			const pageId = createResponse.data.id;

			const context = createExecutionContext({
				resource: 'page',
				operation: 'delete',
				pageId: { mode: 'id', value: String(pageId) },
			});

			const boundExecute = node.execute.bind(context);
			const result = await boundExecute();

			expect(result).toBeDefined();

			// Verify page is deleted
			const getResponse = await axios.get(`${baseUrl}/api/pages/${pageId}`, {
				headers: { Authorization: `Bearer ${apiKey}` },
				validateStatus: () => true,
			});
			expect(getResponse.status).toBe(404);
		});
	});


	describe('Run Check Operation', () => {
		let testPageId: number;

		beforeAll(async () => {
			// Create a test page first
			const response = await axios.post(
				`${baseUrl}/api/pages`,
				{
					workspace_id: workspaceId,
					url: 'https://example.com/node-check-test',
					name: `Node Check Test - ${testRunId}`,
					frequency: 1440,
					elements: [{ type: 'fullpage', selector: '*', label: 'Full Page' }],
				},
				{
					headers: {
						Authorization: `Bearer ${apiKey}`,
						'Content-Type': 'application/json',
					},
				}
			);
			testPageId = response.data.id;
			createdPageIds.push(testPageId);
		});

		it('should trigger a check through the node', async () => {
			const context = createExecutionContext({
				resource: 'page',
				operation: 'runCheckNow',
				pageId: { mode: 'id', value: String(testPageId) },
				runCheckOptions: {},
			});

			const boundExecute = node.execute.bind(context);
			const result = await boundExecute();

			expect(result).toBeDefined();
			expect(result[0]).toBeDefined();
		});
	})
});
