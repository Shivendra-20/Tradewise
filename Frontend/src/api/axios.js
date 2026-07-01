import axios from 'axios';

const API = axios.create({
    baseURL:import.meta.env.VITE_API_URI || "http://localhost:5000/api",
    headers:{
        "Content-Type": "application/json",
    },
    withCredentials:false,
});

// Request Interceptor
API.interceptors.request.use(
    (config)=>{
        const token = localStorage.getItem("token");

        if(token){
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
     (error) => Promise.reject(error)
);

// Response Interceptor
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default API;