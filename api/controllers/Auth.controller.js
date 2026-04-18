import User from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { handleError } from "../helpers/handleError.js";
import { sendResetOtpEmail } from "../services/email.js";
// Utility to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// --------------------- REGISTER ---------------------
export const Register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(handleError(409, "User already registered"));
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword,
    });

    await user.save();

    const token = generateToken(user);

    const userData = user.toObject({ getters: true });
    delete userData.password;

    res.status(201).json({
      success: true,
      user: userData,
      token,
      message: "Registration successful",
    });
  } catch (error) {
    next(handleError(500, error.message));
  }
};

// --------------------- LOGIN ---------------------
export const Login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return next(handleError(404, "Invalid login credential"));

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) return next(handleError(401, "Invalid login credential"));

    const token = generateToken(user);

    res.cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: 60 * 60 * 1000,
    });

    const userData = user.toObject({ getters: true });
    delete userData.password;

    res.status(200).json({
      success: true,
      user: userData,
      token,
      message: "Login successful",
    });
  } catch (err) {
    next(handleError(500, err.message));
  }
};

// --------------------- GOOGLE LOGIN ---------------------
export const GoogleLogin = async (req, res, next) => {
  try {
    const { name, email, avatar } = req.body;

    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = bcryptjs.hashSync(randomPassword, 10);

      user = await new User({
        name,
        email,
        password: hashedPassword,
        avatar,
      }).save();
    }

    const token = generateToken(user);

    res.cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: 60 * 60 * 1000,
    });

    const userData = user.toObject({ getters: true });
    delete userData.password;

    res.status(200).json({
      success: true,
      user: userData,
      token,
      message: "Google login successful",
    });
  } catch (err) {
    next(handleError(500, err.message));
  }
};

// --------------------- LOGOUT ---------------------
export const Logout = async (req, res, next) => {
  try {
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });
    res.status(200).json({
      success: true,
      message: "Logout successfuly"
    })
  } catch (error) {
    next(handleError(500, err.message))

  }
}

// ------------------- FORGOT PASSWORD -------------------
 export const ForgetPassword = async (req , res , next)=>{
  try {
    const {email} = req.body;
    const user = await User.findOne({email})
    if (!user) return next(handleError(404,"user not found"))

      //Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random()*900000).toString()

      //Hash OTP before saving 
      const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex")
      const otpExpiry = Date.now() + 10 * 60 * 1000;

      user.resetOtp = hashedOtp
      user.resetOtpExpiry = otpExpiry
      await user.save()

      try {
        await sendResetOtpEmail(email , user.name , otp)
      } catch (error) {
        return next(handleError(500 , "Failed to send OTP email"))
      }
      res.json({success:true,message:"OTP sent to your email"})
  } catch (error) {
    next(handleError(500, error.message));
  }
 }

 // ------------------- RESET PASSWORD (Using OTP) -------------------
export const ResetPassword = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;

    // ✅ Validate request body
    if (!email || !otp || !password) {
      return next(handleError(400, "Email, OTP, and password are required"));
    }

    const user = await User.findOne({ email });
    if (!user) return next(handleError(404, "User not found"));

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    if (user.resetOtp !== hashedOtp || user.resetOtpExpiry < Date.now()) {
      return next(handleError(400, "Invalid or expired OTP"));
    }

    user.password = await bcryptjs.hash(password, 10);
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;

    await user.save();

    res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    next(handleError(500, error.message || "Something went wrong"));
  }
};


// ------------------- VERIFY OTP -------------------
export const VerifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return next(handleError(400, "Email and OTP are required"));
    }

    const user = await User.findOne({ email });
    if (!user) return next(handleError(404, "User not found"));

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    if (user.resetOtp !== hashedOtp || user.resetOtpExpiry < Date.now()) {
      return next(handleError(400, "Invalid or expired OTP"));
    }

    res.json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    next(handleError(500, error.message || "Something went wrong"));
  }
};
