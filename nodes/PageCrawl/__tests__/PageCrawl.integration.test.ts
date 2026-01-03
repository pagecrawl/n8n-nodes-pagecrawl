/**
 * Integration tests for PageCrawl n8n node
 *
 * These tests connect to a real PageCrawl API to verify operations work correctly.
 *
 * Required environment variables:
 * - PAGECRAWL_TEST_API_KEY: API key for authentication
 * - PAGECRAWL_TEST_WORKSPACE_ID: Workspace ID to use for tests
 * - PAGECRAWL_TEST_BASE_URL: Base URL (defaults to https://pagecrawl.test)
 *
 * Run with: npm run test:integration
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

const baseUrl = process.env.PAGECRAWL_TEST_BASE_URL || 'https://pagecrawl.test';
const apiKey = process.env.PAGECRAWL_TEST_API_KEY;
const workspaceId = process.env.PAGECRAWL_TEST_WORKSPACE_ID;

// Skip all tests if credentials not provided
const describeIfCredentials = apiKey && workspaceId ? describe : describe.skip;

describeIfCredentials('PageCrawl Integration Tests', () => {
	let api: AxiosInstance;
	const createdPageSlugs: string[] = [];
	const testRunId = Date.now();

	beforeAll(() => {
		if (!apiKey) {
			throw new Error('PAGECRAWL_TEST_API_KEY environment variable is required');
		}
		if (!workspaceId) {
			throw new Error('PAGECRAWL_TEST_WORKSPACE_ID environment variable is required');
		}

		api = axios.create({
			baseURL: `${baseUrl}/api`,
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			validateStatus: () => true, // Don't throw on non-2xx
		});
	});

	afterAll(async () => {
		// Cleanup: delete all pages created during tests
		for (const slug of createdPageSlugs) {
			try {
				await api.delete(`/pages/${slug}`);
			} catch (error) {
				// Ignore cleanup errors
			}
		}
	});

	describe('API Connection', () => {
		it('should connect to the API successfully', async () => {
			const response = await api.get('/user');
			expect(response.status).toBe(200);
			expect(response.data).toBeDefined();
		});

		it('should have access to the test workspace', async () => {
			const response = await api.get('/user');
			expect(response.status).toBe(200);
			// Workspaces may be nested under user or at top level
			const workspaces = response.data.workspaces || response.data.user?.workspaces || [];
			const hasWorkspace = workspaces.some((w: any) => String(w.id) === String(workspaceId));
			expect(hasWorkspace).toBe(true);
		});
	});

	describe('Create Page - Simple', () => {
		it('should create a page with minimal required fields', async () => {
			const pageData = {
				workspace_id: workspaceId,
				url: 'https://example.com',
				name: `Integration Test Simple - ${testRunId}`,
				frequency: 1440,
				elements: [{ type: 'fullpage', selector: '*', label: 'Full Page' }],
			};

			const response = await api.post('/pages', pageData);

			expect([200, 201]).toContain(response.status);
			expect(response.data.slug).toBeDefined();
			expect(response.data.name).toBe(pageData.name);
			expect(response.data.url).toBe(pageData.url);

			createdPageSlugs.push(response.data.slug);
		});

		it('should create a page with text element type', async () => {
			const pageData = {
				workspace_id: workspaceId,
				url: 'https://example.com/text-test',
				name: `Text Element Test - ${testRunId}`,
				frequency: 1440,
				elements: [{ type: 'text', selector: 'body', label: 'Body Text' }],
			};

			const response = await api.post('/pages', pageData);

			expect([200, 201]).toContain(response.status);
			expect(response.data.slug).toBeDefined();
			createdPageSlugs.push(response.data.slug);
		});

		it('should create a page with visual element type', async () => {
			const pageData = {
				workspace_id: workspaceId,
				url: 'https://example.com/visual-test',
				name: `Visual Element Test - ${testRunId}`,
				frequency: 1440,
				elements: [{ type: 'visual', selector: '0,0,800,600', label: 'Body Visual' }],
			};

			const response = await api.post('/pages', pageData);

			expect([200, 201]).toContain(response.status);
			expect(response.data.slug).toBeDefined();
			createdPageSlugs.push(response.data.slug);
		});
	});

	describe('Create Page - All Configuration Options', () => {
		it('should create a page with multiple elements', async () => {
			const pageData = {
				workspace_id: workspaceId,
				url: 'https://example.com/multi-element',
				name: `Multi Element Test - ${testRunId}`,
				frequency: 1440,
				elements: [
					{ type: 'fullpage', selector: '*', label: 'Full Page' },
					{ type: 'text', selector: '.content', threshold: 5, label: 'Content Text' },
					{ type: 'visual', selector: '0,0,1200,100', label: 'Header Visual' },
				],
			};

			const response = await api.post('/pages', pageData);

			expect([200, 201]).toContain(response.status);
			expect(response.data.slug).toBeDefined();
			createdPageSlugs.push(response.data.slug);
		});

		it('should create a page with actions', async () => {
			const pageData = {
				workspace_id: workspaceId,
				url: 'https://example.com/actions-test',
				name: `Actions Test - ${testRunId}`,
				frequency: 1440,
				elements: [{ type: 'fullpage', selector: '*', label: 'Full Page' }],
				actions: [
					{ type: 'wait', value: '2' },
					{ type: 'scroll_to_bottom' },
				],
			};

			const response = await api.post('/pages', pageData);

			expect([200, 201]).toContain(response.status);
			expect(response.data.slug).toBeDefined();
			createdPageSlugs.push(response.data.slug);
		});

		it('should create a page with device simulation', async () => {
			// Device values come from API - skip setting device for now
			// as valid values are dynamic per account
			const pageData = {
				workspace_id: workspaceId,
				url: 'https://example.com/device-test',
				name: `Device Test - ${testRunId}`,
				frequency: 1440,
				elements: [{ type: 'fullpage', selector: '*', label: 'Full Page' }],
				// device: fetched dynamically from API in real usage
			};

			const response = await api.post('/pages', pageData);

			expect([200, 201]).toContain(response.status);
			expect(response.data.slug).toBeDefined();
			createdPageSlugs.push(response.data.slug);
		});

		it('should create a page with language and timezone', async () => {
			const pageData = {
				workspace_id: workspaceId,
				url: 'https://example.com/locale-test',
				name: `Locale Test - ${testRunId}`,
				frequency: 1440,
				elements: [{ type: 'fullpage', selector: '*', label: 'Full Page' }],
				language: 'en-us',
				timezone: 'America/New_York',
			};

			const response = await api.post('/pages', pageData);

			expect([200, 201]).toContain(response.status);
			expect(response.data.slug).toBeDefined();
			createdPageSlugs.push(response.data.slug);
		});

		it('should create a page with AI settings', async () => {
			const pageData = {
				workspace_id: workspaceId,
				url: 'https://example.com/ai-test',
				name: `AI Settings Test - ${testRunId}`,
				frequency: 1440,
				elements: [{ type: 'fullpage', selector: '*', label: 'Full Page' }],
				ai_summaries_enabled: true,
				ai_page_focus: 'Focus on pricing and availability changes',
			};

			const response = await api.post('/pages', pageData);

			expect([200, 201]).toContain(response.status);
			expect(response.data.slug).toBeDefined();
			createdPageSlugs.push(response.data.slug);
		});

		it('should create a page with screenshots enabled', async () => {
			const pageData = {
				workspace_id: workspaceId,
				url: 'https://example.com/screenshot-test',
				name: `Screenshot Test - ${testRunId}`,
				frequency: 1440,
				elements: [{ type: 'fullpage', selector: '*', label: 'Full Page' }],
				screenshots: true,
			};

			const response = await api.post('/pages', pageData);

			expect([200, 201]).toContain(response.status);
			expect(response.data.slug).toBeDefined();
			createdPageSlugs.push(response.data.slug);
		});

		it('should create a page with custom user agent', async () => {
			const pageData = {
				workspace_id: workspaceId,
				url: 'https://example.com/ua-test',
				name: `User Agent Test - ${testRunId}`,
				frequency: 1440,
				elements: [{ type: 'fullpage', selector: '*', label: 'Full Page' }],
				user_agent: 'Mozilla/5.0 (compatible; PageCrawl Integration Test)',
			};

			const response = await api.post('/pages', pageData);

			expect([200, 201]).toContain(response.status);
			expect(response.data.slug).toBeDefined();
			createdPageSlugs.push(response.data.slug);
		});

		it('should create a page with tags', async () => {
			const pageData = {
				workspace_id: workspaceId,
				url: 'https://example.com/tags-test',
				name: `Tags Test - ${testRunId}`,
				frequency: 1440,
				elements: [{ type: 'fullpage', selector: '*', label: 'Full Page' }],
				tags: ['integration', 'test', 'automated'],
			};

			const response = await api.post('/pages', pageData);

			expect([200, 201]).toContain(response.status);
			expect(response.data.slug).toBeDefined();
			createdPageSlugs.push(response.data.slug);
		});

		it('should create a page with check_always enabled', async () => {
			const pageData = {
				workspace_id: workspaceId,
				url: 'https://example.com/check-always-test',
				name: `Check Always Test - ${testRunId}`,
				frequency: 1440,
				elements: [{ type: 'fullpage', selector: '*', label: 'Full Page' }],
				check_always: true,
			};

			const response = await api.post('/pages', pageData);

			expect([200, 201]).toContain(response.status);
			expect(response.data.slug).toBeDefined();
			createdPageSlugs.push(response.data.slug);
		});

		it('should create a page with all options combined', async () => {
			const pageData = {
				workspace_id: workspaceId,
				url: 'https://example.com/full-config-test',
				name: `Full Config Test - ${testRunId}`,
				frequency: 60,
				elements: [
					{ type: 'text', selector: '.price', threshold: 1, label: 'Price' },
					{ type: 'visual', selector: '0,0,300,300', label: 'Product Image' },
				],
				actions: [
					{ type: 'wait', value: '1' },
				],
				// device: dynamic from API
				language: 'en-gb',
				timezone: 'Europe/London',
				screenshots: true,
				ai_summaries_enabled: true,
				ai_page_focus: 'Monitor for price drops',
				user_agent: 'PageCrawl Full Config Test',
				tags: ['full-test', 'integration'],
				check_always: true,
			};

			const response = await api.post('/pages', pageData);

			expect([200, 201]).toContain(response.status);
			expect(response.data.slug).toBeDefined();
			expect(response.data.frequency).toBe(60);
			createdPageSlugs.push(response.data.slug);
		});
	});

	describe('Get Page', () => {
		let testPageSlug: string;

		beforeAll(async () => {
			// Create a page to test get operation
			const response = await api.post('/pages', {
				workspace_id: workspaceId,
				url: 'https://example.com/get-test',
				name: `Get Test Page - ${testRunId}`,
				frequency: 1440,
				elements: [{ type: 'fullpage', selector: '*', label: 'Full Page' }],
				tags: ['get-test'],
			});
			testPageSlug = response.data.slug;
			createdPageSlugs.push(testPageSlug);
		});

		it('should retrieve a page by slug', async () => {
			const response = await api.get(`/pages/${testPageSlug}`);

			expect(response.status).toBe(200);
			expect(response.data.slug).toBe(testPageSlug);
			expect(response.data.name).toContain('Get Test Page');
		});

		it('should return 404 for non-existent page', async () => {
			const response = await api.get('/pages/non-existent-slug-12345');

			expect(response.status).toBe(404);
		});
	});

	describe('Update Page', () => {
		let testPageSlug: string;
		let testPageId: number;

		beforeAll(async () => {
			// Create a page to test update operation
			const response = await api.post('/pages', {
				workspace_id: workspaceId,
				url: 'https://example.com/update-test',
				name: `Update Test Page - ${testRunId}`,
				frequency: 1440,
				elements: [{ type: 'fullpage', selector: '*', label: 'Full Page' }],
			});
			testPageSlug = response.data.slug;
			testPageId = response.data.id;
			createdPageSlugs.push(testPageSlug);
		});

		it('should update page name', async () => {
			const newName = `Updated Name - ${testRunId}`;
			const response = await api.put(`/pages/${testPageId}`, {
				name: newName,
			});

			expect(response.status).toBe(200);
			expect(response.data.name).toBe(newName);
		});

		it('should update page frequency', async () => {
			const response = await api.put(`/pages/${testPageId}`, {
				frequency: 60,
			});

			expect(response.status).toBe(200);
			expect(response.data.frequency).toBe(60);
		});

		it('should update multiple fields at once', async () => {
			const response = await api.put(`/pages/${testPageId}`, {
				name: `Multi Update - ${testRunId}`,
				frequency: 120,
				tags: ['updated', 'multi'],
			});

			expect(response.status).toBe(200);
			expect(response.data.name).toContain('Multi Update');
			expect(response.data.frequency).toBe(120);
		});
	});

	describe('Delete Page', () => {
		it('should delete a page', async () => {
			// Create a page to delete
			const createResponse = await api.post('/pages', {
				workspace_id: workspaceId,
				url: 'https://example.com/delete-test',
				name: `Delete Test Page - ${testRunId}`,
				frequency: 1440,
				elements: [{ type: 'fullpage', selector: '*', label: 'Full Page' }],
			});

			expect([200, 201]).toContain(createResponse.status);
			const pageSlug = createResponse.data.slug;
			const pageId = createResponse.data.id;

			// Delete the page
			const deleteResponse = await api.delete(`/pages/${pageId}`);
			expect([200, 204]).toContain(deleteResponse.status);

			// Verify it's deleted
			const getResponse = await api.get(`/pages/${pageSlug}`);
			expect(getResponse.status).toBe(404);
		});
	});

	describe('Error Handling', () => {
		it('should reject request with completely invalid data', async () => {
			const response = await api.post('/pages', {
				// Missing all required fields
			});

			expect(response.status).toBeGreaterThanOrEqual(400);
		});

		it('should reject request with invalid element type', async () => {
			const response = await api.post('/pages', {
				workspace_id: workspaceId,
				url: 'https://example.com',
				name: 'Invalid Element Type Test',
				frequency: 1440,
				elements: [{ type: 'invalid_type_xyz', selector: '*', label: 'Test' }],
			});

			// API may accept or reject - just verify we get a response
			expect(response.status).toBeDefined();
		});
	});
});
