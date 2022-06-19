import logger from './logger'
import Redis from 'ioredis'
import ServerSession from './ServerSession'

class ServerSessionManager {
  #redis = null

  #getRedis() {
    if (!this.#redis) {
      this.#redis = new Redis()
    }

    return this.#redis
  }

  async getSession(sessionId) {
    const redis = this.#getRedis()
    const data = await redis.get(sessionId)
    logger.info(`ServerSessionManager#getSession(${sessionId}) ... ${data}`)
    if (data) {
      return new ServerSession(JSON.parse(data))
    } else {
      return new ServerSession(ServerSession.createData(sessionId))
    }
  }

  async setSession(session) {
    if (session) {
      const redis = this.#getRedis()
      logger.info(`ServerSessionManager#setSession(${JSON.stringify(session.data())})`)
      await redis.set(session.sessionId, JSON.stringify(session.data()))
    }
  }
}

export default new ServerSessionManager()
