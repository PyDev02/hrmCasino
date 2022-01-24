import React, { useState, useReducer, useEffect, useRef } from "react";
import axios from "axios";
import AppContext from "../context/context";
import { sessionReducer } from "../reducers/reducers";
import { sessionState } from "../reducers/states";
import {
  Connection,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import io from "socket.io-client";
const socketUrl = "ws://localhost:5000";

const AppState = (props) => {
  const [user, setUser] = useState({ address: "", publicKey: [] });
  const [walletAddress, setWalletAddress] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [phantomInstalled, setPhantomInstalled] = useState(true);
  const [phantomConnected, setPhantomConnected] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [balance, setBalance] = useState(null);
  const [pathname, setPathname] = useState("");
  let socket = useRef(null);

  useEffect(() => {
    if (window.solana && window.solana.isPhantom === false) {
      setPhantomInstalled(false);
    }
  }, []);

  useEffect(() => {
    socket.current = io(socketUrl, {
      autoConnect: false,
      upgrade: false,
      transports: ["websocket"],
      withCredentials: true,
      cookie: true,
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        phantomInstalled,
        phantomConnected,
        setPhantomConnected,
        balance,
        setBalance,
        pathname,
        setPathname,
        socket,
        modalOpen,
        setModalOpen,
        walletAddress,
        setWalletAddress,
        walletBalance,
        setWalletBalance,
        withdrawOpen,
        setWithdrawOpen,
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
};

export default AppState;
