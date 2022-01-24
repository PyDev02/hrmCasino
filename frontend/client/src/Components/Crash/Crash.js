import { useHistory } from "react-router-dom";
import AppContext from "../../context/context";
import { useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "../Dice/Dice.css";
import "./Crash.css";
import rocket from "../../assets/images/rocket.png";
import explosion from "../../assets/images/explosion.png";
import { BsTwitter, BsDiscord, BsInstagram } from "react-icons/bs";
import { ImSigma } from "react-icons/im";
import { LineChart, Line, XAxis, YAxis } from "recharts";

export default function Crash() {
  const { setPathname, socket, walletBalance, setWalletBalance } = useContext(
    AppContext
  );

  const [crashResult, setCrashResult] = useState(0);
  const [recentGames, setRecentGames] = useState([]);
  const [nextGame, setNextGame] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [players, setPlayers] = useState([]);
  const [multiplier, setMultipler] = useState(parseFloat(1).toFixed(2));
  const [isCrash, setIsCrash] = useState(false);
  const [betData, setBetData] = useState({
    betAmount: 0.05,
    multiplier: 2,
  });

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
    setPathname("/crash");
  }, []);

  const submitBet = () => {
    if (!socket.current.connected) {
      return console.log("connect wallet");
    } else {
      if (
        betData.betAmount <= 0 ||
        betData.betAmount < process.env.REACT_APP_MIN_BET ||
        betData.betAmount > process.env.REACT_APP_MAX_BET ||
        betData.betAmount > walletBalance ||
        betData.multiplier < 1
      ) {
        return;
      }
      socket.current.emit("/api/game/crash", betData);
    }
  };

  useEffect(() => {
    if (socket.current) {
      socket.current.on("crashResult", (data) => {
        setCrashResult(data.success);
        setWalletBalance(parseFloat(data.balance).toFixed(4));
      });

      socket.current.on("crash", (data) => {
        setMultipler(data);
        setIsCrash(false);
      });

      socket.current.on("players", (data) => {
        setPlayers(data);
      });

      socket.current.on("startCrash", (data) => {
        setMultipler(data);
        setIsCrash(false);
        console.log("starting");
      });

      socket.current.on("stopCrash", (data) => {
        setMultipler(data.crashed);
        setRecentGames(data.recentGames);
        setIsCrash(true);

        socket.current.emit("/api/user/balance", "balance");

        setTimeout(() => {
          setMultipler(parseFloat(1).toFixed(2));
        }, 2000);

        setTimeout(() => {
          setCountdown(5);
        }, 2000);
      });
    }
  }, [socket.current]);

  useEffect(() => {
    if (countdown > 0) {
      setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }
  });

  useEffect(() => {
    if (socket.current) {
      socket.current.on("balanceResult", (balance) => {
        setWalletBalance(balance);
      });
    }
  }, [recentGames]);

  return (
    <>
      <div className={"game-wrapper"}>
        <div className={"left-section"}>
          <div className={"card left-section-inner"}>
            <div className={"bet-options"}>
              <div className={"game-title"}>
                <span>Crash</span>
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

                <span>Auto Cashout</span>
                <input
                  autoComplete={"off"}
                  name={"multiplier"}
                  value={betData.multiplier}
                  onChange={(e) => handleBetAmount(e)}
                  className={""}
                  type="text"
                />
              </div>

              <div className={"bet-button-div"}>
                <button
                  disabled={false}
                  onClick={() => submitBet()}
                  className={"btn bet-btn"}
                >
                  Place Bet
                </button>
              </div>

              <div className={"max-min"}>
                <span>Min Bet: {process.env.REACT_APP_MIN_BET}</span>
                <span>Max Bet: {process.env.REACT_APP_MAX_BET}</span>
              </div>

              <div className={"current-crash-players"}>
                <span>Players</span>
                <div className={"card crash-players-inner"}>
                  {players.map((bet) => (
                    <>
                      <div
                        style={{
                          color:
                            multiplier > bet.multiplier && countdown === 0
                              ? "green"
                              : "",
                        }}
                        className={"each-crash-bet"}
                      >
                        <span>{bet.player.substring(0, 8)}</span>
                        <span>{bet.multiplier}x</span>
                      </div>
                    </>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={"right-section"}>
          <div className={"card right-top-section"}>
            <div
              style={{
                backgroundPosition:
                  multiplier <= 3
                    ? "bottom"
                    : multiplier > 3 && multiplier < 6
                    ? "center"
                    : multiplier >= 6
                    ? "top"
                    : "bottom",
              }}
              className={"card rocket"}
            >
              <div className={"crash-multiplier"}>
                {countdown > 0 ? (
                  <>
                    <span className={"multi-num"}>Next game in</span>
                    <span className={"multi-num"}>{countdown}</span>
                  </>
                ) : countdown === 0 ? (
                  <>
                    <span className={"multi-num"}>{multiplier}x</span>
                    Current Payout
                  </>
                ) : (
                  ""
                )}
              </div>
              <img
                style={{
                  left: multiplier * 4 < 100 ? `${multiplier * 4}%` : "100%",
                  bottom: multiplier * 4 < 100 ? `${multiplier * 4}%` : "100%",
                  height: isCrash ? "150px" : "",
                }}
                src={isCrash ? explosion : rocket}
                alt=""
              />
            </div>
          </div>

          <div className={"card right-bottom-section"}>
            <div className={"recent-games"}>
              <div className={"results-div"}>
                {recentGames.map((result, i) => (
                  <div>
                    <span
                      style={{ color: result.areWinners ? "green" : "red" }}
                      className={"recent-result"}
                    >
                      {result.outcome}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
