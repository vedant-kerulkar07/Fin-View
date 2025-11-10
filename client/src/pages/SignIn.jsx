// src/pages/Login.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { showToast } from "@/helpers/showToast";
import { getEnv } from "@/helpers/getEnv";
import { useDispatch } from "react-redux";
import { setUser } from "@/redux/user/user.slice";
import GoogleLogin from "./GoogleLogin";
import { VscGraph } from "react-icons/vsc";

const SignIn = () => {
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  //  Form validation schema
  const formSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6, "Password is required"),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  //  Handle submit
  async function onSubmit(values) {
    setLoading(true);
    try {
      const response = await fetch(`${getEnv("VITE_API_URL")}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        credentials: "include", // cookie-based auth
      });

      const data = await response.json();

      if (!response.ok) {
        return showToast("error", data.message);
      }

      //  Save user in Redux
      dispatch(setUser(data.user));

      if (data.user.role === "user") {
        navigate("/Success");
      } else {
        navigate("/register");
      }

      showToast("success", data.message);
    } catch (err) {
      showToast("error", err.message || "Server error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="bg-slate-800 border border-slate-600 p-8 rounded-xl w-96 shadow-lg text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6 text-3xl">
          <VscGraph />
        </div>

        {/* Heading */}
        <h2 className="mb-6 text-2xl font-semibold text-center">
          Welcome Back!
          <p className="text-sm text-gray-300">Take charge of your finance</p>
        </h2>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="mb-4 text-left">
                  <FormLabel className="text-white">Email Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="you@gmail.com"
                      {...field}
                      className="bg-slate-700 border border-slate-600 text-white placeholder-gray-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password Field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="mb-4 text-left">
                  <FormLabel className="text-white">Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="****"
                      {...field}
                      className="bg-slate-700 border border-slate-600 text-white placeholder-gray-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Remember me */}
            <div className="flex justify-between text-xs mb-5 text-gray-300">
              <label className="flex items-center">
                <input type="checkbox" className="mr-1" /> Remember me
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-2 bg-[#125c60] text-white rounded-md font-bold mb-4 hover:bg-[#0f4a4d] transition"
            >
              {loading ? "Loading..." : "Sign in"}
            </button>
          </form>
        </Form>

        {/* Forgot password */}
        <div className="text-xs mb-4 text-gray-300">
          Forget your password?{" "}
          <Link to="/forgot-password" className="text-blue-400 hover:underline">
            Forgot password?
          </Link>
        </div>

        {/* Signup Link */}
        <p className="text-xs mb-4 text-gray-300">
          New to DormDash?{" "}
          <Link to="/register" className="text-blue-400 hover:underline">
            Create an account
          </Link>
        </p>

        {/* OR Divider */}
        <div className="flex items-center justify-center text-xs text-gray-400 mb-4">
          <span>OR</span>
        </div>

        {/* Google Login */}
        <GoogleLogin className="w-full py-2 bg-black text-white font-semibold rounded-lg border border-white" />
      </div>
    </div>
  );
};

export default SignIn;
