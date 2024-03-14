import {ChatGPTAPIBrowser} from  'chatgpt-browser'
import {payrollProp} from './props.js'

export const aiAnalize = async (text)=> {
  const api = new ChatGPTAPIBrowser({
    email: process.env.OPENAI_EMAIL,
    password: process.env.OPENAI_PASSWORD
  })

  await api.initSession()

  prop = payrollProp(text)

  const result = await api.sendMessage(prop)
  return result.response
}
