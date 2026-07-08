import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

import AuthLayout from "../components/auth/Authlayout.jsx";
import Input from "../components/auth/Input.jsx";
import { registerUser } from "../api/auth.js";
import { login } from "../redux/authSlice.js";

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
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

    if (!form.name || !form.email || !form.password) {
      return toast.error("Please fill all fields");
    }

    try {
      setLoading(true);
      const res = await registerUser(form);

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

      toast.success("Registration Successful");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Register Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-neutral-950/80 p-8 shadow-[0_0_80px_rgba(34,197,94,0.12)]"
      >
        <h1 className="mb-2 text-4xl font-bold text-white">Create Account</h1>
        <p className="mb-8 text-gray-400">Start your paper trading journey with a premium experience.</p>

        <div className="space-y-5">
          <Input
            label="Full Name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter your name"
          />

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
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <p className="text-center text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-green-400">
              Login
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Register;