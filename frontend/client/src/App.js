import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./Components/Navbar/Navbar";
import Home from "./Components/Home/Home";
import Dice from "./Components/Dice/Dice";
import Crash from "./Components/Crash/Crash";
import Coinflip from "./Components/Coinflip/Coinflip";
import Roulette from "./Components/Roulette/Roulette";

function App() {
  return (
    <>
      <Router>
        <Navbar />
        <div className={"main-wrapper"}>
          <Routes>
            <Route exact path={"/"} element={<Home />} />
            <Route exact path={"/dice"} element={<Dice />} />
            <Route exact path={"/crash"} element={<Crash />} />
            <Route exact path={"/coinflip"} element={<Coinflip />} />
            <Route exact path={"/roulette"} element={<Roulette />} />
          </Routes>
        </div>
      </Router>
    </>
  );
}

export default App;
