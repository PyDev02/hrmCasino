const bcrypt = require("bcrypt");
const User = require("../models/User");
const { v4: uuidv4 } = require("uuid");
const { delay } = require("./helpers");
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

// @route   POST api/user/create
// @desc    Login user
// @access  Public
exports.createUser = async (req, res) => {
  try {
    const network = process.env.SOLANA_NODE_URL;
    const connection = new Connection(network);

    const kp = Keypair.generate();

    const walletAddress = kp.publicKey.toString();
    const walletSecret = bs58.encode(kp.secretKey);

    await delay(5000);

    let { username, password, signature } = req.body;

    if (!username || !password) {
      return res.status(500).send("All fields required");
    }

    let tx = await connection
      .getParsedConfirmedTransaction(signature)
      .then((res) => res);

    if (!tx) {
      await delay(5000);

      tx = await connection
        .getParsedConfirmedTransaction(signature)
        .then((res) => res);

      if (!tx) {
        return res.status(500).send("Signature Failed");
      }
    }

    const address = tx.transaction.message.accountKeys[0].pubkey.toString();

    if (address !== username) {
      return res.status(500).send("Signature Failed");
    }

    const newUser = await new User({
      username,
      password,
      walletAddress,
      walletSecret,
      balance: parseFloat(0).toFixed(4),
      uuid: uuidv4(),
      createdAt: Date.now(),
    });

    await newUser.save();

    return res.status(200).send({});
  } catch (e) {
    console.log(e);
    return res.status(500).send("User already exist.");
  }
};

// @route   POST api/user/login
// @desc    Login user
// @access  Public
exports.login = async (req, res) => {
  try {
    const pk = new PublicKey(req.body.address);
    const message = `Login in as ${req.body.address}`;

    const uInt8Message = new TextEncoder().encode(message);
    const signature = new Uint8Array(req.body.signature.signature.data);
    const pkUint8 = bs58.decode(pk.toString());

    const isVerified = await nacl.sign.detached.verify(
      uInt8Message,
      signature,
      pkUint8
    );

    if (!isVerified) {
      return res.status(404).send({ error: "user not found" });
    }

    let user = await User.findOne({ username: req.body.address });

    if (!user) {
      const kp = Keypair.generate();

      const walletAddress = kp.publicKey.toString();
      const walletSecret = bs58.encode(kp.secretKey);

      user = new User({
        username: pk.toString(),
        walletAddress,
        walletSecret,
        balance: parseFloat(0).toFixed(4),
        uuid: uuidv4(),
        createdAt: Date.now(),
      });

      await user.save();
    }

    await jwt.sign(
      { username: user.username, walletAddress: user.walletAddress },
      process.env.jwtsecret,
      {
        expiresIn: 60 * 60 * 24,
      },
      (err, token) => {
        if (err) {
          return res.status(400).send({ error: "InvalidCredentials" });
        }

        res.cookie(`${process.env.TOKEN_PSUEDO_NAME}`, token, {
          secure: process.env.NODE_ENV !== "development",
        });

        return res.status(200).send({
          user: user.username,
          walletAddress: user.walletAddress,
          walletBalance: user.balance,
        });
      }
    );
  } catch (e) {
    console.log(e);
    return res.status(404).send({ error: "user not found" });
  }
};
