import React from "react";

export const sessionState = {
  isAuth: localStorage.getItem("isAuth"),
  userType: localStorage.getItem("userType"),
};
