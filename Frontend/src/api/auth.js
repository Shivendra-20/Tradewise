import API from "./axios.js";


export const loginUser = (data) => API.post("api/auth/login", data);

export const registerUser = (data) => API.post("api/auth/register", data);

export const logoutUser = () => API.post("api/auth/logout");

export const getProfile = () => API.get("api/auth/profile"); // Change if your route is different