import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useImmer } from 'use-immer'

import ClientSessionManager from 'webrtc/client/ClientSessionManager'

export default function Home() {
  const router = useRouter()
  const { sessionId } = router.query
  const [inputMessage, setInputMessage] = useState("")
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useImmer([])

  const receiveMessage = (message) => {
    setMessages(messages => setMessages(messages => { messages.push(`Other: ${message}`); return messages }))
  }

  const sendMessage = (sessionId, message) => {
    if (ClientSessionManager.getSession(sessionId).send(message)) {
      setMessages(messages => setMessages(messages => { messages.push(`You: ${message}`); return messages }))
      setInputMessage("")
    }
  }

  useEffect(() => {
    if (sessionId) {
      const f = async () => {
        // セッションを開始する。
        const session = ClientSessionManager.getSession(sessionId)
        session.onmessage = (e) => { receiveMessage(e.data) }
        session.onopen = () => { console.log("open"); setConnected(true) }
        session.onclose = () => { console.log("close"); setConnected(false) }
        await session.connect()
      }
      f()
    }
  }, [sessionId])

  return (
    <div>
      <input type="text" value={inputMessage} onChange={e => setInputMessage(e.target.value)} />
      <button onClick={() => sendMessage(sessionId, inputMessage)} disabled={!connected}>送信</button>
      <ul>
        {messages.map((i, index) => <li key={index.toString()}>{i}</li>)}
      </ul>
    </div>
  )
}
