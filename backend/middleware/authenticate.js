const jwt = require("jsonwebtoken");

exports.authenticate = async (socket) => {
  try {
    const cookie = socket.request.headers.cookie;

    if (!cookie) {
      return { error: "Access Denied" };
    }

    const token = cookie.split("=")[1];

    if (!token) {
      return { error: "Access Denied" };
    }

    const user = await jwt.verify(token, process.env.jwtsecret);

    if (!user) {
      return { error: "Access Denied" };
    }

    // jwt.sign(
    //   {
    //     username: user.username,
    //   },
    //   process.env.jwtsecret,
    //   { expiresIn: 60 * 1 },
    //   (err, token) => {
    //     if (err) {
    //       return { error: "Invalid Credentials" };
    //     }
    //     socket.cookie(`${process.env.TOKEN_PSUEDO_NAME}`, token);
    //   }
    // );

    return user;
  } catch (e) {
    socket.emit("unauthorized");
    console.log(e);
    return e;
  }
};
