import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://dolarapi.com/v1/dolares?utm_source',
  // Aquí puedes añadir más configuraciones como headers por defecto
});

export default axiosInstance;