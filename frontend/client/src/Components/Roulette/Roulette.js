import { useHistory } from "react-router-dom";
import AppContext from "../../context/context";
import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import wheel from "../../assets/images/wheel.png";
import single from "../../assets/images/singleChip.png";
import double from "../../assets/images/multiChip.png";
import { BsTwitter, BsDiscord, BsInstagram } from "react-icons/bs";
import { ImSigma } from "react-icons/im";
import "./Roulette.css";
const {
  leftBlock,
  middleBlock,
  rightBlock,
  rowBet,
  bottomLeftBlock,
  bottomMiddleBlock,
  bottomRightBlock,
} = require("./helpers");

export default function Roulette() {
  const { setPathname, socket, walletBalance, setWalletBalance } = useContext(
    AppContext
  );
  const [rouletteResult, setRouletteResult] = useState(0);
  const [wheelRoll, setWheelRoll] = useState(1440);
  const [betAmount, setBetAmount] = useState(0);
  const [landedSlot, setLandedSlot] = useState(0);
  const [selectedChip, setSelectedChip] = useState(0.01);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [message, setMessage] = useState("");
  const [isWinner, setIsWinner] = useState("");
  const [disabled, setDisabled] = useState(false);

  const betData = {
    betAmount,
    selectedSlots,
  };

  useEffect(() => {
    setPathname("/roulette");
  }, []);

  // useEffect(() => {
  //   if (socket.current) {
  //     socket.current.on("diceResult", (data) => {
  //       console.log(data);
  //       setRouletteResult(data.landedSlot);
  //       setIsWinner(data.isWinner);
  //     });
  //   }
  // }, [socket.current]);

  const handleSlotSelect = (value, color) => {
    // console.log(value, color, selectedChip);

    const isInList = selectedSlots.find((block) => block.slot === value);

    let filteredSlots = [];

    if (!isInList) {
      setSelectedSlots((selectedSlots) => [
        ...selectedSlots,
        {
          slot: value,
          color,
          selectedChip,
          chipsOnSlot: 1,
        },
      ]);

      let bet = parseFloat(betAmount);
      let chipVal = parseFloat(selectedChip);
      return setBetAmount(parseFloat(bet + chipVal).toFixed(3));
    }

    selectedSlots.map((slot) => {
      if (slot.slot !== value) {
        filteredSlots.push(slot);
      } else {
        filteredSlots.push({
          slot: slot.slot,
          color,
          selectedChip: slot.selectedChip + selectedChip,
          chipsOnSlot: slot.chipsOnSlot + 1,
        });
      }
    });

    setSelectedSlots(filteredSlots);

    let bet = parseFloat(betAmount);
    let chipVal = parseFloat(selectedChip);
    return setBetAmount(parseFloat(bet + chipVal).toFixed(3));
  };

  const handleReset = () => {
    setSelectedSlots([]);
    setBetAmount(0);
  };

  const submitBet = () => {
    setIsWinner("");

    if (
      betData.betAmount <= 0 ||
      betAmount < process.env.REACT_APP_MIN_BET ||
      betAmount > process.env.REACT_APP_MAX_BET ||
      betAmount > walletBalance
    ) {
      return setMessage(`Temporary Max/Min amount is 0.25/0.01`);
    }

    if (!socket.current.connected) {
      return console.log("connect wallet");
    } else {
      setDisabled(true);
      socket.current.emit("/api/game/roulette", betData);
    }
  };

  useEffect(() => {
    if (socket.current) {
      setIsWinner("");

      socket.current.on("rouletteResult", (data) => {
        setWheelRoll(361 * 2 - data.spinDegree);

        setTimeout(() => {
          setLandedSlot(data.landedSlot);
          setIsWinner(data.isWinner);
          setDisabled(false);

          if (data.balance) {
            setWalletBalance(data.balance);
          }
        }, 3000);
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
                <span>Roulette</span>
              </div>

              <div className={"chip-bet-roulette"}>
                <div className={"total-bet-roulette"}>
                  <div className={"total-bet-display"}>
                    <span>{selectedChip}</span>
                  </div>
                </div>

                <div className={"chip-select"}>
                  <div className={"chip-select-options"}>
                    <div
                      onClick={() => setSelectedChip(0.01)}
                      className={"chip-item"}
                    >
                      <span>1</span>
                    </div>

                    <div
                      onClick={() => setSelectedChip(0.1)}
                      className={"chip-item"}
                    >
                      <span>10</span>
                    </div>

                    <div
                      onClick={() => setSelectedChip(0.125)}
                      className={"chip-item"}
                    >
                      <span>50</span>
                    </div>

                    <div
                      onClick={() => setSelectedChip(0.25)}
                      className={"chip-item"}
                    >
                      <span>100</span>
                    </div>
                  </div>
                </div>

                <div className={"total-amount-roulette"}>
                  <div className={"total-amount-display"}>
                    <span>{betAmount}</span>
                  </div>
                </div>
              </div>

              <div className={"bet-button-div"}>
                <button
                  disabled={disabled}
                  onClick={() => submitBet()}
                  className={"btn bet-btn"}
                >
                  Spin
                </button>
              </div>

              <div className={"max-min"}>
                <span>Min Bet: {process.env.REACT_APP_MIN_BET}</span>
                <span>Max Bet: {process.env.REACT_APP_MAX_BET}</span>
              </div>

              <div>
                <button
                  className={"reset-btn btn btn-sm"}
                  onClick={() => handleReset()}
                >
                  Reset
                </button>
              </div>

              <div className={"roll-result"}>
                {isWinner === true
                  ? "You Win"
                  : isWinner === false
                  ? "You lose"
                  : ""}
              </div>
            </div>
          </div>
        </div>

        {/*Right Top section*/}
        <div className={"right-section"}>
          <div className={"card right-top-section right-top-roul"}>
            <div className={"wheel-div"}>
              <div>
                <div className={"roul-ball-div"}>
                  <div className={"roul-ball"}></div>
                </div>
                <img
                  style={{
                    transform: `rotate(${wheelRoll}deg)`,
                    transition: "3s ease-in-out",
                  }}
                  src={wheel}
                  alt=""
                />
                <div className={"outcome-wrapper"}>
                  <div className={"outcome-div"}>
                    <span>{landedSlot}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/*Place bets section*/}
          <div className={"card right-bottom-roul"}>
            <div className={"board-div"}>
              <div className={"upper-div"}>
                <div
                  onClick={() => handleSlotSelect(0, "green")}
                  className={"card zero-div"}
                >
                  {selectedSlots.find((block) => block.slot === 0) ? (
                    <>
                      <img src={single} alt="" />
                    </>
                  ) : (
                    <span>0</span>
                  )}
                </div>
                <div className={"main-numbers-div"}>
                  <div className={"main-left"}>
                    {leftBlock.map((block, i) => (
                      <div
                        onClick={() =>
                          handleSlotSelect(block.value, block.color)
                        }
                        key={i}
                        style={
                          block.color === "black"
                            ? { backgroundColor: "#121a1c" }
                            : {
                                backgroundColor: "green",
                              }
                        }
                        className={"card blocks"}
                      >
                        {selectedSlots.find(
                          (slot) => slot.slot === block.value
                        ) ? (
                          <img src={single} alt="" />
                        ) : (
                          <span>{block.value}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className={"main-middle"}>
                    {middleBlock.map((block, i) => (
                      <div
                        onClick={() =>
                          handleSlotSelect(block.value, block.color)
                        }
                        key={i}
                        style={
                          block.color === "black"
                            ? { backgroundColor: "#121a1c" }
                            : {
                                backgroundColor: "green",
                              }
                        }
                        className={"card blocks"}
                      >
                        {selectedSlots.find(
                          (slot) => slot.slot === block.value
                        ) ? (
                          <img src={single} alt="" />
                        ) : (
                          <span>{block.value}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className={"main-right"}>
                    {rightBlock.map((block, i) => (
                      <div
                        onClick={() =>
                          handleSlotSelect(block.value, block.color)
                        }
                        key={i}
                        style={
                          block.color === "black"
                            ? { backgroundColor: "#121a1c" }
                            : {
                                backgroundColor: "green",
                              }
                        }
                        className={"card blocks"}
                      >
                        {selectedSlots.find(
                          (slot) => slot.slot === block.value
                        ) ? (
                          <img src={single} alt="" />
                        ) : (
                          <span>{block.value}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className={"row-div"}>
                  {rowBet.map((row, i) => (
                    <div
                      onClick={() => handleSlotSelect(row.value, row.color)}
                      key={i}
                      className={"row-bet"}
                    >
                      {selectedSlots.find((slot) => slot.slot === row.value) ? (
                        <img src={single} alt="" />
                      ) : (
                        <span>{row.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className={"lower-div"}>
                <div className={"bl-div"}>
                  <div className={"bottom-spread-top"}>
                    <div
                      onClick={() => handleSlotSelect("1to12", null)}
                      className={"bl-inner"}
                    >
                      {selectedSlots.find((slot) => slot.slot === "1to12") ? (
                        <img src={single} alt="" />
                      ) : (
                        <span>1 to 12</span>
                      )}
                    </div>
                  </div>

                  <div className={"bottom-spread"}>
                    <div
                      onClick={() => handleSlotSelect("1to18", null)}
                      className={"bl-inner"}
                    >
                      {selectedSlots.find((slot) => slot.slot === "1to18") ? (
                        <img src={single} alt="" />
                      ) : (
                        <span>1 to 18</span>
                      )}
                    </div>
                    <div
                      onClick={() => handleSlotSelect("even", null)}
                      className={"bl-inner"}
                    >
                      {selectedSlots.find((slot) => slot.slot === "even") ? (
                        <img src={single} alt="" />
                      ) : (
                        <span>Even</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className={"bm-div"}>
                  <div className={"bottom-spread-top"}>
                    <div
                      onClick={() => handleSlotSelect("13to24", null)}
                      className={"bl-inner"}
                    >
                      {selectedSlots.find((slot) => slot.slot === "13to24") ? (
                        <img src={single} alt="" />
                      ) : (
                        <span>13 to 24</span>
                      )}
                    </div>
                  </div>

                  <div className={"bottom-spread"}>
                    <div
                      onClick={() => handleSlotSelect("Red", "red")}
                      className={"bl-inner bl-green"}
                    >
                      {selectedSlots.find((slot) => slot.slot === "Red") ? (
                        <img src={single} alt="" />
                      ) : (
                        ""
                      )}
                    </div>
                    <div
                      onClick={() => handleSlotSelect("Black", "black")}
                      className={"bl-inner bl-black"}
                    >
                      {selectedSlots.find((slot) => slot.slot === "Black") ? (
                        <img src={single} alt="" />
                      ) : (
                        ""
                      )}
                    </div>
                  </div>
                </div>

                <div className={"br-div"}>
                  <div className={"bottom-spread-top"}>
                    <div
                      onClick={() => handleSlotSelect("25to36", null)}
                      className={"bl-inner"}
                    >
                      {selectedSlots.find((slot) => slot.slot === "25to36") ? (
                        <img src={single} alt="" />
                      ) : (
                        <span>25 to 36</span>
                      )}
                    </div>
                  </div>

                  <div className={"bottom-spread"}>
                    <div
                      onClick={() => handleSlotSelect("odd", null)}
                      className={"bl-inner"}
                    >
                      {selectedSlots.find((slot) => slot.slot === "odd") ? (
                        <img src={single} alt="" />
                      ) : (
                        <span>Odd</span>
                      )}
                    </div>
                    <div
                      onClick={() => handleSlotSelect("19to36", null)}
                      className={"bl-inner"}
                    >
                      {selectedSlots.find((slot) => slot.slot === "19to36") ? (
                        <img src={single} alt="" />
                      ) : (
                        <span>19 to 36</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
