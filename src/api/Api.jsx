import axios from 'axios'
const Api = axios.create({
  
  // CORS
  baseURL : 'API HERE',
})
export default Api

