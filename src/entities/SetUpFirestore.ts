import {initializeApp} from 'firebase/app'
import {
	getFirestore,
	connectFirestoreEmulator,
} from 'firebase/firestore'
import {connectAuthEmulator, getAuth} from 'firebase/auth'
import {IFirestoreConfig} from '../interfaces/IFirestoreConfig'

export class SetUpFirestore {

	constructor(config: IFirestoreConfig) {
		if(window.alcFirebase === undefined) {
			window.alcFirebase = initializeApp({...config})

			window.alcAuth = getAuth()

			window.alcDB = getFirestore(window.alcFirebase)
			if(config.prefix) {
				window.alcPrefix = config.prefix
			}

			if(config?.authTest) {
				connectAuthEmulator(window.alcAuth, config?.authUrl || 'localhost:9099', {disableWarnings: config?.disableWarning || false})
			}

			if(config?.test) {
				connectFirestoreEmulator(window.alcDB, config?.url || 'localhost', config?.port || 9092)
			}
		}
	}
}
