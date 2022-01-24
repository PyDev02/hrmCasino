import { useHistory, Link } from "react-router-dom";
import AppContext from "../../context/context";
import { useContext, useEffect, useState } from "react";
import "./Navbar.css";
import { FaDiceD20 } from "react-icons/fa";
import { GiRocket, GiCoinflip, GiSpinningBlades } from "react-icons/gi";
import axios from "axios";
import {
  Connection,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  PublicKey,
  Keypair,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import Modal from "../Modal/Modal";
import Withdraw from "../Withdraw/Withdraw";
import logo from "../../assets/images/logo.png";

export default function Navbar() {
  const {
    user,
    setUser,
    phantomInstalled,
    phantomConnected,
    setPhantomConnected,
    setBalance,
    balance,
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
  } = useContext(AppContext);

  const [phantomStatus, setPhantomStatus] = useState();

  useEffect(() => {
    switch (true) {
      case phantomInstalled && !phantomConnected:
        return setPhantomStatus(
          <button
            onClick={() => handlePhantomConnect()}
            className={"connect-btn"}
          >
            Connect Phantom
          </button>
        );

      case !phantomInstalled:
        return setPhantomStatus(
          <button
            onClick={() => window.open("https://phantom.app/", "_blank")}
            className={"connect-btn "}
          >
            Install Phantom
          </button>
        );

      case phantomConnected:
        return setPhantomStatus(
          <>
            <button
              onClick={() => handlePhantomDisconnect()}
              className={"connect-btn"}
            >
              Disconnect
            </button>
          </>
        );
    }
  }, [phantomInstalled, phantomConnected]);

  const handlePhantomConnect = async () => {
    try {
      await window.solana
        .connect()
        .then(async (res) => {
          const message = `Login in as ${res.publicKey}`;
          const encodedMessage = new TextEncoder().encode(message);
          return await window.solana.signMessage(encodedMessage, "utf8");
        })
        .then((signature) => {
          axios
            .post(
              `${process.env.REACT_APP_BASE_URL}/api/user/login`,
              {
                signature,
                address: signature.publicKey.toString(),
              },
              { withCredentials: true }
            )
            .then((res) => {
              setUser({
                address: signature.publicKey.toString(),
                publicKey: signature.publicKey,
              });

              setWalletAddress(res.data.walletAddress);
              setWalletBalance(res.data.walletBalance);

              socket.current.connect();
              setPhantomConnected(true);
            })
            .catch((e) => {
              console.log(e);
            });
        })
        .catch((e) => console.log(e));
    } catch (err) {
      console.log(err);
    }
  };

  const handlePhantomDisconnect = async () => {
    socket.current.disconnect();
    try {
      await window.solana
        .disconnect()
        .then(() => {
          setUser(null);
          setPhantomConnected(false);
        })
        .catch((e) => console.log(e));
    } catch (err) {
      console.log(err);
    }
  };

  // useEffect(() => {
  //   if (socket.current) {
  //     socket.current.on("unauthorized", () => {
  //       handlePhantomDisconnect();
  //     });
  //   }
  // });

  return (
    <>
      <nav className={"Navbar"}>
        <div className={"nav-left"}>
          <Link to={"/"}>
            <img src={logo} alt="" />
          </Link>
        </div>

        <div className={"nav-middle"}>
          <div className={pathname === "/dice" ? "active" : ""}>
            <Link className={"icon-middle"} to={"/dice"}>
              <FaDiceD20 /> Dice
            </Link>
          </div>

          <div className={pathname === "/coinflip" ? "active" : ""}>
            <Link className={"icon-middle"} to={"/coinflip"}>
              <GiCoinflip />
              Coinflip
            </Link>
          </div>

          <div className={pathname === "/roulette" ? "active" : ""}>
            <Link className={"icon-middle"} to={"/roulette"}>
              <GiSpinningBlades />
              Roulette
            </Link>
          </div>

          <div className={pathname === "/crash" ? "active" : ""}>
            <Link className={"icon-middle"} to={"/crash"}>
              <GiRocket />
              Crash
            </Link>
          </div>
        </div>

        {modalOpen ? <Modal /> : ""}
        {withdrawOpen ? <Withdraw /> : ""}

        <div className={"nav-right"}>
          {phantomConnected ? (
            <>
              <div className={"balance"}>
                <span>Balance </span>
                <span>{parseFloat(walletBalance).toFixed(4)} SOL</span>
              </div>

              <div className={"deposit-withdraw"}>
                <button
                  onClick={() => setModalOpen(true)}
                  className={"btn btn-sm btn-success"}
                >
                  Deposit
                </button>

                <button
                  onClick={() => setWithdrawOpen(true)}
                  className={"btn btn-sm btn-success"}
                >
                  Withdraw
                </button>
              </div>
            </>
          ) : (
            ""
          )}
          {phantomStatus}
        </div>
      </nav>
    </>
  );
}
