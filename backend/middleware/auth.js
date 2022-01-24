const jwt = require("jsonwebtoken");

exports.auth = async (req) => {
  try {
    console.log(req);
    return;
    const token = req.cookies.token;

    if (!token) {
      res
        .clearCookie(`${process.env.TOKEN_PSUEDO_NAME}`)
        .catch((e) => console.log(e));
      return res.status(504).send({ authError: "Access denied" });
    }

    req.user = await jwt.verify(token, process.env.jwtsecret);

    if (req.user) {
      jwt.sign(
        {
          id: req.user.id,
        },
        process.env.jwtsecret,
        { expiresIn: "1h" },
        (err, token) => {
          if (err) {
            return res.status(400).send({ error: "Invalid Credentials" });
          }
          res.cookie(`${process.env.TOKEN_PSUEDO_NAME}`, token);
        }
      );
    }
  } catch (e) {
    // res.clearCookie(`${process.env.TOKEN_PSUEDO_NAME}`);
    return { authError: "Access denied" };
  }
};
