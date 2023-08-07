const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");

const register = (req, res) => {
    console.log("hello")
    const {username, email, password} = req.body;

    // Check if a user with the provided email already exists
    User.findOne({
        where: {
            email
        }
    }).then(existingUser => {
        if (existingUser) {
            return res.status(400).send({message: "Email is already in use"});
        }

        // Hash the password
        const passwordHash = bcrypt.hashSync(password, 8);

        // Create a new user
        User.create({
            username,
            passwordHash,
            email
        }).then(user => {
            res.status(200).send({message: "User registered successfully"});
        }).catch(err => {
            res.status(500).send({message: err.message});
        });
    }).catch(err => {
        res.status(500).send({message: err.message});
    });
};


const login = (req, res) => {
    const {email, password} = req.body;

    // Find the user with the given email
    User.findOne({
        where: {
            email
        }
    }).then(user => {
        if (!user) {
            return res.status(401).send('Invalid email or password');
        }

        // Check the password
        const passwordIsValid = bcrypt.compareSync(password, user.passwordHash);

        if (!passwordIsValid) {
            return res.status(401).send('Invalid email or password');
        }

        // Sign the token
        const token = jwt.sign({
            email: user.email
        }, process.env.API_SECRET, {
            expiresIn: 86400 // expires in 24 hours
        });

        // Respond to client request with success and token
        res.status(200).send({
            user: {
                email: user.email,
                username: user.username
            },
            message: 'Login successful',
            token
        });

    }).catch(err => {
        res.status(500).send({message: err.message});
    });
};

module.exports = {register, login};
