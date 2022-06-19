import ServerSessionManager from 'webrtc/server/ServerSessionManager'
import logger from 'webrtc/server/logger'

// データを受信する。
async function post(req, res) {
  const { clientId, sessionId, sessionSeqId, seqDataType, seqData } = req.body

  logger.info(`start handler: ${req.method} ${req.url}(${clientId},${sessionSeqId},${sessionId},${seqDataType},${seqData})`)

  const session = await ServerSessionManager.getSession(sessionId)
  if (session.sessionSeqId === sessionSeqId) {
    const client = session.getClient(clientId)
    if (client != null) {
      client.addSeqData(seqDataType, seqData)
      await ServerSessionManager.setSession(session)

      const result = { continue: true }
      logger.info(`end handler: ${JSON.stringify(result)}`)
      res.status(200).json(result)
    } else {
      res.status(500).json({})
    }
  } else {
    const result = { continue: false }
    logger.info(`end handler: ${JSON.stringify(result)}`)
    res.status(200).json(result)
  }
}

// データを送信する。
async function get(req, res) {
  const { clientId, sessionId, sessionSeqId, seqNo } = req.query

  logger.info(`start handler: ${req.method} ${req.url}(${clientId},${sessionId},${sessionSeqId},${seqNo})`)

  const session = await ServerSessionManager.getSession(sessionId)
  if (session.sessionSeqId === sessionSeqId) {
    const client = session.getPartnerClient(clientId)
    if (client != null) {
      const result = { seqDatas: client.getSeqDatas(seqNo), continue: true }
      logger.info(`end handler: ${JSON.stringify(result)}`)
      res.status(200).json(result)
    } else {
      res.status(500).json({})
    }
  } else {
    const result = { continue: false }
    logger.info(`end handler: ${JSON.stringify(result)}`)
    res.status(200).json(result)
  }
}

export default async function handler(req, res) {
  logger.info(req.method)
  switch (req.method) {
    case "POST":
      await post(req, res)
      break
    case "GET":
      await get(req, res)
      break
    default:
      res.status(404).json()
  }
}
