import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import Input from "../components/auth/Input";
import { loginUser } from "../services/authService";
import toast from "react-hot-toast";

export default function Register() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

 const [form, setForm] = useState({
    name:"",
    email:"",
    password:"",
});

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

      const res = await registerUser(form);

   localStorage.setItem("token", res.data.token);

localStorage.setItem(
    "user",
    JSON.stringify({
        _id: res.data._id,
        name: res.data.name,
        email: res.data.email,
        balance: res.data.balance,
    })
);

      toast.success("Registration Successful");

      navigate("/dashboard");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Login Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-neutral-950 border border-white/10 rounded-3xl p-8"
      >
        <h1 className="text-4xl font-bold text-white mb-2">
        Create Account
        </h1>

        <p className="text-gray-400 mb-8">
          Login to continue trading.
        </p>

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
            className="w-full bg-green-500 hover:bg-green-400 py-3 rounded-xl font-semibold transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="text-center text-gray-400">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-green-400"
            >
              Register
            </Link>
          </p>

        </div>
      </form>
    </AuthLayout>
  );
}