import { IDataObject, IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { PageCrawl } from '../PageCrawl.node';

// Runs one item through execute() with the given parameters, recording every request.
async function run(params: IDataObject, apiResponse: unknown = {}, pushResponse: unknown = { changed: true }) {
	const node = new PageCrawl();
	const api = jest.fn().mockResolvedValue(apiResponse);
	const push = jest.fn().mockResolvedValue(pushResponse);
	const context = {
		getInputData: () => [{ json: {} }],
		getNode: () => ({ name: 'PageCrawl' }),
		continueOnFail: () => false,
		getNodeParameter: (name: string, _i: number, fallback?: unknown) =>
			name in params ? params[name] : fallback,
		helpers: {
			httpRequestWithAuthentication: { call: api },
			httpRequest: push,
			prepareBinaryData: jest.fn(async (data: Buffer, fileName: string, mimeType: string) => ({ fileName, mimeType, size: data.length })),
			constructExecutionMetaData: (items: unknown[]) => items,
		},
	} as unknown as IExecuteFunctions;
	const result = await node.execute.call(context);
	return { items: result[0], api, push, request: api.mock.calls[0]?.[2] };
}

const workspace = { mode: 'id', value: '7' };
const page = { mode: 'id', value: 'plans' };

describe('Get Many pages', () => {
	const pages = [{ id: 1 }, { id: 2 }, { id: 3 }];

	it('lists every active page with its newest values, up to the limit', async () => {
		const { items, request } = await run({ resource: 'page', operation: 'getMany', workspace, pageSet: 'active', limit: 2 }, pages);
		expect(request).toMatchObject({ method: 'GET', url: 'https://pagecrawl.io/api/pages', qs: { workspace_id: '7', folder: '*', simple: 1, take: 1 } });
		expect(items.map((item) => item.json.id)).toEqual([1, 2]);
	});

	it('lists paused pages in full when asked for all', async () => {
		const { items, request } = await run(
			{ resource: 'page', operation: 'getMany', workspace, pageSet: 'paused', returnAll: true, includeLatest: false },
			{ data: pages },
		);
		expect(request.qs).toEqual({ workspace_id: '7', disabled: 1 });
		expect(items).toHaveLength(3);
	});

	it('lists one folder', async () => {
		const { request } = await run({ resource: 'page', operation: 'getMany', workspace, pageSet: 'folder', folder: 'Competitors' }, []);
		expect(request.qs).toMatchObject({ folder: 'Competitors' });
	});
});

describe('Pause and Resume', () => {
	it.each([
		['pause', true],
		['resume', false],
	])('%s sets the state instead of toggling it', async (operation, disabled) => {
		const { request } = await run({ resource: 'page', operation, workspace, pageId: page }, { id: 1, disabled });
		expect(request).toMatchObject({ method: 'PUT', url: 'https://pagecrawl.io/api/pages/plans', qs: { workspace_id: '7' }, body: { disabled } });
	});
});

describe('Check diff formats', () => {
	it('returns the patch text', async () => {
		const { items, request } = await run({ resource: 'check', operation: 'getDiffPatch', workspace, pageId: page, checkId: 'latest' }, '--- a\n+++ b\n');
		expect(request.url).toBe('https://pagecrawl.io/api/pages/plans/checks/latest/diff.patch');
		expect(items[0].json).toEqual({ patch: '--- a\n+++ b\n', pageId: 'plans', checkId: 'latest' });
	});

	it('returns the before and after image, and says when it is only a placeholder', async () => {
		const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2]);
		const jpg = await run({ resource: 'check', operation: 'getBeforeAfter', workspace, pageId: page, checkId: '42' }, jpeg);
		expect(jpg.request.url).toBe('https://pagecrawl.io/api/pages/plans/checks/42/before-after.jpg');
		expect(jpg.items[0].binary?.data).toMatchObject({ fileName: 'before-after-plans-42.jpg', mimeType: 'image/jpeg' });
		expect(jpg.items[0].json.placeholder).toBe(false);

		const png = await run({ resource: 'check', operation: 'getBeforeAfter', workspace, pageId: page, checkId: '42' }, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d]));
		expect(png.items[0].binary?.data).toMatchObject({ mimeType: 'image/png' });
		expect(png.items[0].json.placeholder).toBe(true);
	});
});

describe('Data sources', () => {
	const ingestUrl = 'https://pagecrawl.io/api/ingest/data-a1b2c3d4e5f6';

	it('creates one with its named fields', async () => {
		const { request } = await run({
			resource: 'dataSource',
			operation: 'create',
			workspace,
			name: 'Competitor price',
			fields: { field: [{ label: 'price', type: 'price' }, { label: ' ', type: 'text' }] },
		});
		expect(request).toMatchObject({
			method: 'POST',
			url: 'https://pagecrawl.io/api/data-sources',
			qs: { workspace_id: '7' },
			body: { name: 'Competitor price', fields: [{ label: 'price', type: 'price' }] },
		});
	});

	it('pushes one value to the ingest URL without the API token', async () => {
		const { push, api } = await run({ resource: 'dataSource', operation: 'pushValue', ingestUrl, valueMode: 'single', value: '42' });
		expect(api).not.toHaveBeenCalled();
		expect(push).toHaveBeenCalledWith(expect.objectContaining({ method: 'POST', url: ingestUrl, body: { value: '42' } }));
	});

	it('pushes named fields', async () => {
		const { push } = await run({
			resource: 'dataSource',
			operation: 'pushValue',
			ingestUrl,
			valueMode: 'fields',
			values: { value: [{ name: 'price', value: '9.99' }, { name: 'stock', value: '12' }] },
		});
		expect(push.mock.calls[0][0].body).toEqual({ values: { price: '9.99', stock: '12' } });
	});

	it.each([
		['another host', 'https://example.com/api/ingest/data-a1b2'],
		['plain http', 'http://pagecrawl.io/api/ingest/data-a1b2'],
		['another PageCrawl path', 'https://pagecrawl.io/api/user'],
	])('never sends values to %s', async (_label, url) => {
		const error = await run({ resource: 'dataSource', operation: 'pushValue', ingestUrl: url, valueMode: 'single', value: '1' }).catch((e) => e);
		expect(error).toBeInstanceOf(NodeOperationError);
	});

	it('asks for at least one named value', async () => {
		const error = await run({ resource: 'dataSource', operation: 'pushValue', ingestUrl, valueMode: 'fields', values: {} }).catch((e) => e);
		expect(error).toBeInstanceOf(NodeOperationError);
	});

	it('hides the workspace for a push, which the ingest URL already names', () => {
		const workspaceField = new PageCrawl().description.properties.find((p) => p.name === 'workspace');
		expect(workspaceField?.displayOptions).toEqual({ hide: { resource: ['dataSource'], operation: ['pushValue'] } });
	});
});
