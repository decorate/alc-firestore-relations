import {initializeApp} from 'firebase/app'
import {
	getFirestore,
	doc,
	setDoc,
	connectFirestoreEmulator
} from 'firebase/firestore'

export class SetUpFirestore {

	constructor(config: IFirestoreConfig) {
		if(window.alcFirebase === undefined) {
			window.alcFirebase = initializeApp({...config})

			window.alcDB = getFirestore(window.alcFirebase)
			if(config.prefix) {
				window.alcPrefix = config.prefix
			}

			connectFirestoreEmulator(window.alcDB, 'localhost', 9092)
		}
	}
}