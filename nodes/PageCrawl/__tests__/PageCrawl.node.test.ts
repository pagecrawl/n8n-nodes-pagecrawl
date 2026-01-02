import { IExecuteFunctions } from 'n8n-workflow';
import { PageCrawl } from '../PageCrawl.node';

describe('PageCrawl Node', () => {
	let node: PageCrawl;

	beforeEach(() => {
		node = new PageCrawl();
	});

	describe('Node Description', () => {
		it('should have correct display name', () => {
			expect(node.description.displayName).toBe('PageCrawl');
		});

		it('should have correct name', () => {
			expect(node.description.name).toBe('pageCrawl');
		});

		it('should have correct version', () => {
			expect(node.description.version).toBe(1);
		});

		it('should require pageCrawlApi credentials', () => {
			expect(node.description.credentials).toEqual([
				{
					name: 'pageCrawlApi',
					required: true,
				},
			]);
		});

		it('should have all required resources', () => {
			const resourceProperty = node.description.properties.find(
				(p) => p.name === 'resource'
			);
			expect(resourceProperty).toBeDefined();
			expect(resourceProperty?.type).toBe('options');

			const options = resourceProperty?.options as Array<{ value: string }>;
			const resourceValues = options.map((o) => o.value);

			expect(resourceValues).toContain('page');
			expect(resourceValues).toContain('check');
			expect(resourceValues).toContain('screenshot');
			expect(resourceValues).toContain('webhook');
		});

		it('should have correct default resource', () => {
			const resourceProperty = node.description.properties.find(
				(p) => p.name === 'resource'
			);
			expect(resourceProperty?.default).toBe('page');
		});

		it('should have icon file reference', () => {
			expect(node.description.icon).toBe('file:pagecrawl.svg');
		});

		it('should have one input and one output', () => {
			expect(node.description.inputs).toEqual(['main']);
			expect(node.description.outputs).toEqual(['main']);
		});
	});

	describe('Execute Function', () => {
		it('should have execute method defined', () => {
			expect(node.execute).toBeDefined();
			expect(typeof node.execute).toBe('function');
		});
	});

	describe('Request Defaults', () => {
		it('should have hardcoded pagecrawl.io base URL', () => {
			expect(node.description.requestDefaults?.baseURL).toBe('https://pagecrawl.io/api');
		});

		it('should have JSON content type headers', () => {
			expect(node.description.requestDefaults?.headers).toEqual({
				Accept: 'application/json',
				'Content-Type': 'application/json',
			});
		});
	});
});

describe('PageCrawl Node Operations', () => {
	let node: PageCrawl;
	let mockExecuteFunctions: jest.Mocked<IExecuteFunctions>;

	beforeEach(() => {
		node = new PageCrawl();
		mockExecuteFunctions = {
			getInputData: jest.fn().mockReturnValue([{ json: {} }]),
			getCredentials: jest.fn().mockResolvedValue({
				apiToken: 'test-token',
				baseUrl: 'https://pagecrawl.io',
			}),
			getNodeParameter: jest.fn(),
			getNode: jest.fn().mockReturnValue({ name: 'PageCrawl' }),
			continueOnFail: jest.fn().mockReturnValue(false),
			helpers: {
				httpRequestWithAuthentication: {
					call: jest.fn(),
				},
				prepareBinaryData: jest.fn(),
				constructExecutionMetaData: jest.fn().mockImplementation((items) => items),
			},
		} as unknown as jest.Mocked<IExecuteFunctions>;
	});

	describe('Page Resource', () => {
		it('should call correct endpoint for getAll operation', async () => {
			mockExecuteFunctions.getNodeParameter
				.mockReturnValueOnce('page') // resource
				.mockReturnValueOnce('getAll') // operation
				.mockReturnValueOnce(true) // returnAll
				.mockReturnValueOnce({}); // options

			mockExecuteFunctions.helpers.httpRequestWithAuthentication.call = jest
				.fn()
				.mockResolvedValue([{ id: 1, name: 'Test Page' }]);

			const boundExecute = node.execute.bind(mockExecuteFunctions);
			await boundExecute();

			expect(mockExecuteFunctions.helpers.httpRequestWithAuthentication.call).toHaveBeenCalledWith(
				mockExecuteFunctions,
				'pageCrawlApi',
				expect.objectContaining({
					method: 'GET',
					url: 'https://pagecrawl.io/api/pages',
				})
			);
		});

		it('should call correct endpoint for get operation', async () => {
			mockExecuteFunctions.getNodeParameter
				.mockReturnValueOnce('page') // resource
				.mockReturnValueOnce('get') // operation
				.mockReturnValueOnce({ mode: 'slug', value: '123' }) // pageId (resourceLocator)
				.mockReturnValueOnce({}); // options

			mockExecuteFunctions.helpers.httpRequestWithAuthentication.call = jest
				.fn()
				.mockResolvedValue({ id: 123, name: 'Test Page' });

			const boundExecute = node.execute.bind(mockExecuteFunctions);
			await boundExecute();

			expect(mockExecuteFunctions.helpers.httpRequestWithAuthentication.call).toHaveBeenCalledWith(
				mockExecuteFunctions,
				'pageCrawlApi',
				expect.objectContaining({
					method: 'GET',
					url: 'https://pagecrawl.io/api/pages/123',
				})
			);
		});

		it('should call correct endpoint for delete operation', async () => {
			mockExecuteFunctions.getNodeParameter
				.mockReturnValueOnce('page') // resource
				.mockReturnValueOnce('delete') // operation
				.mockReturnValueOnce({ mode: 'slug', value: '123' }); // pageId (resourceLocator)

			mockExecuteFunctions.helpers.httpRequestWithAuthentication.call = jest
				.fn()
				.mockResolvedValue({});

			const boundExecute = node.execute.bind(mockExecuteFunctions);
			await boundExecute();

			expect(mockExecuteFunctions.helpers.httpRequestWithAuthentication.call).toHaveBeenCalledWith(
				mockExecuteFunctions,
				'pageCrawlApi',
				expect.objectContaining({
					method: 'DELETE',
					url: 'https://pagecrawl.io/api/pages/123',
				})
			);
		});

		it('should call correct endpoint for runCheckNow operation', async () => {
			mockExecuteFunctions.getNodeParameter
				.mockReturnValueOnce('page') // resource
				.mockReturnValueOnce('runCheckNow') // operation
				.mockReturnValueOnce({ mode: 'slug', value: '123' }) // pageId (resourceLocator)
				.mockReturnValueOnce({}); // runCheckOptions

			mockExecuteFunctions.helpers.httpRequestWithAuthentication.call = jest
				.fn()
				.mockResolvedValue({});

			const boundExecute = node.execute.bind(mockExecuteFunctions);
			await boundExecute();

			expect(mockExecuteFunctions.helpers.httpRequestWithAuthentication.call).toHaveBeenCalledWith(
				mockExecuteFunctions,
				'pageCrawlApi',
				expect.objectContaining({
					method: 'PUT',
					url: 'https://pagecrawl.io/api/pages/123/check',
				})
			);
		});
	});

	describe('Webhook Resource', () => {
		it('should call correct endpoint for webhook getAll', async () => {
			mockExecuteFunctions.getNodeParameter
				.mockReturnValueOnce('webhook') // resource
				.mockReturnValueOnce('getAll') // operation
				.mockReturnValueOnce(true); // returnAll

			mockExecuteFunctions.helpers.httpRequestWithAuthentication.call = jest
				.fn()
				.mockResolvedValue([]);

			const boundExecute = node.execute.bind(mockExecuteFunctions);
			await boundExecute();

			expect(mockExecuteFunctions.helpers.httpRequestWithAuthentication.call).toHaveBeenCalledWith(
				mockExecuteFunctions,
				'pageCrawlApi',
				expect.objectContaining({
					method: 'GET',
					url: 'https://pagecrawl.io/api/hooks',
				})
			);
		});

		it('should call correct endpoint for webhook create', async () => {
			mockExecuteFunctions.getNodeParameter
				.mockReturnValueOnce('webhook') // resource
				.mockReturnValueOnce('create') // operation
				.mockReturnValueOnce('https://example.com/webhook') // target_url
				.mockReturnValueOnce({}); // additionalFields

			mockExecuteFunctions.helpers.httpRequestWithAuthentication.call = jest
				.fn()
				.mockResolvedValue({ id: 1 });

			const boundExecute = node.execute.bind(mockExecuteFunctions);
			await boundExecute();

			expect(mockExecuteFunctions.helpers.httpRequestWithAuthentication.call).toHaveBeenCalledWith(
				mockExecuteFunctions,
				'pageCrawlApi',
				expect.objectContaining({
					method: 'POST',
					url: 'https://pagecrawl.io/api/hooks',
					body: { target_url: 'https://example.com/webhook' },
				})
			);
		});
	});

	describe('Error Handling', () => {
		it('should continue on fail when configured', async () => {
			mockExecuteFunctions.getNodeParameter
				.mockReturnValueOnce('page') // resource
				.mockReturnValueOnce('getAll'); // operation

			mockExecuteFunctions.continueOnFail.mockReturnValue(true);
			mockExecuteFunctions.helpers.httpRequestWithAuthentication.call = jest
				.fn()
				.mockRejectedValue(new Error('API Error'));

			const boundExecute = node.execute.bind(mockExecuteFunctions);
			const result = await boundExecute();

			expect(result).toBeDefined();
			expect(result[0][0].json).toHaveProperty('error');
		});
	});
});