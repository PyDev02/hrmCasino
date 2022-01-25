require("dotenv").config();
require("./db/mongoose");

const express = require("express");
const app = express();

const socketServer = require("http").createServer(app);
const io = require("socket.io")(socketServer);
const crypto = require("crypto");

const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");

const User = require("./models/User");
const { authenticate } = require("./middleware/authenticate");
const { deposit, withdraw, balance } = require("./sockControllers/user");
const {
  dice,
  crash,
  roulette,
  coinflip,
  cashout,
} = require("./sockControllers/game");
const { results1, results2, results3 } = require("./sockControllers/helpers");

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(morgan("tiny"));
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.set("socketio", io);

// Allow cors
if (process.env.NODE_ENV === "production") {
  app.use(
    cors({
      origin: [process.env.PRODUCTION_URL],
      credentials: true,
    })
  );
} else {
  app.use(
    cors({
      origin: [
        `http://localhost:3000`,
        "http://localhost:8081",
        "ws://localhost:3000",
      ],
      credentials: true,
      contentType: "*",
    })
  );
}

// Routes
const user = require("./routes/user");

// Routes Middleware
app.use("/api/user", user);

const PORT = process.env.PORT || 5000;

// Deployment
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/client/build")));

  app.get("*", (req, res) => {
    res.sendFile(
      path.resolve(__dirname, "../frontend", "client", "build", "index.html")
    );
  });
}

socketServer.listen(PORT);

let players = [];
let gameInProgress = false;

io.on("connect", (socket) => {
  try {
    // Dice
    socket.on("/api/game/dice", async (data) => {
      authenticate(socket).then((user) => {
        dice(data, user).then((res) => socket.emit("diceResult", res));
      });
    });

    // Crash
    socket.on("/api/game/crash", async (data) => {
      authenticate(socket).then((user) => {
        crash(data, user, gameInProgress, players, io).then((res) =>
          socket.emit("crashResult", res)
        );
      });
    });

    // CashOut for crash game
    socket.on("/api/game/cashout", async (data) => {
      authenticate(socket).then((user) => {
        cashout(
          data,
          user,
          gameInProgress,
          players,
          io,
          currentMultiplier
        ).then((res) => socket.emit("cashOutResult", res));
      });
    });

    // Roulette
    socket.on("/api/game/roulette", async (data) => {
      authenticate(socket).then((user) => {
        roulette(data, user).then((res) => socket.emit("rouletteResult", res));
      });
    });

    // Coinflip
    socket.on("/api/game/coinflip", async (data) => {
      authenticate(socket).then((user) => {
        coinflip(data, user).then((res) => socket.emit("coinflipResult", res));
      });
    });

    // Deposit
    socket.on("/api/user/deposit", async (data) => {
      authenticate(socket).then((user) => {
        deposit(data, user).then((res) => socket.emit("depositResult", res));
      });
    });

    // Withdraw
    socket.on("/api/user/withdraw", async (data) => {
      authenticate(socket).then((user) => {
        withdraw(data, user).then((res) => socket.emit("withdrawResult", res));
      });
    });

    // Balance
    socket.on("/api/user/balance", async (data) => {
      authenticate(socket).then((user) => {
        balance(data, user).then((res) => socket.emit("balanceResult", res));
      });
    });

    // When user disconnects
    socket.on("disconnect", () => {
      // console.log("disconnected");
      socket.disconnect();
    });

    // console.log(io.engine.clientsCount);
  } catch (e) {
    console.log(e);
  }
});

let recentGames = [];
let winners = [];
let currentMultiplier = 0;

const runCrash = async () => {
  // Set random crash number
  // let bang = crypto.randomInt(1, 40) * 0.2436;
  //
  // if (recentGames > 0 && recentGames % 3 === 0) {
  //   bang = crypto.randomInt(1, 20) * 0.2436;
  // }
  //
  // if (recentGames > 0 && recentGames % 2 === 0) {
  //   bang = bang / 2;
  // }

  let bang = 20 / (Math.random() * 20 + 1);

  if (bang < 1) {
    bang = 1;
  }

  const crashed = parseFloat(bang).toFixed(2);
  // console.log(crashed);

  io.sockets.emit("startCrash");

  const numbers = [];
  let i = 1;

  while (i <= crashed) {
    numbers.push(i);
    i = i + 0.01;
  }

  numbers.forEach((number, i) => {
    if (i === 0) {
      io.sockets.emit("startCrash", 1);
      io.sockets.emit("players", players);
      // console.log("players", players);
      gameInProgress = true;
    }

    setTimeout(() => {
      io.sockets.emit("crash", parseFloat(numbers[i]).toFixed(2));
      currentMultiplier = parseFloat(numbers[i]).toFixed(2);

      if (i === numbers.length - 1) {
        // Keep game list under 20
        if (recentGames.length > 20) {
          recentGames = recentGames.slice(1, recentGames.length);
        }

        let areWinners = false;

        // Check for winners
        players.forEach(async (player) => {
          if (!isNaN(player.multiplier) && player.multiplier <= crashed) {
            areWinners = true;

            const winner = await User.findOne({
              username: player.player,
            });

            const newBalance = parseFloat(
              parseFloat(player.betAmount) * parseFloat(player.multiplier)
            );

            winner.balance = parseFloat(
              parseFloat(winner.balance) + parseFloat(newBalance)
            ).toFixed(4);

            await winner.save();
          }
        });

        // Add recent games to list
        recentGames.push({ outcome: crashed, areWinners });

        // Send alert to stop the crash
        io.sockets.emit("stopCrash", {
          crashed,
          recentGames: recentGames
            .slice(recentGames.length - 10, recentGames.length)
            .reverse(),
        });

        // Reset players list
        players = [];
        io.sockets.emit("players", players);

        gameInProgress = false;

        // Restart game
        setTimeout(() => {
          runCrash();
        }, 10000);
      }
    }, i * 50);
  });
};

runCrash();
