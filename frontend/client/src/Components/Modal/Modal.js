import { useHistory, Link } from "react-router-dom";
import AppContext from "../../context/context";
import { useContext, useEffect, useState } from "react";
import "./Modal.css";
import {
  Connection,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

import loading from "../../assets/images/loading.gif";
import check from "../../assets/images/check.gif";

export default function Modal() {
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
    walletBalance,
    setWalletBalance,
  } = useContext(AppContext);

  const [depositAmount, setDepositAmount] = useState(0);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txFailed, setTxFailed] = useState(false);

  const handleDeposit = async () => {
    try {
      setTxFailed(false);

      if (!depositAmount || depositAmount <= 0 || isNaN(depositAmount)) {
        return;
      }

      const network = process.env.REACT_APP_NODE_URL;
      const connection = new Connection(network);

      await window.solana.connect().then((res) => console.log(res));
      console.log(user.publicKey);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: user.publicKey,
          toPubkey: walletAddress,
          lamports: depositAmount * LAMPORTS_PER_SOL,
        })
      );

      transaction.feePayer = user.publicKey;
      let { blockhash } = await connection.getRecentBlockhash();
      transaction.recentBlockhash = blockhash;

      const { signature } = await window.solana
        .signAndSendTransaction(transaction)
        .catch((e) => console.log(e));

      console.log(signature);

      setPending(true);

      await connection
        .confirmTransaction(signature)
        .then(() => {
          socket.current.emit("/api/user/deposit", {
            signature,
            depositAmount,
          });
        })
        .catch(() => {
          console.log("tx failed");
          return setTxFailed(true);
        });
    } catch (e) {
      console.log(e);
    }
  };

  const handleDepositAmount = (e) => {
    setDepositAmount(e.target.value);
  };

  useEffect(() => {
    socket.current.on("depositResult", (res) => {
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
                <h3>Deposit SOL</h3>
              </div>
              <div className={"modal-body"}>
                <span>Amount</span>
                <div>
                  <input
                    value={depositAmount}
                    onChange={(e) => handleDepositAmount(e)}
                    type="text"
                  />
                </div>
              </div>
              <div className={"modal-footer"}>
                <button
                  className={"btn cancel-btn"}
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className={"btn submit-btn "}
                  onClick={() => handleDeposit()}
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
                  <span>Deposit failed</span>
                  <button
                    className={"btn cancel-btn"}
                    onClick={() => setModalOpen(false)}
                  >
                    Close
                  </button>
                </>
              ) : (
                <>
                  <img src={loading} alt="" />

                  <span>Completing your deposit</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
