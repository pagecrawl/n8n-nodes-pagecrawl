import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class PageCrawlApi implements ICredentialType {
	name = 'pageCrawlApi';
	displayName = 'PageCrawl.io API';
	documentationUrl = 'https://pagecrawl.io/docs/api';
	properties: INodeProperties[] = [
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Your PageCrawl.io API token. API access requires a paid plan. You can find your token in Settings > API.',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://pagecrawl.io',
			description: 'The base URL for the PageCrawl.io API',
			hint: 'Use https://pagecrawl.io for production',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/api/user',
			method: 'GET',
		},
		rules: [
			{
				type: 'responseSuccessBody',
				properties: {
					key: 'id',
					value: undefined,
					message: 'Authentication successful',
				},
			},
		],
	};
}