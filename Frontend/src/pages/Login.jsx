import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

import AuthLayout from "../components/auth/Authlayout.jsx";
import Input from "../components/auth/Input.jsx";
import { loginUser } from "../api/auth.js";
import { login } from "../redux/authSlice.js";

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      return toast.error("Please fill all fields");
    }

    try {
      setLoading(true);
      const res = await loginUser(form);

      dispatch(
        login({
          token: res.data.token,
          user: {
            _id: res.data._id,
            name: res.data.name,
            email: res.data.email,
            balance: res.data.balance,
          },
        })
      );

      toast.success("Login Successful");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-neutral-950/80 p-8 shadow-[0_0_70px_rgba(34,197,94,0.12)]"
      >
        <h1 className="mb-2 text-4xl font-bold text-white">Welcome Back 👋</h1>
        <p className="mb-8 text-gray-400">Login to continue trading with confidence.</p>

        <div className="space-y-5">
          <Input
            label="Email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter email"
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter password"
          />

          <button
            disabled={loading}
            className="w-full rounded-xl bg-green-500 py-3 font-semibold text-black transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="text-center text-gray-400">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-green-400">
              Register
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}