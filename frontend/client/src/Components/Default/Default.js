import { useHistory } from "react-router-dom";
import AppContext from "../../context/context";
import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Dice.css";
import { BsTwitter, BsDiscord, BsInstagram } from "react-icons/bs";
import { ImSigma } from "react-icons/im";

export default function Dice() {
  const { setPathname, socket } = useContext(AppContext);
  const [diceResult, setDiceResult] = useState(0);
  const [betAmount, setBetAmount] = useState(0);

  useEffect(() => {
    setPathname("/dice");
  }, []);

  const submitBet = () => {
    if (!socket.current.connected) {
      return console.log("connect wallet");
    } else {
      socket.current.emit("/api/game/dice", betAmount);
    }
  };

  useEffect(() => {
    if (socket.current) {
      socket.current.on("diceResult", (data) => {
        console.log(data);
        setDiceResult(data);
      });
    }
  }, [socket.current]);

  return (
    <>
      <div className={"game-wrapper"}>
        <div className={"left-section"}>
          <div className={"card left-section-inner"}>
            <div className={"bet-options"}>
              <div className={"game-title"}>
                <span>DICE</span>
              </div>

              <div>
                <input className={"form-control"} type="text" />
              </div>

              <div>
                <button onClick={() => submitBet()} className={"btn"}>
                  Roll Dice
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={"right-section"}>
          <div className={"card right-top-section"}></div>

          <div className={"card right-bottom-section"}></div>
        </div>
      </div>
    </>
  );
}
