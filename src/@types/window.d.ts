import { FirebaseApp } from '@firebase/app'
import { Firestore } from '@firebase/firestore'
import {FirebaseStorage} from '@firebase/storage'

declare global {
	interface Window {
		alcFirebase: FirebaseApp
		alcDB: Firestore
		alcPrefix?: string,
		alcAuth: any,
		alcStorage: FirebaseStorage
	}
}
