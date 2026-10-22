import { IHookFunctions, IWebhookFunctions, IDataObject } from 'n8n-workflow';
import { createHmac } from 'crypto';
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
		it('should have page resourceLocator property', () => {
			const pageProperty = node.description.properties.find((p) => p.name === 'page');
			expect(pageProperty).toBeDefined();
			expect(pageProperty?.type).toBe('resourceLocator');
			expect(pageProperty?.default).toEqual({ mode: 'list', value: '' });
		});

		it('should have payloadFields property', () => {
			const payloadFieldsProperty = node.description.properties.find(
				(p) => p.name === 'payloadFields'
			);
			expect(payloadFieldsProperty).toBeDefined();
			expect(payloadFieldsProperty?.type).toBe('multiOptions');
		});

		it('should have simplifyOutput property with default true', () => {
			const simplifyProperty = node.description.properties.find((p) => p.name === 'simplifyOutput');
			expect(simplifyProperty).toBeDefined();
			expect(simplifyProperty?.type).toBe('boolean');
			expect(simplifyProperty?.default).toBe(true);
		});

		it('should have events property with default change_detected', () => {
			const eventsProperty = node.description.properties.find((p) => p.name === 'events');
			expect(eventsProperty).toBeDefined();
			expect(eventsProperty?.type).toBe('multiOptions');
			expect(eventsProperty?.default).toEqual(['change_detected']);
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
			mockHookFunctions.getNodeParameter.mockReturnValueOnce({ mode: 'list', value: '1' }); // workspace

			const boundCheckExists = node.webhookMethods.default.checkExists.bind(mockHookFunctions);
			const result = await boundCheckExists();

			expect(result).toBe(false);
		});

		it('should return true when webhook exists and matches URL', async () => {
			const webhookId = 123;
			const webhookUrl = 'https://n8n.example.com/webhook/pagecrawl';

			mockHookFunctions.getWorkflowStaticData.mockReturnValue({ webhookId });
			mockHookFunctions.getNodeWebhookUrl.mockReturnValue(webhookUrl);
			mockHookFunctions.getNodeParameter.mockReturnValueOnce({ mode: 'list', value: '1' }); // workspace
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
			mockHookFunctions.getNodeParameter.mockReturnValueOnce({ mode: 'list', value: '1' }); // workspace
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
				.mockReturnValueOnce({ mode: 'list', value: '1' }) // workspace (resourceLocator)
				.mockReturnValueOnce({ mode: 'list', value: '' }) // page (resourceLocator)
				.mockReturnValueOnce(['change_detected']) // events
				.mockReturnValueOnce(true) // simplifyOutput
				.mockReturnValueOnce(false); // sendTestOnListen

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

		it('should include page value when provided', async () => {
			const webhookData: IDataObject = {};

			mockHookFunctions.getWorkflowStaticData.mockReturnValue(webhookData);
			mockHookFunctions.getNodeParameter
				.mockReturnValueOnce({ mode: 'list', value: '1' }) // workspace (resourceLocator)
				.mockReturnValueOnce({ mode: 'slug', value: 'page-123' }) // page (resourceLocator)
				.mockReturnValueOnce(['change_detected']) // events
				.mockReturnValueOnce(true) // simplifyOutput
				.mockReturnValueOnce(false); // sendTestOnListen

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

describe('PageCrawlTrigger signing secret', () => {
	const node = new PageCrawlTrigger();
	const hooks = (webhookData: IDataObject, response: unknown) =>
		({
			getWorkflowStaticData: jest.fn().mockReturnValue(webhookData),
			getNodeWebhookUrl: jest.fn().mockReturnValue('https://n8n.example.com/webhook/pagecrawl'),
			getNodeParameter: jest.fn((name: string, fallback: unknown) =>
				name === 'workspace' ? { mode: 'list', value: '1' } : name === 'sendTestOnListen' ? false : fallback),
			helpers: { httpRequestWithAuthentication: { call: jest.fn().mockResolvedValue(response) } },
		}) as unknown as IHookFunctions;

	it('is stored when the webhook is created', async () => {
		const data: IDataObject = {};
		await node.webhookMethods.default.create.bind(hooks(data, { id: 5, signing_secret: 's3cret' }))();
		expect(data).toEqual({ webhookId: 5, signingSecret: 's3cret' });
	});

	it('is picked up for an existing webhook, and forgotten on delete', async () => {
		const data: IDataObject = { webhookId: 5 };
		const exists = await node.webhookMethods.default.checkExists.bind(
			hooks(data, [{ id: 5, target_url: 'https://n8n.example.com/webhook/pagecrawl', signing_secret: 's3cret' }]),
		)();
		expect(exists).toBe(true);
		expect(data.signingSecret).toBe('s3cret');

		await node.webhookMethods.default.delete.bind(hooks(data, {}))();
		expect(data).toEqual({});
	});
});

describe('PageCrawlTrigger Webhook Handler', () => {
	const SECRET = 'a'.repeat(64);
	let node: PageCrawlTrigger;
	let mockWebhookFunctions: jest.Mocked<IWebhookFunctions>;
	let staticData: IDataObject;
	let response: { status: jest.Mock; json: jest.Mock };

	// A delivery as PageCrawl sends it: the raw JSON body and its signature headers.
	function deliver(body: IDataObject, { secret = SECRET, timestamp = Math.floor(Date.now() / 1000), raw }: { secret?: string; timestamp?: number; raw?: string } = {}) {
		const rawBody = raw ?? JSON.stringify(body);
		const signature = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
		mockWebhookFunctions.getRequestObject.mockReturnValue({ body, rawBody: Buffer.from(rawBody) } as any);
		mockWebhookFunctions.getHeaderData.mockReturnValue({
			'x-pagecrawl-signature': `sha256=${signature}`,
			'x-pagecrawl-timestamp': String(timestamp),
		});
	}

	beforeEach(() => {
		node = new PageCrawlTrigger();
		staticData = { webhookId: 77, signingSecret: SECRET };
		response = { status: jest.fn(), json: jest.fn() };
		response.status.mockReturnValue(response);
		mockWebhookFunctions = {
			getRequestObject: jest.fn(),
			getHeaderData: jest.fn().mockReturnValue({}),
			getResponseObject: jest.fn().mockReturnValue(response),
			getWorkflowStaticData: jest.fn().mockReturnValue(staticData),
			getNodeParameter: jest.fn(),
			helpers: {
				returnJsonArray: jest.fn().mockImplementation((data) => [{ json: data }]),
				httpRequestWithAuthentication: { call: jest.fn() },
			},
		} as unknown as jest.Mocked<IWebhookFunctions>;
	});

	it('should process a signed change event', async () => {
		deliver({ id: 1, title: 'Test Check', status: 'changed', changed_at: '2024-01-01T00:00:00Z', difference: 10 });
		mockWebhookFunctions.getNodeParameter
			.mockReturnValueOnce(false) // simplifyOutput
			.mockReturnValueOnce(['change_detected']); // events

		const result = await node.webhook.bind(mockWebhookFunctions)();

		expect(result.workflowData?.length).toBeGreaterThan(0);
		expect(response.status).not.toHaveBeenCalled();
	});

	it('should simplify output when option is enabled', async () => {
		const webhookBody = {
			id: 1,
			title: 'Test Check',
			status: 'changed',
			changed_at: '2024-01-01T00:00:00Z',
			difference: 10,
			human_difference: '10%',
			page: { url: 'https://example.com', name: 'Example Page', link: 'https://pagecrawl.io/pages/1' },
			contents: 'New content',
		};
		deliver(webhookBody);
		mockWebhookFunctions.getNodeParameter
			.mockReturnValueOnce(true) // simplifyOutput
			.mockReturnValueOnce(['change_detected']); // events

		await node.webhook.bind(mockWebhookFunctions)();

		expect(mockWebhookFunctions.helpers.returnJsonArray).toHaveBeenCalledWith(
			expect.objectContaining({
				id: 1,
				changedAt: '2024-01-01T00:00:00Z',
				humanDifference: '10%',
				pageUrl: 'https://example.com',
				pageName: 'Example Page',
				pageLink: 'https://pagecrawl.io/pages/1',
				contents: 'New content',
			})
		);
	});

	it('should verify the exact bytes received, not a re-serialised body', async () => {
		// PHP escapes slashes; the signature covers those bytes.
		deliver({ url: 'https://example.com/a' }, { raw: '{"url":"https:\\/\\/example.com\\/a"}' });
		mockWebhookFunctions.getNodeParameter.mockReturnValueOnce(false).mockReturnValueOnce(['change_detected']);

		const result = await node.webhook.bind(mockWebhookFunctions)();

		expect(result.workflowData).toBeDefined();
	});

	it.each([
		['unsigned', () => mockWebhookFunctions.getRequestObject.mockReturnValue({ body: { id: 1 }, rawBody: Buffer.from('{"id":1}') } as any)],
		['signed with another secret', () => deliver({ id: 1 }, { secret: 'b'.repeat(64) })],
		['replayed after five minutes', () => deliver({ id: 1 }, { timestamp: Math.floor(Date.now() / 1000) - 301 })],
	])('should refuse a delivery that is %s', async (_label, prepare) => {
		prepare();

		const result = await node.webhook.bind(mockWebhookFunctions)();

		expect(result).toEqual({ noWebhookResponse: true });
		expect(response.status).toHaveBeenCalledWith(401);
		expect(mockWebhookFunctions.helpers.returnJsonArray).not.toHaveBeenCalled();
	});

	it('should fetch and keep the secret for a workflow activated before verification', async () => {
		delete staticData.signingSecret;
		(mockWebhookFunctions.helpers.httpRequestWithAuthentication.call as jest.Mock).mockResolvedValue({ id: 77, signing_secret: SECRET });
		deliver({ id: 1 });
		mockWebhookFunctions.getNodeParameter.mockReturnValueOnce(false).mockReturnValueOnce(['change_detected']);

		const result = await node.webhook.bind(mockWebhookFunctions)();

		expect(result.workflowData).toBeDefined();
		expect(staticData.signingSecret).toBe(SECRET);
		expect(mockWebhookFunctions.helpers.httpRequestWithAuthentication.call).toHaveBeenCalledWith(
			mockWebhookFunctions,
			'pageCrawlApi',
			expect.objectContaining({ method: 'GET', url: 'https://pagecrawl.io/api/hooks/77' })
		);
	});

	it('should refuse deliveries while the secret cannot be read', async () => {
		delete staticData.signingSecret;
		(mockWebhookFunctions.helpers.httpRequestWithAuthentication.call as jest.Mock).mockRejectedValue(new Error('offline'));
		deliver({ id: 1 });

		const result = await node.webhook.bind(mockWebhookFunctions)();

		expect(result).toEqual({ noWebhookResponse: true });
		expect(response.status).toHaveBeenCalledWith(401);
	});
});
