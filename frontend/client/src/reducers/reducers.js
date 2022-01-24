// import React from "react";

export const sessionReducer = (state, action) => {
  switch (action.type) {
    case "start":
      localStorage.setItem("isAuth", "true");
      localStorage.setItem("userType", action.payload);

      return {
        ...state,
        isAuth: "true",
        userType: action.payload,
      };

    case "end":
      localStorage.setItem("isAuth", "false");
      localStorage.setItem("userType", null);
      return { ...state, isAuth: "false" };

    default:
      return { isAuth: "false" };
  }
};
