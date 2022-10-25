import {MockResponse} from 'axios-mock-server'

const users = {
	data: [
		{
			id: '101',
			name: 'test',
			app_email: 'test@email',
			comments: [
				{ title: 'Typescript', body: 'body' },
				{ title: 'javascript', body: 'Js' }
			],
			user_detail: {
				age: 32, address: '葛飾区'
			},
			user_posts: [{ type: 2, title: 'C#' }]
		},
		{
			id: '201', name: 'test2',
			app_email: 'test2@email',
			comments: [
				{ title: 'Typescript', body: 'body' },
				{ title: 'javascript', body: 'Js' }
			],
			user_detail: { age: 32, address: '東京都' }
			,
			user_posts: [{ type: 2, title: 'C#' }]
		}],
	"total": 50,
	"per_page": 15,
	"current_page": 1,
	"last_page": 4,
	"first_page_url": "http://localhost:8081/users?page=1",
	"last_page_url": "http://localhost:8081/users?page=4",
	"next_page_url": "http://localhost:8081/users?page=2",
	"prev_page_url": null,
	"path": "http://localhost:8081",
	"from": 1,
	"to": 15,
}

const page2 = {
	data: [
		{
			id: '301',
			name: 'test3',
			app_email: 'test3@email',
			comments: [
				{ title: 'Typescript', body: 'body' },
				{ title: 'javascript', body: 'Js' }
			],
			user_detail: {
				age: 32, address: '葛飾区'
			},
			user_posts: [{ type: 2, title: 'C#' }]
		},
		{
			id: '401', name: 'test2',
			app_email: 'test4@email',
			comments: [
				{ title: 'Typescript', body: 'body' },
				{ title: 'javascript', body: 'Js' }
			],
			user_detail: { age: 32, address: '東京都' }
			,
			user_posts: [{ type: 2, title: 'C#' }]
		}],
	"total": 50,
	"per_page": 15,
	"current_page": 1,
	"last_page": 4,
	"first_page_url": "http://localhost:8081/users?page=1",
	"last_page_url": "http://localhost:8081/users?page=4",
	"next_page_url": "http://localhost:8081/users?page=3",
	"prev_page_url": null,
	"path": "http://localhost:8081",
	"from": 1,
	"to": 15,
}

export default {
	get: (d: any) => {
		if(!Object.keys(d.params).length) {
			return [200, users] as MockResponse
		} else {
			return [200, page2] as MockResponse
		}
	}
}