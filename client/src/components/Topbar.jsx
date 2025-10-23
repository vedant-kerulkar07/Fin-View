import React, { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getEnv } from "@/helpers/getEnv";
import { showToast } from "@/helpers/showToast";
import { removeUser } from "@/redux/user/user.slice";
import { MdOutlineMapsHomeWork } from "react-icons/md";
import { IoMdNotificationsOutline } from "react-icons/io";

const Topbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const response = await fetch(`${getEnv("VITE_API_URL")}/auth/logout`, {
        method: "get",
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        return showToast("error", data.message);
      }

      dispatch(removeUser());
      navigate("/LogoutSuccess");
      showToast("success", data.message);
    } catch (err) {
      showToast("error", err.message || "Server error");
    }
  };

  return (
    <header className="w-full bg-[#0f172a] border-b border-[#475569] text-[#3AAFA9] px-6 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div
          className="text-2xl font-bold text-[#e5e9e9] flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          <MdOutlineMapsHomeWork className="w-6 h-6 text-[#3AAFA9]" />
          <span>FinView</span>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-[#3AAFA9] text-2xl focus:outline-none"
          aria-label="Toggle Menu"
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Desktop Menu */}
        <ul className="hidden md:flex items-center space-x-8 font-medium">
          <Link to="/dashboard">
            <li className="hover:text-white transition">Dashboard</li>
          </Link>
          <Link to="/dashboard/transaction">
            <li className="hover:text-white transition">Transactions</li>
          </Link>
          <Link to="/dashboard/analytics">
            <li className="hover:text-white transition">Analytics</li>
          </Link>
          <Link to="/dashboard/notifications">
            <li className="hover:text-white transition"><IoMdNotificationsOutline className="sm:w-5 sm:h-5" /></li>
          </Link>
          <Link to="/dashboard/profile">
            <li className="hover:text-white transition">Profile</li>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition"
          >
            Log out
          </button>
        </ul>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <ul className="md:hidden mt-3 flex flex-col space-y-3 text-[#e5e9e9] font-medium bg-[#1e293b] border border-[#475569] rounded-lg shadow-lg p-4">
          <Link to="/dashboard">
            <li className="hover:text-[#3AAFA9] transition">Dashboard</li>
          </Link>
          <Link to="/dashboard/transaction">
            <li className="hover:text-[#3AAFA9] transition">Transactions</li>
          </Link>
          <Link to="/dashboard/analytics">
            <li className="hover:text-[#3AAFA9] transition">Analytics</li>
          </Link>
          <Link to="/dashboard/notifications">
            <li className="hover:text-white transition"><IoMdNotificationsOutline className="sm:w-5 sm:h-5" /></li>
          </Link>
          <Link to="/dashboard/profile">
            <li className="hover:text-[#3AAFA9] transition">Profile</li>
          </Link>

          <div className="pt-2 border-t border-[#475569]">
            <button
              onClick={() => {
                handleLogout();
                setMenuOpen(false);
              }}
              className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white rounded-lg px-4 py-2.5 transition"
            >
              Log out
            </button>
          </div>
        </ul>
      )}
    </header>
  );
};

export default Topbar;
