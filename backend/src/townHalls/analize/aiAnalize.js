const ChatGPTAPIBrowser = require('chatgpt')
const payrollProp = require('./props')

const aiAnalize = async (text)=> {
  const api = new ChatGPTAPIBrowser({
    email: process.env.OPENAI_EMAIL,
    password: process.env.OPENAI_PASSWORD
  })

  await api.initSession()

  prop = payrollProp(text)

  const result = await api.sendMessage(prop)
  return result.response
}

module.exports = {aiAnalize}