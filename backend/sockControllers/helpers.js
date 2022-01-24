exports.delay = async (time) => {
  const sleep = (ms) => new Promise((awaken) => setTimeout(awaken, ms));
  await sleep(time);
};

const {
  Connection,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  PublicKey,
  Keypair,
  sendAndConfirmTransaction,
} = require("@solana/web3.js");
const bs58 = require("bs58");

exports.sendSol = async (address, amount) => {
  try {
    const network = process.env.SOLANA_NODE_URL;
    const connection = await new Connection(network);

    const fromWallet = Keypair.fromSecretKey(
      bs58.decode(process.env.SOL_SECRET_KEY)
    );

    const toWallet = new PublicKey(address);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromWallet.publicKey,
        toPubkey: toWallet,
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );

    // Sign transaction, broadcast, and confirm
    const tx = await sendAndConfirmTransaction(connection, transaction, [
      fromWallet,
    ]);

    console.log(`Player: ${address}  Amount: ${amount}`, await tx);
    return await tx;
  } catch (e) {
    return console.log("send sol error", e);
  }
};

exports.transferDeposit = async (address, secret, amount) => {
  try {
    const network = process.env.SOLANA_NODE_URL;
    const connection = await new Connection(network);

    const fromWallet = Keypair.fromSecretKey(bs58.decode(secret));

    const toWallet = new PublicKey(process.env.SOL_HOT_WALLET);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromWallet.publicKey,
        toPubkey: toWallet,
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );

    // Sign transaction, broadcast, and confirm
    const tx = await sendAndConfirmTransaction(connection, transaction, [
      fromWallet,
    ]);

    console.log(`Player: ${address}  Amount: ${amount}`, await tx);
    return await tx;
  } catch (e) {
    return console.log("send sol error", e);
  }
};

exports.results1 = [
  1.04,
  1.04,
  1.01,
  1.01,
  1.04,
  2.36,
  2.36,
  2.65,
  2.68,
  4.23,
  8.42,
  10.51,
];

exports.results2 = [
  3.43,
  2.31,
  4.58,
  2.69,
  13.79,
  1.04,
  1.0,
  1.04,
  1.1,
  1.89,
  1.94,
];

exports.results3 = [
  3.43,
  2.31,
  4.58,
  2.69,
  13.79,
  1.04,
  1.0,
  1.04,
  1.1,
  1.89,
  1.94,
  49.53,
  3.43,
  2.31,
  4.58,
  2.69,
  13.79,
  18.46,
  1.04,
  1.0,
  7.23,
  1.04,
  1.1,
  1.89,
  1.94,
  82.49,
];

// Roulette

exports.rouletteSlots = [
  "0",
  "32",
  "15",
  "19",
  "4",
  "21",
  "2",
  "25",
  "17",
  "34",
  "6",
  "27",
  "13",
  "36",
  "11",
  "30",
  "8",
  "23",
  "10",
  "5",
  "24",
  "16",
  "33",
  "1",
  "20",
  "14",
  "31",
  "9",
  "22",
  "18",
  "29",
  "7",
  "28",
  "12",
  "35",
  "3",
  "26",
];

exports.redSlots = [
  1,
  3,
  5,
  7,
  9,
  12,
  14,
  16,
  18,
  19,
  21,
  23,
  25,
  27,
  30,
  32,
  34,
  36,
];

exports.blackSlots = [
  2,
  4,
  6,
  8,
  10,
  11,
  13,
  15,
  17,
  20,
  22,
  24,
  26,
  28,
  29,
  31,
  33,
  35,
];

exports.rowThree = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];

exports.rowTwo = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35];

exports.rowOne = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34];
