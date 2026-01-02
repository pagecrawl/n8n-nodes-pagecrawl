import { PageCrawlApi } from '../PageCrawlApi.credentials';

describe('PageCrawlApi Credentials', () => {
	let credentials: PageCrawlApi;

	beforeEach(() => {
		credentials = new PageCrawlApi();
	});

	describe('Credential Definition', () => {
		it('should have correct name', () => {
			expect(credentials.name).toBe('pageCrawlApi');
		});

		it('should have correct display name', () => {
			expect(credentials.displayName).toBe('PageCrawl.io API');
		});

		it('should have documentation URL', () => {
			expect(credentials.documentationUrl).toBe('https://pagecrawl.io/docs/api');
		});
	});

	describe('Properties', () => {
		it('should have apiToken property', () => {
			const apiTokenProp = credentials.properties.find((p) => p.name === 'apiToken');
			expect(apiTokenProp).toBeDefined();
			expect(apiTokenProp?.type).toBe('string');
			expect(apiTokenProp?.required).toBe(true);
			expect(apiTokenProp?.typeOptions?.password).toBe(true);
		});

		it('should have exactly 1 property (only API token)', () => {
			expect(credentials.properties).toHaveLength(1);
		});
	});

	describe('Authentication', () => {
		it('should use generic authentication type', () => {
			expect(credentials.authenticate.type).toBe('generic');
		});

		it('should set Bearer token in Authorization header', () => {
			expect(credentials.authenticate.properties.headers).toEqual({
				Authorization: '=Bearer {{$credentials.apiToken}}',
			});
		});
	});

	describe('Credential Test', () => {
		it('should have test configuration', () => {
			expect(credentials.test).toBeDefined();
		});

		it('should test against /api/user endpoint', () => {
			expect(credentials.test.request.url).toBe('/api/user');
			expect(credentials.test.request.method).toBe('GET');
		});

		it('should use hardcoded pagecrawl.io base URL', () => {
			expect(credentials.test.request.baseURL).toBe('https://pagecrawl.io');
		});
	});
});
