import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class PageCrawlApi implements ICredentialType {
	name = 'pageCrawlApi';
	displayName = 'PageCrawl.io API';
	documentationUrl = 'https://pagecrawl.io/developers';
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
			description: 'Your PageCrawl.io API token, available on every plan. Create one at Settings > API.',
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
			baseURL: 'https://pagecrawl.io',
			url: '/api/user',
			method: 'GET',
		},
	};
}