import { useHistory } from "react-router-dom";
import AppContext from "../../context/context";
import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BsTwitter, BsDiscord, BsInstagram } from "react-icons/bs";
import { ImSigma } from "react-icons/im";
import "./Coinflip.css";
import heads from "../../assets/images/heads.png";
import tails from "../../assets/images/tails.png";
import coinBlank from "../../assets/images/coinBlank.png";

export default function Coinflip() {
  const { setPathname, socket, walletBalance, setWalletBalance } = useContext(
    AppContext
  );
  const [randomDegree, setRandomDegree] = useState(0);
  const [randomDegree2, setRandomDegree2] = useState(0);
  const [coinlipResult, setCoinflipResult] = useState(0);
  const [landedSide, setLandedSide] = useState("heads");
  const [disabled, setDisabled] = useState(false);
  const [isWinner, setIsWinner] = useState("");
  const [selectedSide, setSelectedSide] = useState("heads");
  const [betData, setBetData] = useState({
    betAmount: 0.01,
    choice: selectedSide,
  });

  useEffect(() => {
    setPathname("/coinflip");
  }, []);

  const submitBet = () => {
    if (!socket.current.connected) {
      return console.log("connect wallet");
    } else {
      if (
        betData.betAmount <= process.env.REACT_APP_MIN_BET ||
        betData.betAmount > process.env.REACT_APP_MAX_BET ||
        betData.betAmount > walletBalance
      ) {
        return;
      }

      setLandedSide("blank");
      setIsWinner("");
      setDisabled(true);
      setRandomDegree(randomDegree - 1440);
      setRandomDegree2(randomDegree - 1440);

      socket.current.emit("/api/game/coinflip", betData);
    }
  };

  const handleBetAmount = (e) => {
    if (isNaN(e.target.value)) {
      return;
    }
    setBetData({
      ...betData,
      [e.target.name]: e.target.value,
    });
  };

  useEffect(() => {
    if (socket.current) {
      socket.current.on("coinflipResult", (data) => {
        setTimeout(() => {
          setDisabled(false);
          setCoinflipResult(data);
          setLandedSide(data.landedSide);
          setIsWinner(data.isWinner);

          if (data.balance) {
            setWalletBalance(data.balance);
          }
        }, 2000);
      });
    }
  }, [socket.current]);

  useEffect(() => {
    setBetData({
      ...betData,
      ["choice"]: selectedSide,
    });
  }, [selectedSide]);

  return (
    <>
      <div className={"game-wrapper"}>
        <div className={"left-section"}>
          <div className={"card left-section-inner"}>
            <div className={"bet-options"}>
              <div className={"game-title"}>
                <span>Coinflip</span>
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

              <div className={"bet-button-div"}>
                <button
                  disabled={disabled}
                  onClick={() => submitBet()}
                  className={"btn bet-btn"}
                >
                  Flip
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
            <div className={"coin-div"}>
              <div className={"coin-img-div"}>
                <img
                  style={{
                    transform: `rotateY(${randomDegree}deg) rotateX(${randomDegree2}deg`,
                    transition: "all 2s ease-out",
                  }}
                  src={
                    landedSide === "heads"
                      ? heads
                      : landedSide === "tails"
                      ? tails
                      : coinBlank
                  }
                  alt=""
                />
              </div>
            </div>
          </div>

          <div className={"card right-bottom-section"}>
            <div className={"heads-tails"}>
              <div
                style={{
                  border: selectedSide === "heads" ? "2px solid #299c1e" : "",
                  color: selectedSide === "heads" ? "white" : "",
                }}
                className={"ht-choice"}
                onClick={() => setSelectedSide("heads")}
              >
                <div>Heads</div>
              </div>

              <div
                style={{
                  border: selectedSide === "tails" ? "2px solid #299c1e" : "",
                  color: selectedSide === "tails" ? "white" : "",
                }}
                className={"ht-choice"}
                onClick={() => setSelectedSide("tails")}
              >
                <div>Tails</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
