import axios from 'axios'

const ApiSteam = axios.create({
  baseURL : 'API HERE',
  timeout: 10000
})

export default ApiSteam