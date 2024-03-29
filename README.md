

  
## alc-firestore-relations
### Installation  
With yarn:
  
 	yarn add @team-decorate/alc-firestore-relations
 	
### Usage  
  
#### Model create  
```typescript  
import {FModel} from '@team-decorate/alc-firesore-reations'  
import Post from './models/Post'  
import Comment from './models/Comment'  
  
/*
* Only those added to fillable will be sent
*/
const FILLABLE = [  
 'id', 'name', 'email', 'password', 'type'
 ]  
  
class User extends FModel {  

  id: number = 0
  name: string = ''
  email: string = ''
  password: string = ''
  type: number = 0
  posts: Array<Post> = []
  userComments: Array<Comment> = []

  constructor(data?: IIndextable) {  
	 super()         
	 //change access primary key
	 this.primaryKey = 'uid'
	 
	 this.fillable = FILLABLE 
	 //presents is send even if the field is empty 
	 this.presents = ['type']  
	 //sender is allows non-empty value
	 this.sender = this.fillable.filter(x => ['posts', 'userComments'].every(v => v != x))
	 
	 this.arrayMap(  
		 new ArrayMappable(Post), 
		 new ArrayMappable(Comment).bind('userComments')
	) 
	
	if(data) {
	    this.data = data
	}
    }
    
    // 1:n relation
    _posts() {
		return this.hasRelationships.hasMany(Post)
    }
    
    // 1 in subCollection relation
    _userComments() {
		return this.hasRelationships.hasManySub(Comment, 'user_comments')
    }
    
    // 1:1 relation
    _anyHasOne() {
        return this.hasRelationships.hasOne(Any)
    }
    
    // 1:1 relation
    _anyBelongsTo() {
        return this.hasRelationships.beongsTo(Any)
    }
}  
```  
  
#### How to use
```json
	#user firestore response
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
         this.user = await User.query()
             .with(['_posts', '_userComments'])
             .find(1)

         expect(this.user.id).toBe(1)
         expect(this.user.name).toBe('test-user')
         expect(this.user.posts.length).toBe(2)
         expect(this.user.userComments.length).toBe(2)
         
         const posts = this.user._posts().get()
         expect(posts.length).toBe(2)
     },

     async post() {
         /*
         * Added to the fillable and the one containing the value is sent and saved in firestore
         */
         await new User({
             name: 'A', email: 'test@mail.com',
             posts: [new Post({title: 'A+'})]
         }).save()
     }
	
  }
}  
```


### Overridable Property
|property|type
|:---|---:
|primaryKey|string

### Overridable Function  
  
| methods |value|description
|:---|---|---:
| beforePostable | null | Called before sending api
| afterPostable | res | Called after sending api

### Model Methods
|methods|args|output|type
|:---|----|---|---:
| getPostable |null|Object
|update|Object|null
|save|null|this|static
|query|null|AlcQuery|static
|collectionGroup|null|AlcQuery|static
|paginate|null|IPagenate|static
|hasRelationships|null|HasRelationships

### AlcQuery Methods
|methods|args|output
|:---|---|---:
|find|string|FModel?
|first|null|FModel?
|get|null|FModel[]
|with|Array<string or {key: string, query: any, relation?: string}>|AlcQuery
|where||
|limit||
|orderBy||
|startAt||
|startAfter||
|endAt||
|endAfter||
|toQuery|null|{log, stack, documentAll}|