import React from 'react'
import { useDispatch } from "react-redux";
import { logout } from "../redux/authSlice.js";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {

const dispatch = useDispatch();
const navigate = useNavigate();

const handleLogout = () => {
  dispatch(logout());
  navigate("/login");
};

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <h1 className="text-5xl font-bold">
        Dashboard 🚀
      </h1>
      <button onClick={handleLogout}className="bg-red-500 px-4 py-2 rounded-lg">Logout</button>
    </div>
  );
}