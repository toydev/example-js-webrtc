export default class ClientSeqDatas {
  #seqNo = 0
  #seqDatas = []

  get length() {
    return this.#seqDatas.length
  }

  pushAll(seqDatas) {
    if (seqDatas) {
      seqDatas.forEach(i => this.#seqDatas.push(i))
    }
  }

  async forEach(callbackFn) {
    let result = true
    for (let i = this.#seqNo; i < this.#seqDatas.length; ++i) {
      const { type, data } = this.#seqDatas[i]
      console.log(`ClientSeqDatas#forEach ${i}: type = ${type}, data = ${data}`)
      result = result && await callbackFn(type, data)
    }
    this.#seqNo = this.#seqDatas.length
    return result
  }
}
