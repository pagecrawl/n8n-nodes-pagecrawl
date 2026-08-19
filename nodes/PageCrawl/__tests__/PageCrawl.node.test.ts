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

		it('should have JSON content type headers and API client header', () => {
			expect(node.description.requestDefaults?.headers).toEqual({
				Accept: 'application/json',
				'Content-Type': 'application/json',
				'X-Api-Client': expect.stringMatching(/^n8n\/\d+\.\d+\.\d+$/),
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
		it('should call correct endpoint for get operation', async () => {
			mockExecuteFunctions.getNodeParameter
				.mockReturnValueOnce('page') // resource
				.mockReturnValueOnce('get') // operation
				.mockReturnValueOnce({ mode: 'slug', value: '123' }) // pageId (resourceLocator)
				.mockReturnValueOnce({ mode: 'id', value: '456' }) // workspace (resourceLocator)
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
					qs: { workspace_id: '456' },
				})
			);
		});

		it('should call correct endpoint for delete operation', async () => {
			mockExecuteFunctions.getNodeParameter
				.mockReturnValueOnce('page') // resource
				.mockReturnValueOnce('delete') // operation
				.mockReturnValueOnce({ mode: 'slug', value: '123' }) // pageId (resourceLocator)
				.mockReturnValueOnce({ mode: 'id', value: '456' }); // workspace (resourceLocator)

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
					qs: { workspace_id: '456' },
				})
			);
		});

		it('should call correct endpoint for runCheckNow operation', async () => {
			mockExecuteFunctions.getNodeParameter
				.mockReturnValueOnce('page') // resource
				.mockReturnValueOnce('runCheckNow') // operation
				.mockReturnValueOnce({ mode: 'slug', value: '123' }) // pageId (resourceLocator)
				.mockReturnValueOnce({ mode: 'id', value: '456' }) // workspace (resourceLocator)
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
					qs: { workspace_id: '456' },
				})
			);
		});
	});

	describe('Error Handling', () => {
		it('should continue on fail when configured', async () => {
			mockExecuteFunctions.getNodeParameter
				.mockReturnValueOnce('page') // resource
				.mockReturnValueOnce('get') // operation
				.mockReturnValueOnce({ mode: 'slug', value: '123' }) // pageId (resourceLocator)
				.mockReturnValueOnce({ mode: 'id', value: '456' }) // workspace (resourceLocator)
				.mockReturnValueOnce({}); // options

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

describe('PageCrawl Node Additional Fields', () => {
	let node: PageCrawl;

	beforeEach(() => {
		node = new PageCrawl();
	});

	const getAdditionalFieldsOptions = () => {
		const additionalFields = node.description.properties.find(
			(p) => p.name === 'additionalFields' && p.displayOptions?.show?.operation?.includes('create')
		);
		return (additionalFields as any)?.options || [];
	};

	describe('Notification Options Fields', () => {
		it('should have notifications field for channel selection', () => {
			const options = getAdditionalFieldsOptions();
			const field = options.find((f: any) => f.name === 'notifications');

			expect(field).toBeDefined();
			expect(field.type).toBe('multiOptions');
			expect(field.default).toEqual([]);
		});

		it('should have notification_emails field', () => {
			const options = getAdditionalFieldsOptions();
			const field = options.find((f: any) => f.name === 'notification_emails');

			expect(field).toBeDefined();
			expect(field.type).toBe('string');
			expect(field.default).toBe('');
		});
	});

	describe('Advanced Preferences Fields', () => {
		it('should have check_always field', () => {
			const options = getAdditionalFieldsOptions();
			const field = options.find((f: any) => f.name === 'check_always');

			expect(field).toBeDefined();
			expect(field.type).toBe('boolean');
			expect(field.default).toBe(false);
		});

		it('should have auth_username field', () => {
			const options = getAdditionalFieldsOptions();
			const field = options.find((f: any) => f.name === 'auth_username');

			expect(field).toBeDefined();
			expect(field.type).toBe('string');
			expect(field.default).toBe('');
		});

		it('should have auth_password field with password type', () => {
			const options = getAdditionalFieldsOptions();
			const field = options.find((f: any) => f.name === 'auth_password');

			expect(field).toBeDefined();
			expect(field.type).toBe('string');
			expect(field.typeOptions?.password).toBe(true);
			expect(field.default).toBe('');
		});

		it('should have location field', () => {
			const options = getAdditionalFieldsOptions();
			const field = options.find((f: any) => f.name === 'location');

			expect(field).toBeDefined();
			expect(field.type).toBe('options');
			expect(field.default).toBe('random1');
		});

		it('should have user_agent field', () => {
			const options = getAdditionalFieldsOptions();
			const field = options.find((f: any) => f.name === 'user_agent');

			expect(field).toBeDefined();
			expect(field.type).toBe('string');
			expect(field.default).toBe('');
		});
	});

	describe('Other Fields', () => {
		it('should have skip_first_notification field', () => {
			const options = getAdditionalFieldsOptions();
			const field = options.find((f: any) => f.name === 'skip_first_notification');

			expect(field).toBeDefined();
			expect(field.type).toBe('boolean');
			expect(field.default).toBe(false);
		});

		it('should have ignore_duplicates field', () => {
			const options = getAdditionalFieldsOptions();
			const field = options.find((f: any) => f.name === 'ignore_duplicates');

			expect(field).toBeDefined();
			expect(field.type).toBe('boolean');
			expect(field.default).toBe(false);
		});

		it('should have tags field', () => {
			const options = getAdditionalFieldsOptions();
			const field = options.find((f: any) => f.name === 'tags');

			expect(field).toBeDefined();
			expect(field.type).toBe('string');
			expect(field.default).toBe('');
		});
	});

	describe('Resource Locator Fields', () => {
		it('should have workspace field as top-level resourceLocator', () => {
			const field = node.description.properties.find((p) => p.name === 'workspace');

			expect(field).toBeDefined();
			expect(field?.type).toBe('resourceLocator');
			expect(field?.required).toBe(true); // Required - user must select workspace
		});

		it('should have folder_id field as resourceLocator', () => {
			const options = getAdditionalFieldsOptions();
			const field = options.find((f: any) => f.name === 'folder_id');

			expect(field).toBeDefined();
			expect(field.type).toBe('resourceLocator');
		});

		it('should have template_id field as resourceLocator', () => {
			const options = getAdditionalFieldsOptions();
			const field = options.find((f: any) => f.name === 'template_id');

			expect(field).toBeDefined();
			expect(field.type).toBe('resourceLocator');
		});

		it('should have auth_id field as resourceLocator', () => {
			const options = getAdditionalFieldsOptions();
			const field = options.find((f: any) => f.name === 'auth_id');

			expect(field).toBeDefined();
			expect(field.type).toBe('resourceLocator');
		});
	});

	describe('Field Availability', () => {
		it('should have additionalFields available for create operation', () => {
			const additionalFields = node.description.properties.find(
				(p) => p.name === 'additionalFields' && p.displayOptions?.show?.operation?.includes('create')
			);
			expect(additionalFields).toBeDefined();
		});

		it('should have additionalFields available for update operation', () => {
			const additionalFields = node.description.properties.find(
				(p) => p.name === 'additionalFields' && p.displayOptions?.show?.operation?.includes('update')
			);
			expect(additionalFields).toBeDefined();
		});
	});
});
describe('PageCrawl simple create request building', () => {
	let node: PageCrawl;
	let mockExecuteFunctions: jest.Mocked<IExecuteFunctions>;
	let request: jest.Mock;

	/** Resolve node parameters by name so the tests do not depend on read order. */
	const withParams = (params: Record<string, unknown>) => {
		mockExecuteFunctions.getNodeParameter = jest
			.fn()
			.mockImplementation((name: string, _i: number, fallback?: unknown) =>
				name in params ? params[name] : fallback,
			) as never;
	};

	const sentOptions = () => request.mock.calls[0][2] as Record<string, any>;

	beforeEach(() => {
		node = new PageCrawl();
		request = jest.fn().mockResolvedValue({ id: 1 });
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
				httpRequestWithAuthentication: { call: request },
				prepareBinaryData: jest.fn(),
				constructExecutionMetaData: jest.fn().mockImplementation((items) => items),
			},
		} as unknown as jest.Mocked<IExecuteFunctions>;
	});

	const base = {
		resource: 'page',
		operation: 'createSimple',
		url: 'https://example.com/widget',
		name: 'Widget',
		workspace: { mode: 'id', value: '456' },
		additionalFields: {},
	};

	it('sends tracking_mode, which is what track-simple actually reads', async () => {
		withParams({ ...base, trackingType: 'price' });
		await node.execute.bind(mockExecuteFunctions)();

		const body = sentOptions().body;
		// `type` is not an input on /api/track-simple; sending it silently
		// produced a plain full-page monitor.
		expect(body.type).toBeUndefined();
		expect(body.tracking_mode).toBe('price');
	});

	it('maps the full page modes onto their tracking modes', async () => {
		const cases: Array<[string, string]> = [
			['*', 'fullpage'],
			['content', 'content_only'],
			['article', 'reader'],
		];
		for (const [mode, expected] of cases) {
			request.mockClear();
			withParams({ ...base, trackingType: 'fullpage', fullpageMode: mode });
			await node.execute.bind(mockExecuteFunctions)();
			expect(sentOptions().body.tracking_mode).toBe(expected);
		}
	});

	it('maps selector-based tracking onto the specific_* modes', async () => {
		withParams({ ...base, trackingType: 'text', selector: '.price' });
		await node.execute.bind(mockExecuteFunctions)();
		expect(sentOptions().body).toMatchObject({
			tracking_mode: 'specific_text',
			selector: '.price',
		});
	});

	it('fails loudly when a selector-based mode has no selector', async () => {
		withParams({ ...base, trackingType: 'number', selector: '' });
		await expect(node.execute.bind(mockExecuteFunctions)()).rejects.toThrow(/selector is required/i);
	});

	it('sends the workspace as a query param, not in the body', async () => {
		withParams({ ...base, trackingType: 'price' });
		await node.execute.bind(mockExecuteFunctions)();

		const options = sentOptions();
		// SetTeamAndWorkspace only reads the query string.
		expect(options.qs).toEqual({ workspace_id: '456' });
		expect(options.body.workspace_id).toBeUndefined();
	});

	it('forwards the folder and template it offers in the UI', async () => {
		withParams({
			...base,
			trackingType: 'price',
			additionalFields: {
				folder_id: { mode: 'list', value: '12' },
				template_id: { mode: 'list', value: '34' },
			},
		});
		await node.execute.bind(mockExecuteFunctions)();

		expect(sentOptions().body).toMatchObject({ folder_id: '12', template_id: '34' });
	});
});
