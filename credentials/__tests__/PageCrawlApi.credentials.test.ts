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

		it('should have baseUrl property', () => {
			const baseUrlProp = credentials.properties.find((p) => p.name === 'baseUrl');
			expect(baseUrlProp).toBeDefined();
			expect(baseUrlProp?.type).toBe('string');
			expect(baseUrlProp?.default).toBe('https://pagecrawl.io');
		});

		it('should have exactly 2 properties', () => {
			expect(credentials.properties).toHaveLength(2);
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

		it('should use baseUrl from credentials', () => {
			expect(credentials.test.request.baseURL).toBe('={{$credentials.baseUrl}}');
		});

		it('should have success validation rule', () => {
			expect(credentials.test.rules).toBeDefined();
			expect(credentials.test.rules).toHaveLength(1);
			expect(credentials.test.rules?.[0].type).toBe('responseSuccessBody');
			expect((credentials.test.rules?.[0].properties as { key: string }).key).toBe('id');
		});
	});
});