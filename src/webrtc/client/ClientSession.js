import axios from 'axios'

import ClientSeqDatas from './ClientSeqDatas'
import ClientSessionException from './ClientSessionException'

export default class ClientSession {
  #clientId
  #sessionId
  #clientType
  #sessionSeqId
  #connection
  #channel
  #seqDatas
  #connected = false
  #onopen
  #onclose
  #onmessage

  constructor(clientId, sessionId) {
    this.#clientId = clientId
    this.#sessionId = sessionId
  }

  async connect() {
    // 再接続ループ
    while (true) {
      this.close()

      // クライアントタイプを決定する。
      await this.#start()

      // クライアントタイプに応じた接続処理を行う。
      await this.#connect()

      // 接続ポーリングループ
      while (true) {
        await new Promise(resolve => setTimeout(resolve, 1000))

        const responseData = await this.#getSeqData()
        if (responseData.continue) {
          this.#seqDatas.pushAll(responseData.seqDatas)
        } else {
          break
        }

        const result = await this.#polling()
        if (!result) {
          console.log("===== polling finish =====")
          return
        }
      }
    }
  }

  async close() {
    if (this.#connection) {
      this.#connection.close()
      this.#connection = null
    }

    this.#clientType = null
    this.#channel = null
    this.#seqDatas = new ClientSeqDatas()
    this.#setConnected(false)
  }

  isConnected() {
    return this.#connected
  }

  send(message) {
    if (this.isConnected) {
      this.#channel.send(message)
      return true
    } else {
      return false
    }
  }

  set onopen(handler) {
    this.#onopen = handler
  }

  set onclose(handler) {
    this.#onclose = handler
  }

  set onmessage(handler) {
    this.#onmessage = handler
  }

  async #connect() {
    switch (this.#clientType) {
      case "Sender":
        await this.#connectForSender()
        break
      case "Receiver":
        await this.#connectForReceiver()
        break
      default:
        throw new ClientSessionException()
    }
  }

  async #connectForSender() {
    this.#connection = new RTCPeerConnection({
      offerToReceiveAudio: 0,
      offerToReceiveVideo: 0,
      iceServers: [{
        urls: "stun:stun.l.google.com:19302"
      }]
    })

    this.#channel = this.#connection.createDataChannel("channel")
    this.#channel.onmessage = (e) => this.#handleOnmessage(e)
    this.#channel.onopen = () => this.#handleOnopen()
    this.#channel.onclose = () => this.#handleOnclose()

    this.#connection.onicecandidate = e => this.#sendCandidate(e)
    this.#connection.onicegatheringstatechange = e => {
      if (e.target.iceGatheringState === "complete") {
        this.#sendCompleteCandidates()
      }
    }
    this.#connection.connectionstatechange = e => {
      console.log(`connectionstate: ${this.#connection.connectionState}`)
    }

    const localDescription = await this.#connection.createOffer()
    await this.#sendLocalDescription(localDescription)
    await this.#connection.setLocalDescription(localDescription)
  }

  async #connectForReceiver() {
    this.#connection = new RTCPeerConnection({
      offerToReceiveAudio: 0,
      offerToReceiveVideo: 0,
      iceServers: [{
        urls: "stun:stun.l.google.com:19302"
      }]
    })

    this.#connection.onicecandidate = e => this.#sendCandidate(e)
    this.#connection.onicegatheringstatechange = e => {
      if (e.target.iceGatheringState === "complete") {
        this.#sendCompleteCandidates()
      }
    }
    this.#connection.connectionstatechange = e => {
      console.log(`connectionstate: ${this.#connection.connectionState}`)
    }

    this.#connection.ondatachannel = e => {
      this.#channel = e.channel
      this.#channel.onmessage = (e) => this.#handleOnmessage(e)
      this.#channel.onopen = () => this.#handleOnopen()
      this.#channel.onclose = () => this.#handleOnclose()
    }
  }

  async #polling() {
    switch (this.#clientType) {
      case "Sender":
        return await this.#pollingForSender()
      case "Receiver":
        return await this.#pollingForReceiver()
      default:
        throw new ClientSessionException()
    }
  }

  async #pollingForSender() {
    return await this.#seqDatas.forEach(async (seqDataType, seqData) => {
      switch (seqDataType) {
        case "localDescription":
          await this.#connection.setRemoteDescription(seqData)
          break
        case "candidate":
          await this.#connection.addIceCandidate(seqData)
          break
        case "completeCandidates":
          console.log("===== completeCandidates =====")
          return false
      }

      return true
    })
  }

  async #pollingForReceiver() {
    return await this.#seqDatas.forEach(async (seqDataType, seqData) => {
      switch (seqDataType) {
        case "localDescription":
          await this.#connection.setRemoteDescription(seqData)
          const localDescription = await this.#connection.createAnswer()
          await this.#sendLocalDescription(localDescription)
          await this.#connection.setLocalDescription(localDescription)
          break
        case "candidate":
          await this.#connection.addIceCandidate(seqData)
          break
        case "completeCandidates":
          return false
      }

      return true
    })
  }

  #setConnected(value) {
    if (this.#connected != value) {
      this.#connected = value
      if (value) {
        if (this.#onopen) this.#onopen()
      } else {
        if (this.#onclose) this.#onclose()
      }
    }
  }

  #handleOnmessage(e) {
    if (this.#onmessage) {
      this.#onmessage(e)
    }
  }

  #handleOnopen() {
    this.#setConnected(true)
  }

  #handleOnclose() {
    this.#setConnected(false)
    this.connect()
  }

  async #sendLocalDescription(localDescription) {
    await this.#postSeqData("localDescription", localDescription)
  }

  #sendCandidate(e) {
    if (e.candidate) {
      this.#postSeqData("candidate", e.candidate)
    }
  }

  #sendCompleteCandidates() {
    this.#postSeqData("completeCandidates", true)
  }

  // サーバとの通信

  async #start() {
    const response = await axios.get("/api/webrtc/start", {
      params: {
        clientId: this.#clientId,
        sessionId: this.#sessionId,
      }
    })

    if (response.status == 200) {
      this.#clientType = response.data.clientType
      this.#sessionSeqId = response.data.sessionSeqId
    }
  }

  async #postSeqData(seqDataType, seqData) {
    console.log(`ClientSession#postSeqData: sessionId=${this.#sessionId},${seqDataType}, ${seqData}`)
    await axios.post("/api/webrtc/seqData", {
      clientId: this.#clientId,
      sessionId: this.#sessionId,
      sessionSeqId: this.#sessionSeqId,
      seqDataType,
      seqData,
    })
  }

  async #getSeqData() {
    const response = await axios.get("/api/webrtc/seqData", {
      "params": {
        clientId: this.#clientId,
        sessionId: this.#sessionId,
        sessionSeqId: this.#sessionSeqId,
        seqNo: this.#seqDatas.length,
      }
    })

    if (response.status == 200) {
      return response.data
    } else {
      return null
    }
  }
}
