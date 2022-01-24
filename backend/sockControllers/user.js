const bcrypt = require("bcrypt");
const User = require("../models/User");
const { v4: uuidv4 } = require("uuid");
const { delay, sendSol, transferDeposit } = require("./helpers");
const jwt = require("jsonwebtoken");
const bs58 = require("bs58");
const nacl = require("tweetnacl");
const {
  Connection,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  PublicKey,
  Keypair,
  sendAndConfirmTransaction,
} = require("@solana/web3.js");

exports.deposit = async (data, user) => {
  try {
    if (!data.depositAmount || !data.signature) {
      console.log("Missing params");
      return "failed";
    }

    if (data.depositAmount <= 0 || isNaN(data.depositAmount)) {
      console.log("Deposit amount not greater than 0.");
      return "failed";
    }

    const network = process.env.SOLANA_NODE_URL;
    const connection = new Connection(network);

    await connection.confirmTransaction(data.signature);

    let tx = await connection.getTransaction(data.signature);

    if (!tx) {
      console.log("trying again");
      delay(15000);
      tx = await connection.getConfirmedTransaction(data.signature);
    }

    const systemProgram = tx.transaction.message.accountKeys[2].toString();

    // Make sure transaction program is SOL
    if (systemProgram.toString() !== "11111111111111111111111111111111") {
      console.log("Program error");
      return console.log({ error: "Invalid program ID" });
    }

    const keys = tx.transaction.message.accountKeys;

    // Check that deposit address is equal to stored user wallet address
    if (keys[1].toString() !== user.walletAddress) {
      console.log("Mismatched addresses");
      return "failed";
    }

    const userPreBalance = tx.meta.preBalances[0];
    const userPostBalance = tx.meta.postBalances[0];

    let amountInTx =
      (userPreBalance - userPostBalance) / LAMPORTS_PER_SOL - 0.000005;

    const newBalance = await connection.getBalance(
      new PublicKey(user.walletAddress)
    );

    console.log(amountInTx);

    console.log(newBalance);

    console.log(keys[0].toString(), keys[1].toString(), user.walletAddress);

    // Check current time against signature time to ensure that signature is new
    let currentTime = Math.round(new Date().getTime() / 1000);

    let blockTime = tx.blockTime;

    let timeSinceTx = currentTime - blockTime; // in seconds

    if (timeSinceTx > 60) {
      return console.log("TX too old");
    }

    const player = await User.findOne({ username: user.username.toString() });

    if (!player) {
      console.log("Player not found");
      return "failed";
    }

    const sendToHotWallet = await transferDeposit(
      process.env.SOL_HOT_WALLET,
      player.walletSecret,
      amountInTx
    );

    console.log(sendToHotWallet);

    player.balance = parseFloat(
      parseFloat(player.balance) + parseFloat(amountInTx)
    ).toFixed(4);

    await player.save();

    return player.balance;
  } catch (e) {
    console.log(e);
    return "failed";
  }
};

exports.withdraw = async (data, user) => {
  try {
    if (
      !data.withdrawalAmount ||
      data.withdrawalAmount <= 0 ||
      isNaN(data.withdrawalAmount)
    ) {
      return "failed";
    }

    const pk = new PublicKey(user.username);
    const message = `Withdraw ${data.withdrawalAmount} as ${user.username}`;

    const uInt8Message = new TextEncoder().encode(message);
    const signature = new Uint8Array(data.signature.signature);
    const pkUint8 = bs58.decode(pk.toString());

    const isVerified = await nacl.sign.detached.verify(
      uInt8Message,
      signature,
      pkUint8
    );

    if (!isVerified) {
      console.log("Signature not verified");
      return "failed";
    }

    const player = await User.findOne({ username: user.username.toString() });

    if (player.balance < data.withdrawalAmount) {
      console.log("Balance too low");
      return "failed";
    }

    const withdrawSol = await sendSol(user.username, data.withdrawalAmount);

    if (!withdrawSol) {
      return "failed";
    }

    player.balance = parseFloat(
      parseFloat(player.balance) - parseFloat(data.withdrawalAmount)
    ).toFixed(4);

    await player.save();

    return player.balance;
  } catch (e) {
    console.log(e);
    return "failed";
  }
};

exports.balance = async (data, user) => {
  try {
    const player = await User.findOne({ username: user.username.toString() });

    if (!player) {
      return 0;
    }

    return player.balance;
  } catch (e) {
    console.log(e);
  }
};
