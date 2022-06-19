import axios from 'axios'
import { parseCookies, setCookie } from 'nookies'
import { v4 as uuidv4 } from 'uuid'
import ClientSession from "./ClientSession"

class ClientSessionManager {
	getClientId() {
		const cookies = parseCookies()
		if (cookies['clientId']) {
			return cookies['clientId']
		} else {
			const clientId = uuidv4()
			setCookie(null, 'clientId', clientId, {
				maxAge: 24 * 60 * 60,
				path: '/',
			})
			return clientId
		}
	}

	getNewSessionId() {
		return uuidv4()
	}

	#sessions = new Map()

	getSession(sessionId) {
		if (!this.#sessions.has(sessionId)) {
			const session = new ClientSession(this.getClientId(), sessionId)
			this.#sessions.set(sessionId, session)
			return session
		} else {
			return this.#sessions.get(sessionId)
		}
	}
}

export default new ClientSessionManager()
