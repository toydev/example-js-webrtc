import ServerSessionManager from 'webrtc/server/ServerSessionManager'
import logger from 'webrtc/server/logger'

async function get(req, res) {
  const { clientId, sessionId } = req.query

  logger.info(`start handler: ${req.method} ${req.url}(${clientId},${sessionId})`)

  const session = await ServerSessionManager.getSession(sessionId)
  const client = session.setClient(clientId)
  if (client.started) {
    session.reset()
  }
  client.started = true
  await ServerSessionManager.setSession(session)

  const result = {
    clientType: client?.clientType ?? "Unknown",
    sessionSeqId: session.sessionSeqId,
  }
  logger.info(`end handler: ${JSON.stringify(result)}`)
  res.status(200).json(result)
}

export default async function handler(req, res) {
  switch (req.method) {
    case "GET":
      await get(req, res)
      break
    default:
      res.status(404).json()
  }
}
