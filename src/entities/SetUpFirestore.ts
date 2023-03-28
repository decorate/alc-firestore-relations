import {initializeApp} from 'firebase/app'
import {
	getFirestore,
	connectFirestoreEmulator
} from 'firebase/firestore'
import {IFirestoreConfig} from '../interfaces/IFirestoreConfig'

export class SetUpFirestore {

	constructor(config: IFirestoreConfig) {
		if(window.alcFirebase === undefined) {
			window.alcFirebase = initializeApp({...config})

			window.alcDB = getFirestore(window.alcFirebase)
			if(config.prefix) {
				window.alcPrefix = config.prefix
			}

			if(config?.test) {
				connectFirestoreEmulator(window.alcDB, config?.url || 'localhost', config?.port || 9092)
			}
		}
	}
}
