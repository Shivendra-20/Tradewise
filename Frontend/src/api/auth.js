import API from "./axios.js";

export const registerUser = (data) => API.post("auth/register",data);