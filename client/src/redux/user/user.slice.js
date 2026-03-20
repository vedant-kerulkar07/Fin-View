import { createSlice } from "@reduxjs/toolkit";

const storedUser = localStorage.getItem("user");
const storedToken = localStorage.getItem("token");

let parsedUser = null;

try {

  parsedUser =
    storedUser && storedUser !== "undefined"
      ? JSON.parse(storedUser)
      : null;

} catch {

  parsedUser = null;

}

const initialState = {

  isLoggedIN: !!storedToken,

  user: parsedUser,

  token: storedToken || null,

};

export const userSlice = createSlice({

  name: "user",

  initialState,

  reducers: {

    setUser: (state, action) => {

      state.isLoggedIN = true;

      state.user = action.payload.user;

      state.token = action.payload.token;

      localStorage.setItem(
        "user",
        JSON.stringify(action.payload.user)
      );

      localStorage.setItem(
        "token",
        action.payload.token
      );

    },

    removeUser: (state) => {

      state.isLoggedIN = false;

      state.user = null;

      state.token = null;

      localStorage.removeItem("user");

      localStorage.removeItem("token");

    },

  },

});

export const {
  setUser,
  removeUser
} = userSlice.actions;

export default userSlice.reducer;