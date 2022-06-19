import { useRouter } from 'next/router'

import ClientSessionManager from 'webrtc/client/ClientSessionManager'

export default function Home() {
  const router = useRouter()

  return (
    <div>
      <button onClick={() => router.push(`/session/${ClientSessionManager.getNewSessionId()}`)}>開始</button>
    </div>
  )
}
