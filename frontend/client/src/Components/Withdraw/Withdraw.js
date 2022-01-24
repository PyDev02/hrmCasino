import { useHistory, Link } from "react-router-dom";
import AppContext from "../../context/context";
import { useContext, useEffect, useState } from "react";
// import "./Modal.css";
import {
  Connection,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

import loading from "../../assets/images/loading.gif";
import check from "../../assets/images/check.gif";
import axios from "axios";

export default function Withdraw() {
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
    withdrawOpen,
    setWithdrawOpen,
    walletAddress,
    walletBalance,
    setWalletBalance,
  } = useContext(AppContext);

  const [withdrawalAmount, setWithdrawalAmount] = useState(0);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txFailed, setTxFailed] = useState(false);

  const handleWithdraw = async () => {
    try {
      setTxFailed(false);

      if (
        !withdrawalAmount ||
        withdrawalAmount <= 0 ||
        isNaN(withdrawalAmount)
      ) {
        return;
      }

      await window.solana
        .connect()
        .then(async (res) => {
          const message = `Withdraw ${withdrawalAmount} as ${res.publicKey}`;
          const encodedMessage = new TextEncoder().encode(message);
          return await window.solana.signMessage(encodedMessage, "utf8");
        })
        .then((signature) => {
          setPending(true);
          socket.current.emit("/api/user/withdraw", {
            signature,
            withdrawalAmount,
          });
        })
        .catch((e) => console.log(e));
    } catch (e) {
      console.log(e);
    }
  };

  const handleWithdrawAmount = (e) => {
    setWithdrawalAmount(e.target.value);
  };

  useEffect(() => {
    socket.current.on("withdrawResult", (res) => {
      if (res === "failed") {
        setTxFailed(true);

        setTimeout(() => {
          setPending(false);
          setSuccess(false);
        }, 2000);
        console.log("failed");
        return;
      }

      setSuccess(true);
      console.log("success");
      setWalletBalance(res);
      setTimeout(() => {
        setPending(false);
        setSuccess(false);
      }, 2000);
    });
  }, []);

  return (
    <>
      <div className={"modal-background"}>
        <div className={"card modal-container"}>
          {!pending ? (
            <>
              <div className={"modal-header"}>
                <h3>Withdraw SOL</h3>
              </div>
              <div className={"modal-body"}>
                <span>Amount</span>
                <div>
                  <input
                    value={withdrawalAmount}
                    onChange={(e) => handleWithdrawAmount(e)}
                    type="text"
                  />
                </div>
              </div>
              <div className={"modal-footer"}>
                <button
                  className={"btn cancel-btn"}
                  onClick={() => setWithdrawOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className={"btn submit-btn "}
                  onClick={() => handleWithdraw()}
                >
                  Submit
                </button>
              </div>
            </>
          ) : (
            <div className={"gif-div"}>
              {success ? (
                <>
                  <img src={check} alt="" />
                  <span>Success!</span>
                </>
              ) : txFailed ? (
                <>
                  <span>Withdrawal failed</span>
                  <button
                    className={"btn cancel-btn"}
                    onClick={() => setWithdrawOpen(false)}
                  >
                    Close
                  </button>
                </>
              ) : (
                <>
                  <img src={loading} alt="" />

                  <span>Completing your withdrawal</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
