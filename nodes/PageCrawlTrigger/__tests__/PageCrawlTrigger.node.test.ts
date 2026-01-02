import { IHookFunctions, IWebhookFunctions, IDataObject } from 'n8n-workflow';
import { PageCrawlTrigger } from '../PageCrawlTrigger.node';

describe('PageCrawlTrigger Node', () => {
	let node: PageCrawlTrigger;

	beforeEach(() => {
		node = new PageCrawlTrigger();
	});

	describe('Node Description', () => {
		it('should have correct display name', () => {
			expect(node.description.displayName).toBe('PageCrawl Trigger');
		});

		it('should have correct name', () => {
			expect(node.description.name).toBe('pageCrawlTrigger');
		});

		it('should have correct version', () => {
			expect(node.description.version).toBe(1);
		});

		it('should be in trigger group', () => {
			expect(node.description.group).toContain('trigger');
		});

		it('should have no inputs and one output', () => {
			expect(node.description.inputs).toEqual([]);
			expect(node.description.outputs).toEqual(['main']);
		});

		it('should require pageCrawlApi credentials', () => {
			expect(node.description.credentials).toEqual([
				{
					name: 'pageCrawlApi',
					required: true,
				},
			]);
		});

		it('should have webhook configuration', () => {
			expect(node.description.webhooks).toHaveLength(1);
			expect(node.description.webhooks?.[0]).toEqual({
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'pagecrawl',
			});
		});

		it('should have icon file reference', () => {
			expect(node.description.icon).toBe('file:pagecrawl.svg');
		});
	});

	describe('Node Properties', () => {
		it('should have events property with correct options', () => {
			const eventsProperty = node.description.properties.find((p) => p.name === 'events');
			expect(eventsProperty).toBeDefined();
			expect(eventsProperty?.type).toBe('multiOptions');
			expect(eventsProperty?.required).toBe(true);

			const options = eventsProperty?.options as Array<{ value: string }>;
			const eventValues = options.map((o) => o.value);
			expect(eventValues).toContain('change');
			expect(eventValues).toContain('error');
		});

		it('should have pageId property', () => {
			const pageIdProperty = node.description.properties.find((p) => p.name === 'pageId');
			expect(pageIdProperty).toBeDefined();
			expect(pageIdProperty?.type).toBe('string');
			expect(pageIdProperty?.default).toBe('');
		});

		it('should have payloadFields property', () => {
			const payloadFieldsProperty = node.description.properties.find(
				(p) => p.name === 'payloadFields'
			);
			expect(payloadFieldsProperty).toBeDefined();
			expect(payloadFieldsProperty?.type).toBe('multiOptions');
		});

		it('should have options collection with simplify', () => {
			const optionsProperty = node.description.properties.find((p) => p.name === 'options');
			expect(optionsProperty).toBeDefined();
			expect(optionsProperty?.type).toBe('collection');

			const options = optionsProperty?.options as Array<{ name: string }>;
			const optionNames = options.map((o) => o.name);
			expect(optionNames).toContain('simplify');
		});
	});

	describe('Webhook Methods', () => {
		it('should have webhookMethods defined', () => {
			expect(node.webhookMethods).toBeDefined();
			expect(node.webhookMethods.default).toBeDefined();
		});

		it('should have checkExists method', () => {
			expect(node.webhookMethods.default.checkExists).toBeDefined();
			expect(typeof node.webhookMethods.default.checkExists).toBe('function');
		});

		it('should have create method', () => {
			expect(node.webhookMethods.default.create).toBeDefined();
			expect(typeof node.webhookMethods.default.create).toBe('function');
		});

		it('should have delete method', () => {
			expect(node.webhookMethods.default.delete).toBeDefined();
			expect(typeof node.webhookMethods.default.delete).toBe('function');
		});
	});

	describe('Webhook Handler', () => {
		it('should have webhook method defined', () => {
			expect(node.webhook).toBeDefined();
			expect(typeof node.webhook).toBe('function');
		});
	});
});

describe('PageCrawlTrigger Webhook Methods', () => {
	let node: PageCrawlTrigger;
	let mockHookFunctions: jest.Mocked<IHookFunctions>;

	beforeEach(() => {
		node = new PageCrawlTrigger();
		mockHookFunctions = {
			getWorkflowStaticData: jest.fn().mockReturnValue({}),
			getNodeWebhookUrl: jest.fn().mockReturnValue('https://n8n.example.com/webhook/pagecrawl'),
			getCredentials: jest.fn().mockResolvedValue({
				apiToken: 'test-token',
				baseUrl: 'https://pagecrawl.io',
			}),
			getNodeParameter: jest.fn(),
			helpers: {
				httpRequestWithAuthentication: {
					call: jest.fn(),
				},
			},
		} as unknown as jest.Mocked<IHookFunctions>;
	});

	describe('checkExists', () => {
		it('should return false when no webhookId stored', async () => {
			mockHookFunctions.getWorkflowStaticData.mockReturnValue({});

			const boundCheckExists = node.webhookMethods.default.checkExists.bind(mockHookFunctions);
			const result = await boundCheckExists();

			expect(result).toBe(false);
		});

		it('should return true when webhook exists and matches URL', async () => {
			const webhookId = 123;
			const webhookUrl = 'https://n8n.example.com/webhook/pagecrawl';

			mockHookFunctions.getWorkflowStaticData.mockReturnValue({ webhookId });
			mockHookFunctions.getNodeWebhookUrl.mockReturnValue(webhookUrl);
			mockHookFunctions.helpers.httpRequestWithAuthentication.call = jest.fn().mockResolvedValue([
				{ id: webhookId, target_url: webhookUrl },
			]);

			const boundCheckExists = node.webhookMethods.default.checkExists.bind(mockHookFunctions);
			const result = await boundCheckExists();

			expect(result).toBe(true);
		});

		it('should return false when webhook URL does not match', async () => {
			const webhookId = 123;

			mockHookFunctions.getWorkflowStaticData.mockReturnValue({ webhookId });
			mockHookFunctions.getNodeWebhookUrl.mockReturnValue('https://n8n.example.com/webhook/pagecrawl');
			mockHookFunctions.helpers.httpRequestWithAuthentication.call = jest.fn().mockResolvedValue([
				{ id: webhookId, target_url: 'https://different-url.com/webhook' },
			]);

			const boundCheckExists = node.webhookMethods.default.checkExists.bind(mockHookFunctions);
			const result = await boundCheckExists();

			expect(result).toBe(false);
		});
	});

	describe('create', () => {
		it('should create webhook and store ID', async () => {
			const webhookData: IDataObject = {};
			const webhookId = 456;

			mockHookFunctions.getWorkflowStaticData.mockReturnValue(webhookData);
			mockHookFunctions.getNodeParameter
				.mockReturnValueOnce('') // pageId
				.mockReturnValueOnce(['id', 'title', 'status']); // payloadFields

			mockHookFunctions.helpers.httpRequestWithAuthentication.call = jest
				.fn()
				.mockResolvedValue({ id: webhookId });

			const boundCreate = node.webhookMethods.default.create.bind(mockHookFunctions);
			const result = await boundCreate();

			expect(result).toBe(true);
			expect(webhookData.webhookId).toBe(webhookId);
			expect(mockHookFunctions.helpers.httpRequestWithAuthentication.call).toHaveBeenCalledWith(
				mockHookFunctions,
				'pageCrawlApi',
				expect.objectContaining({
					method: 'POST',
					url: 'https://pagecrawl.io/api/hooks',
				})
			);
		});

		it('should include pageId when provided', async () => {
			const webhookData: IDataObject = {};

			mockHookFunctions.getWorkflowStaticData.mockReturnValue(webhookData);
			mockHookFunctions.getNodeParameter
				.mockReturnValueOnce('page-123') // pageId
				.mockReturnValueOnce([]); // payloadFields

			mockHookFunctions.helpers.httpRequestWithAuthentication.call = jest
				.fn()
				.mockResolvedValue({ id: 1 });

			const boundCreate = node.webhookMethods.default.create.bind(mockHookFunctions);
			await boundCreate();

			expect(mockHookFunctions.helpers.httpRequestWithAuthentication.call).toHaveBeenCalledWith(
				mockHookFunctions,
				'pageCrawlApi',
				expect.objectContaining({
					body: expect.objectContaining({
						change_id: 'page-123',
					}),
				})
			);
		});
	});

	describe('delete', () => {
		it('should return true when no webhookId stored', async () => {
			mockHookFunctions.getWorkflowStaticData.mockReturnValue({});

			const boundDelete = node.webhookMethods.default.delete.bind(mockHookFunctions);
			const result = await boundDelete();

			expect(result).toBe(true);
		});

		it('should delete webhook and clear ID', async () => {
			const webhookData: IDataObject = { webhookId: 123 };

			mockHookFunctions.getWorkflowStaticData.mockReturnValue(webhookData);
			mockHookFunctions.helpers.httpRequestWithAuthentication.call = jest
				.fn()
				.mockResolvedValue({});

			const boundDelete = node.webhookMethods.default.delete.bind(mockHookFunctions);
			const result = await boundDelete();

			expect(result).toBe(true);
			expect(webhookData.webhookId).toBeUndefined();
			expect(mockHookFunctions.helpers.httpRequestWithAuthentication.call).toHaveBeenCalledWith(
				mockHookFunctions,
				'pageCrawlApi',
				expect.objectContaining({
					method: 'DELETE',
					url: 'https://pagecrawl.io/api/hooks/123',
				})
			);
		});
	});
});

describe('PageCrawlTrigger Webhook Handler', () => {
	let node: PageCrawlTrigger;
	let mockWebhookFunctions: jest.Mocked<IWebhookFunctions>;

	beforeEach(() => {
		node = new PageCrawlTrigger();
		mockWebhookFunctions = {
			getRequestObject: jest.fn(),
			getNodeParameter: jest.fn(),
			helpers: {
				returnJsonArray: jest.fn().mockImplementation((data) => [{ json: data }]),
			},
		} as unknown as jest.Mocked<IWebhookFunctions>;
	});

	it('should process change event when subscribed', async () => {
		mockWebhookFunctions.getRequestObject.mockReturnValue({
			body: {
				id: 1,
				title: 'Test Check',
				status: 'changed',
				changed_at: '2024-01-01T00:00:00Z',
				difference: 10,
			},
		} as any);
		mockWebhookFunctions.getNodeParameter
			.mockReturnValueOnce(['change']) // events
			.mockReturnValueOnce({ simplify: false }); // options

		const boundWebhook = node.webhook.bind(mockWebhookFunctions);
		const result = await boundWebhook();

		expect(result.workflowData).toBeDefined();
		expect(result.workflowData?.length).toBeGreaterThan(0);
	});

	it('should skip change event when not subscribed', async () => {
		mockWebhookFunctions.getRequestObject.mockReturnValue({
			body: {
				id: 1,
				status: 'changed',
			},
		} as any);
		mockWebhookFunctions.getNodeParameter
			.mockReturnValueOnce(['error']) // events - only subscribed to errors
			.mockReturnValueOnce({}); // options

		const boundWebhook = node.webhook.bind(mockWebhookFunctions);
		const result = await boundWebhook();

		expect(result.workflowData).toEqual([]);
	});

	it('should process error event when subscribed', async () => {
		mockWebhookFunctions.getRequestObject.mockReturnValue({
			body: {
				id: 1,
				status: 'error',
				error_message: 'Page not found',
			},
		} as any);
		mockWebhookFunctions.getNodeParameter
			.mockReturnValueOnce(['error']) // events
			.mockReturnValueOnce({ simplify: false }); // options

		const boundWebhook = node.webhook.bind(mockWebhookFunctions);
		const result = await boundWebhook();

		expect(result.workflowData).toBeDefined();
		expect(result.workflowData?.length).toBeGreaterThan(0);
	});

	it('should simplify output when option is enabled', async () => {
		const webhookBody = {
			id: 1,
			title: 'Test Check',
			status: 'changed',
			changed_at: '2024-01-01T00:00:00Z',
			difference: 10,
			human_difference: '10%',
			page: {
				url: 'https://example.com',
				name: 'Example Page',
				link: 'https://pagecrawl.io/pages/1',
			},
			contents: 'New content',
		};

		mockWebhookFunctions.getRequestObject.mockReturnValue({ body: webhookBody } as any);
		mockWebhookFunctions.getNodeParameter
			.mockReturnValueOnce(['change']) // events
			.mockReturnValueOnce({ simplify: true }); // options

		const boundWebhook = node.webhook.bind(mockWebhookFunctions);
		await boundWebhook();

		expect(mockWebhookFunctions.helpers.returnJsonArray).toHaveBeenCalledWith(
			expect.objectContaining({
				id: 1,
				title: 'Test Check',
				status: 'changed',
				changedAt: '2024-01-01T00:00:00Z',
				difference: 10,
				humanDifference: '10%',
				pageUrl: 'https://example.com',
				pageName: 'Example Page',
				pageLink: 'https://pagecrawl.io/pages/1',
				contents: 'New content',
			})
		);
	});
});