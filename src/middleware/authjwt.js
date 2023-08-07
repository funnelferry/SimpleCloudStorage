const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = (req, res, next) => {
  if (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'JWT') {
    jwt.verify(req.headers.authorization.split(' ')[1], process.env.API_SECRET, function (err, decode) {
      if (err) {
        req.user = undefined;
        next();
      }

      console.log(decode)

      // Find the user with the given email
      User.findOne({
        where: {
          email: decode.email
        }
      }).then(user => {
        // If the user is not found, return an error
        if (!user) {
            return res.status(401).send('Invalid email or password');
        }

        req.user = user;
        next();
      }).catch(err => {
        res.status(500).send({message: err.message});
      });
    });
  } else {
    req.user = undefined;
    req.message = "Authorization header not found";
    next();
  }
};

module.exports = verifyToken;
