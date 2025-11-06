// src/pages/GoogleLogin.jsx
import React, { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "@/helpers/firebase";
import { showToast } from "@/helpers/showToast";
import { getEnv } from "@/helpers/getEnv";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser } from "@/redux/user/user.slice";
import { Button } from "@/components/ui/button";

const GoogleLogin = () => {
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const googleResponse = await signInWithPopup(auth, provider);
      const user = googleResponse.user;

      const bodyData = {
        name: user.displayName,
        email: user.email,
        avatar: user.photoURL,
      };

      const response = await fetch(`${getEnv("VITE_API_URL")}/auth/google-login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyData),
          credentials: "include",
        }
      );

      const data = await response.json();
      if (!response.ok) {
        return showToast("error", data.message);
      }

      // ✅ Save user in Redux
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
  };

  return (
    <>
      <Button
        variant="outline"
        className="w-full flex items-center justify-center bg-black gap-2"
        onClick={handleLogin}
      >
        <FcGoogle />
        {loading ? "Loading..." : "Continue with Google"}
      </Button>
    </>
  );
};

export default GoogleLogin;
