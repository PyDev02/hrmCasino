const bcrypt = require("bcrypt");
const User = require("../models/User");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const {
  delay,
  rouletteSlots,
  redSlots,
  blackSlots,
  rowOne,
  rowTwo,
  rowThree,
} = require("./helpers");
const jwt = require("jsonwebtoken");
const bs58 = require("bs58");
const {
  Connection,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  PublicKey,
  Keypair,
  sendAndConfirmTransaction,
} = require("@solana/web3.js");

exports.dice = async (data, user) => {
  try {
    if (
      data.betAmount <= 0 ||
      data.betAmount < 0.01 ||
      data.betAmount > 0.25 ||
      isNaN(data.betAmount)
    ) {
      console.log("Bet Amount Error");
      return "failed";
    }

    let winChance;
    let multiplier;
    const totalOutcomes = 98;

    // Roll Under
    if (data.rollType === "under") {
      const favorable = data.rollNumber - 2;
      winChance = (favorable / totalOutcomes) * 100;
      multiplier = 93 / favorable;
    }

    // Roll Over
    if (data.rollType === "over") {
      const favorable = totalOutcomes - data.rollNumber;
      winChance = (favorable / totalOutcomes) * 100;
      multiplier = 93 / favorable;
    }

    const payout = parseFloat(data.betAmount * multiplier).toFixed(4);

    let dc1 = crypto.randomInt(1, 49);
    let dc2 = crypto.randomInt(1, 49);
    let dc3 = crypto.randomInt(1, 49);

    let dc4 = crypto.randomInt(44, 49);
    let dc5 = crypto.randomInt(44, 49);
    let dc6 = crypto.randomInt(44, 49);

    let dc7 = crypto.randomInt(1, 10);
    let dc8 = crypto.randomInt(1, 10);
    let dc9 = crypto.randomInt(1, 10);

    let dice = [dc1, dc2, dc3, dc4, dc5, dc6, dc7, dc8, dc9];

    const outcome1 = crypto.randomInt(1, 9);
    const outcome2 = crypto.randomInt(1, 9);

    let die1 = dice[outcome1];
    let die2 = dice[outcome2];

    const diceTotal = die1 + die2;

    const player = await User.findOne({ username: user.username.toString() });

    if (!player) {
      console.log("Player not found");
      return { balance: 0 };
    }

    if (player.balance < data.betAmount) {
      return { balance: player.balance };
    }

    let isWinner = false;

    if (diceTotal <= data.rollNumber && data.rollType === "over") {
      player.balance = parseFloat(
        parseFloat(player.balance) - parseFloat(data.betAmount)
      ).toFixed(4);
    } else if (diceTotal >= data.rollNumber && data.rollType === "under") {
      player.balance = parseFloat(
        parseFloat(player.balance) - parseFloat(data.betAmount)
      ).toFixed(4);
    } else {
      player.balance = parseFloat(
        parseFloat(player.balance) - parseFloat(data.betAmount)
      ).toFixed(4);

      isWinner = true;
      player.balance = parseFloat(
        parseFloat(player.balance) + parseFloat(payout)
      ).toFixed(4);
    }

    // TODO none of this is finished

    await player.save();

    return { die1, die2, diceTotal, balance: player.balance, isWinner };
  } catch (e) {
    console.log(e);
    return "failed";
  }
};

exports.crash = async (data, user, gameInProgress, players, io) => {
  try {
    const bettor = await User.findOne({ username: user.username.toString() });

    if (!bettor) {
      return { success: false, balance: bettor.balance };
    }

    if (!gameInProgress) {
      if (
        data.betAmount <= 0 ||
        data.betAmount < 0.01 ||
        data.betAmount > 0.25 ||
        isNaN(data.betAmount)
      ) {
        console.log("here Bet Amount Error", data.betAmount);
        return { success: false, balance: bettor.balance };
      }

      if (!isNaN(parseFloat(data.multiplier))) {
        if (data.multiplier && data.multiplier < 1) {
          return { success: false, balance: bettor.balance };
        }
      }

      if (bettor.balance < data.betAmount) {
        console.log("INSUFFICIENT_FUNDS");
        return { success: false, balance: bettor.balance };
      }

      let playerAlreadyJoined = false;

      players.map((player) => {
        if (player.player === user.username) {
          playerAlreadyJoined = true;
        }
      });

      if (playerAlreadyJoined) {
        return;
      }

      bettor.balance = parseFloat(
        parseFloat(bettor.balance) - parseFloat(data.betAmount)
      ).toFixed(4);

      await bettor.save();

      await players.push({
        player: user.username,
        betAmount: data.betAmount,
        multiplier: parseFloat(data.multiplier).toFixed(2),
      });

      io.sockets.emit("players", players);

      return { success: true, balance: bettor.balance };
    }
  } catch (e) {
    console.log(e);
    return { success: false };
  }
};

// Cashout for crash game
exports.cashout = async (
  data,
  user,
  gameInProgress,
  players,
  io,
  multiplier
) => {
  try {
    if (!gameInProgress) {
      return;
    }

    players.map((player) => {
      if (player.player === user.username) {
        if (multiplier < player.multiplier) {
          player.multiplier = multiplier;
        }
      }
    });
    io.sockets.emit("players", players);
  } catch (e) {
    console.log(e);
  }
};

exports.roulette = async (data, user) => {
  try {
    // console.log(data);
    if (
      data.betAmount <= 0 ||
      data.betAmount < 0.01 ||
      data.betAmount > 0.25 ||
      isNaN(data.betAmount) ||
      !data.selectedSlots
    ) {
      console.log("Bet Amount Error");
      return "failed";
    }

    const player = await User.findOne({ username: user.username.toString() });

    if (!player) {
      console.log("Player not found");
      return { balance: 0 };
    }

    if (player.balance < data.betAmount) {
      console.log("INSUFFICIENT_FUNDS");
      return { balance: player.balance };
    }

    player.balance = player.balance - data.betAmount;

    let spinDegree = await Math.floor(Math.random() * 359);
    let landedSlot = await rouletteSlots[Math.floor(spinDegree / 9.729)];

    let betTotal = 0;
    let matchedSlots = [];
    let payout = 0;
    let isWinner = false;

    data.selectedSlots.forEach((slot) => {
      betTotal = parseFloat(betTotal) + parseFloat(slot.selectedChip);
      betTotal = parseFloat(betTotal).toFixed(4);
    });

    data.selectedSlots.forEach((slot) => {
      if (parseInt(landedSlot) === slot.slot) {
        matchedSlots.push(slot.slot);
        // Singles Payout
        payout += parseFloat(slot.selectedChip) * 35;
      }

      if (slot.slot === "1st" && rowOne.includes(parseInt(landedSlot))) {
        matchedSlots.push(slot.slot);
        // Row Payout
        payout += parseFloat(slot.selectedChip) * 3;
      }

      if (slot.slot === "2nd" && rowTwo.includes(parseInt(landedSlot))) {
        matchedSlots.push(slot.slot);
        // Row Payout
        payout += parseFloat(slot.selectedChip) * 3;
      }

      if (slot.slot === "3rd" && rowThree.includes(parseInt(landedSlot))) {
        matchedSlots.push(slot.slot);
        // Row Payout
        payout += parseFloat(slot.selectedChip) * 3;
      }

      if (slot.slot === "Red" && redSlots.includes(parseInt(landedSlot))) {
        matchedSlots.push(slot.slot);
        // Red Payout
        payout += parseFloat(slot.selectedChip) * 2;
      }

      if (slot.slot === "Black" && blackSlots.includes(parseInt(landedSlot))) {
        matchedSlots.push(slot.slot);
        // Black Payout
        payout += parseFloat(slot.selectedChip) * 2;
      }

      if (slot.slot === "Even" && landedSlot % 2 === 0) {
        matchedSlots.push(slot.slot);
        // Even Payout
        payout += parseFloat(slot.selectedChip) * 2;
      }

      if (slot.slot === "Odd" && landedSlot % 2 !== 0) {
        matchedSlots.push(slot.slot);
        // Odd Payout
        payout += parseFloat(slot.selectedChip) * 2;
      }

      if (slot.slot === "1to12" && landedSlot > 0 && landedSlot <= 12) {
        matchedSlots.push(slot.slot);
        // 1 to 12 Payout
        payout += parseFloat(slot.selectedChip) * 3;
      }

      if (slot.slot === "1to18" && landedSlot > 0 && landedSlot <= 18) {
        matchedSlots.push(slot.slot);
        // 1 to 18 Payout
        payout += parseFloat(slot.selectedChip) * 2;
      }

      if (slot.slot === "13to24" && landedSlot >= 13 && landedSlot <= 24) {
        matchedSlots.push(slot.slot);
        // 13 to 24 Payout
        payout += parseFloat(slot.selectedChip) * 3;
      }

      if (slot.slot === "25to36" && landedSlot >= 25 && landedSlot <= 36) {
        matchedSlots.push(slot.slot);
        // 25 to 36 Payout
        payout += parseFloat(slot.selectedChip) * 3;
      }

      if (slot.slot === "19to36" && landedSlot >= 19 && landedSlot <= 36) {
        matchedSlots.push(slot.slot);
        // 19 to 36 Payout
        payout += parseFloat(slot.selectedChip) * 2;
      }
    });

    // console.log(betTotal, data.betAmount, landedSlot, payout);

    if (matchedSlots.length > 0) {
      isWinner = true;
      player.balance = player.balance + payout;
    }

    player.save();

    return { landedSlot, isWinner, balance: player.balance, spinDegree };
  } catch (e) {
    console.log(e);
    return "failed";
  }
};

exports.coinflip = async (data, user) => {
  try {
    if (
      data.betAmount <= 0 ||
      data.betAmount < 0.01 ||
      data.betAmount > 0.25 ||
      isNaN(data.betAmount)
    ) {
      console.log("Bet Amount Error");
      return "failed";
    }

    const player = await User.findOne({ username: user.username.toString() });

    if (!player) {
      console.log("Player not found");
      return { balance: 0 };
    }

    if (player.balance < data.betAmount) {
      console.log("INSUFFICIENT_FUNDS");
      return { balance: player.balance };
    }

    player.balance = parseFloat(
      parseFloat(player.balance) - parseFloat(data.betAmount)
    ).toFixed(4);

    const flip = ["heads", "tails"];

    const landedSide = flip[crypto.randomInt(0, 2)];

    let isWinner = false;

    if (landedSide === data.choice) {
      isWinner = true;
      player.balance = parseFloat(
        parseFloat(player.balance) + parseFloat(data.betAmount * 2)
      ).toFixed(4);
    }

    await player.save();

    return { landedSide, isWinner, balance: player.balance };
  } catch (e) {
    console.log(e);
    return { success: false, balance: 0 };
  }
};
