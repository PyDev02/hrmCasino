import { useHistory } from "react-router-dom";
import AppContext from "../../context/context";
import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Dice.css";
import Slider from "@mui/material/Slider";
import { BsTwitter, BsDiscord, BsInstagram } from "react-icons/bs";
import { ImSigma } from "react-icons/im";

export default function Dice() {
  const { setPathname, socket, walletBalance, setWalletBalance } = useContext(
    AppContext
  );

  const [betData, setBetData] = useState({
    betAmount: 0.01,
    rollType: "under",
    rollNumber: 50,
    payout: 0,
    multiplier: 1.012,
    winChance: 49,
  });

  const [diceResult, setDiceResult] = useState({
    die1: 44,
    die2: 44,
    diceTotal: 88,
  });

  const [isWinner, setIsWinner] = useState("");
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    setPathname("/dice");
  }, []);

  const handleBetAmount = (e) => {
    if (isNaN(e.target.value)) {
      return;
    }
    setBetData({
      ...betData,
      [e.target.name]: e.target.value,
    });
  };

  const handleBetData = (e) => {
    setBetData({
      ...betData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRollType = () => {
    setBetData({
      ...betData,
      ["rollType"]: betData.rollType === "under" ? "over" : "under",
    });
  };

  const submitBet = () => {
    if (
      betData.betAmount <= 0 ||
      betData.betAmount < process.env.REACT_APP_MIN_BET ||
      betData.betAmount > process.env.REACT_APP_MAX_BET ||
      betData.betAmount > walletBalance
    ) {
      return;
    }

    if (!socket.current.connected) {
      return console.log("connect wallet");
    } else {
      setDisabled(true);
      setIsWinner("");
      socket.current.emit("/api/game/dice", betData);
    }
  };

  useEffect(() => {
    if (socket.current) {
      socket.current.on("diceResult", (data) => {
        setTimeout(() => {
          setDiceResult(data);
          setDisabled(false);
          setIsWinner(data.isWinner);

          if (data.balance) {
            setWalletBalance(data.balance);
          }
        }, 2000);
      });
    }
  }, [socket.current]);

  useEffect(() => {
    let winChance;
    let multiplier;
    const totalOutcomes = 98;

    // Roll Under
    if (betData.rollType === "under") {
      const favorable = betData.rollNumber - 2;
      winChance = (favorable / totalOutcomes) * 100;
      multiplier = 93 / favorable;
    }

    // Roll Over
    if (betData.rollType === "over") {
      const favorable = totalOutcomes - betData.rollNumber;
      winChance = (favorable / totalOutcomes) * 100;
      multiplier = 93 / favorable;
    }

    setBetData({
      ...betData,
      ["winChance"]: Math.floor(winChance),
      ["multiplier"]: parseFloat(multiplier).toFixed(4),
      ["payout"]: parseFloat(betData.betAmount * multiplier).toFixed(4),
    });
  }, [betData.rollNumber, betData.rollType, betData.betAmount]);

  return (
    <>
      <div className={"game-wrapper"}>
        <div className={"left-section"}>
          <div className={"card left-section-inner"}>
            <div className={"bet-options"}>
              <div className={"game-title"}>
                <span>DICE</span>
              </div>

              <div className={"bet-amount-div"}>
                <span>Bet</span>
                <input
                  autoComplete={"off"}
                  name={"betAmount"}
                  value={betData.betAmount}
                  onChange={(e) => handleBetAmount(e)}
                  className={""}
                  type="text"
                />
              </div>

              <div className={"bet-amount-div"}>
                <span>Payout</span>
                <input
                  value={betData.payout}
                  disabled={true}
                  className={""}
                  type="text"
                />
              </div>

              <div className={"bet-button-div"}>
                <button
                  disabled={disabled}
                  onClick={() => submitBet()}
                  className={"btn bet-btn"}
                >
                  Roll
                </button>
              </div>

              <div className={"max-min"}>
                <span>Min Bet: {process.env.REACT_APP_MIN_BET}</span>
                <span>Max Bet: {process.env.REACT_APP_MAX_BET}</span>
              </div>

              <div className={"roll-result"}>
                {isWinner === true
                  ? "You Win"
                  : isWinner === false
                  ? "You Lose"
                  : ""}
              </div>
            </div>
          </div>
        </div>

        <div className={"right-section"}>
          <div className={"card right-top-section"}>
            <div className={"dice-result"}>
              <span className={"dice-digits"}>{diceResult.diceTotal}</span>
            </div>

            <div className={"dice-div"}>
              <div className={"card dice"}>
                <span>{diceResult.die1}</span>
              </div>
              <div className={"card dice"}>
                <span>{diceResult.die2}</span>
              </div>
            </div>

            <div className={"number-range"}>
              <Slider
                name={"rollNumber"}
                value={betData.rollNumber}
                valueLabelDisplay={"on"}
                color={"success"}
                sx={{
                  height: 10,
                  color: "success.main",
                  "& .MuiSlider-thumb": {
                    borderRadius: "1px",
                  },
                }}
                onChange={(e) => handleBetData(e)}
                step={1}
                min={6}
                max={94}
                track={betData.rollType === "over" ? "inverted" : "normal"}
              />
            </div>
          </div>

          <div className={"card right-bottom-section"}>
            <div className={"bottom-item"} onClick={() => handleRollType()}>
              <span>
                Roll {betData.rollType === "under" ? "Under" : "Over"}
              </span>
              <div className={"roll"}>{betData.rollNumber}</div>
            </div>

            <div className={"bottom-item"}>
              <span>Win Chance</span>
              <div className={"win-chance"}>
                <span>{betData.winChance}%</span>
              </div>
            </div>

            <div className={"bottom-item"}>
              <span>Multiplier</span>
              <div className={"multiplier"}>{betData.multiplier}x</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
