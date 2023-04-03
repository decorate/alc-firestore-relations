import { FirebaseApp } from '@firebase/app'
import { Firestore } from '@firebase/firestore'

declare global {
	interface Window {
		alcFirebase: FirebaseApp
		alcDB: Firestore
		alcPrefix?: string,
		alcAuth: any
	}
}
