export default class ServerClient {
  #data

  constructor(data) {
    this.#data = data
  }

  static createData(clientId, clientType) {
    return { clientId, clientType, started: false, seqDatas: [] }
  }

  static reset(data) {
    data.started = false
    data.seqDatas = []
  }

  get clientId() {
    return this.#data.clientId
  }

  get clientType() {
    return this.#data.clientType
  }

  get started() {
    return this.#data.started
  }

  set started(value) {
    this.#data.started = value
  }

  addSeqData(seqDataType, seqData) {
    this.#data.seqDatas.push({
      type: seqDataType,
      data: seqData,
    })
  }

  getSeqDatas(startSeqNo) {
    const result = []
    if (this.#data.seqDatas) {
      for (let i = startSeqNo; i < this.#data.seqDatas.length; ++i) {
        result.push(this.#data.seqDatas[i])
      }
    }
    return result
  }
}
