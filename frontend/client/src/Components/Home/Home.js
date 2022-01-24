import { useHistory, useNavigate } from "react-router-dom";
import AppContext from "../../context/context";
import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";
import { BsTwitter, BsDiscord, BsInstagram } from "react-icons/bs";
import { ImSigma } from "react-icons/im";

export default function Home() {
  const navigate = useNavigate();
  const { setPathname, socket } = useContext(AppContext);
  const [diceResult, setDiceResult] = useState(0);

  useEffect(() => {
    setPathname("/");
  }, []);

  useEffect(() => {
    navigate("/dice");
  });

  return (
    <>
      {/*<div className={"homeBody"}></div>*/}

      <div className={"hero"}>
        <div className={"hero-image"}></div>
      </div>
    </>
  );
}
