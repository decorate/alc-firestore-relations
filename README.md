

  
## alcts
### Installation  
With yarn:
  
 	yarn add @team-decorate/alcts  
 	
### Usage  
  
#### Model create  
```typescript  
import {Model, ArrayMappable} from '@team-decorate/alcts'  
import Post from './models/Post'  
import Comment from './models/Comment'  
  
/*
* Only those added to fillable will be sent
*/
const FILLABLE = [  
 'id', 'name', 'email', 'password', 'type'
 ]  
  
class User extends Model {  

  id: number = 0
  name: string = ''
  email: string = ''
  password: string = ''
  type: number = 0
  posts: Array<Post> = []
  userComments: Array<Comment> = []

  constructor(data: object = {}) {  
	 super()         
	 this.fillable = FILLABLE 
	 //presents is send even if the field is empty 
	 this.presents = ['type']  
	 
	 this.arrayMap(  
		 new ArrayMappable(Post), 
		 new ArrayMappable(Comment).bind('userComments')
	) 
	
	this.data = data
 }
}  
```  
  
#### How to use
```json
	#user api json response
	{
	  "id": 1,
	  "name": "test-user",
	  "email": "test@mail.com",
	  "type": 1,
	  "posts": [
		  {"id": 1, "text": "test post 1"},
		  {"id": 2, "text": "test post 2"}
	  ],
	  "user_comments": [
		  {"id": 1, "text": "test comment 1"},
		  {"id": 2, "text": "test comment 2"}
	  ]
	}
```
```js  
  
export default {  
 methods: { 
	 async get() {  
		 const { data } = await axios.get('/api/user')  
		 this.user = new User(data)
		 
		 this.user
		    .posts
		    .forEach(x => console.log(x instanceof Post)) //true
		 
		 for post in this.user.posts {
			 console.log(post.text)
			 console.log(post instanceof Post)// true
		 }

		for comment in this.user.userComments {
			console.log(comment instanceof Comment)// true
		}
	 },

	async post() {
		/*
		* What is added to fillable and contains value is sent
		*/
		const {data} = await this.user.post('/api/user')
		this.user.update(data)
	}
	
  }
}  
```


  
### Overridable Property  
  
| methods |value  |description|
|--|--|--|
| beforePostable | null | Called before sending api
| afterPostable | res | Called after sending api

### Model Methods
|methods|args  | output|
|--|--|--|
| getPostable |null  | Object|
|update|Object|null|
