// src/pages/ForgotPassword.jsx
import React, { useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { VscGraph } from "react-icons/vsc";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { getEnv } from "@/helpers/getEnv";

// ---------------- Validation Schemas ----------------
const emailSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

const passwordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=password
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
   const navigate = useNavigate();

  // ---------------- Forms ----------------
  const emailForm = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const otpForm = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  // ---------------- Step 1: Send OTP ----------------
  const handleSendOtp = async (values) => {
    setLoading(true);
    try {
      const res = await fetch(`${getEnv("VITE_API_URL")}/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: values.email }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setEmail(values.email);
        setStep(2);
      } else {
        alert(data.message || "Something went wrong");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Step 2: Verify OTP ----------------
  const handleVerifyOtp = async (values) => {
    setLoading(true);
    try {
      const res = await fetch(`${getEnv("VITE_API_URL")}/auth/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, otp: values.otp }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setStep(3);
      } else {
        alert(data.message || "Invalid or expired OTP");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Step 3: Reset Password ----------------
  const handleResetPassword = async (values) => {
    setLoading(true);
    try {
      const res = await fetch(`${getEnv("VITE_API_URL")}/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password: values.password, otp: otpForm.getValues("otp") }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        alert("Password reset successful! Please login.");
         navigate("/reset-password-success");
      } else {
        alert(data.message || "Something went wrong");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="bg-slate-800 border border-slate-600 p-8 rounded-xl w-96 shadow-lg text-center">
        <div className="flex justify-center mb-6 text-3xl">
          <VscGraph />
        </div>

        <h2 className="mb-6 text-2xl font-semibold text-center">
          {step === 1
            ? "Reset Your Password"
            : step === 2
              ? "Verify OTP"
              : "Set New Password"}
          <p className="text-sm text-gray-300 mt-2">
            {step === 1
              ? "Enter your email to receive an OTP."
              : step === 2
                ? "Enter the OTP sent to your email."
                : "Enter your new password and confirm it."}
          </p>
        </h2>

        {/* Step 1: Email */}
        {step === 1 && (
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(handleSendOtp)}>
              <FormField
                control={emailForm.control}
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
              <button
                type="submit"
                className="w-full py-2 bg-[#125c60] text-white rounded-md font-bold mb-4 hover:bg-[#0f4a4d] transition"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          </Form>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <Form {...otpForm}>
            <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)}>
              <FormField
                control={otpForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem className="mb-4 text-left">
                    <FormLabel className="text-white">OTP</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter 6-digit OTP"
                        {...field}
                        className="bg-slate-700 border border-slate-600 text-white placeholder-gray-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-between items-center mb-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-2 px-4 bg-gray-600 rounded-md hover:bg-gray-500 transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-[#125c60] rounded-md hover:bg-[#0f4a4d] transition"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
              </div>
            </form>
          </Form>
        )}

        {/* Step 3: Password */}
        {step === 3 && (
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handleResetPassword)}>
              <FormField
                control={passwordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="mb-4 text-left">
                    <FormLabel className="text-white">New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter new password"
                        {...field}
                        className="bg-slate-700 border border-slate-600 text-white placeholder-gray-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="mb-4 text-left">
                    <FormLabel className="text-white">Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm new password"
                        {...field}
                        className="bg-slate-700 border border-slate-600 text-white placeholder-gray-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="py-2 px-4 bg-gray-600 rounded-md hover:bg-gray-500 transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-[#125c60] rounded-md hover:bg-[#0f4a4d] transition"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
