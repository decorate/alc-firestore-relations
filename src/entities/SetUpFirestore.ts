import {initializeApp} from 'firebase/app'
import {
	getFirestore
} from 'firebase/firestore'

export class SetUpFirestore {

	constructor(config: IFirestoreConfig) {
		if(window.alcFirebase === undefined) {
			window.alcFirebase = initializeApp({...config})

			window.alcDB = getFirestore(window.alcFirebase)
			if(config.prefix) {
				window.alcPrefix = config.prefix
			}
		}
	}
}