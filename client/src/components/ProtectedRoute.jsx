import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {

  const { isLoggedIN, user, token } = useSelector((state) => state.user);

  const isAuth = isLoggedIN && user && token;

  console.log("AUTH:", isLoggedIN, user, token);

  if (!isAuth) {

    return <Navigate to="/" replace />;

  }

  return <Outlet />;

};

export default ProtectedRoute;