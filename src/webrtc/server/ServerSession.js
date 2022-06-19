import { v4 as uuidv4 } from 'uuid'
import v8 from 'v8'

import ServerClient from './ServerClient'

export default class ServerSession {
  #data

  constructor(data) {
    this.#data = data
  }

  data() {
    return v8.deserialize(v8.serialize(this.#data))
  }

  static createData(sessionId) {
    return {
      sessionId,
      sessionSeqId: uuidv4(),
      sender: {},
      receiver: {},
    }
  }

  get sessionId() {
    return this.#data.sessionId
  }

  get sessionSeqId() {
    return this.#data.sessionSeqId
  }

  set sessionSeqId(value) {
    this.#data.sessionSeqId = value
  }

  get sender() {
    return this.#data.sender
  }

  set sender(value) {
    this.#data.sender = value
  }

  get receiver() {
    return this.#data?.receiver
  }

  set receiver(value) {
    this.#data.receiver = value
  }

  setClient(clientId) {
    if (!this.sender.clientId) {
      this.sender = ServerClient.createData(clientId, 'Sender')
      return new ServerClient(this.sender)
    } else if (this.sender.clientId === clientId) {
      return new ServerClient(this.sender)
    } else if (!this.receiver.clientId) {
      this.receiver = ServerClient.createData(clientId, 'Receiver')
      return new ServerClient(this.receiver)
    } else if (this.receiver?.clientId === clientId) {
      return new ServerClient(this.receiver)
    } else {
      return null
    }
  }

  getClient(clientId) {
    if (this.sender.clientId === clientId) {
      return new ServerClient(this.sender)
    }
    if (this.receiver.clientId === clientId) {
      return new ServerClient(this.receiver)
    }
    return null
  }

  getPartnerClient(clientId) {
    if (this.sender.clientId === clientId) {
      return new ServerClient(this.receiver)
    }
    if (this.receiver.clientId === clientId) {
      return new ServerClient(this.sender)
    }
    return null
  }

  reset() {
    this.#data.sessionSeqId = uuidv4()
    ServerClient.reset(this.#data.sender)
    ServerClient.reset(this.#data.receiver)
  }
}
