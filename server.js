const express = require("express");
const mongodb = require("./database/mongo");
const transactionsdb = require("./database/transactions");
const app = express();
const fs = require("fs");
require("dotenv").config();
const session = require("express-session");
const passport = require("passport");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const sendmail = require("./contactus/mailer");
const cors = require("cors");
const { error } = require("console");

const port=process.env.PORT || 4001

const clientid = process.env.CLIENT_ID;
const clientsecret = process.env.CLIENT_SECRET;
const frontid=process.env.FRONTEND_ID

app.use(
  cors({
    origin: frontid,
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);
app.use(express.json());

app.post("/contact", (req, res) => {
  const { name, email, message } = req.body;
  const data = {
    name,
    email,
    message,
    timestamp: new Date().toISOString(),
  };
  const jsondata = JSON.stringify(data);
  fs.appendFile("query.txt", jsondata + "\n", (e) => {
    if (e) {
      console.error(e);
      res.status(500).send("Error writing to file");
    } else {
      console.log("Data written to file");
      sendmail(email, name, message);
      res.json("success");
    }
  });
});

app.post("/register", async (req, res) => {
  const body = req.body;
  if (!body.email || !body.name || !body.password) {
    return res.status(400).send("Missing parameters");
  }

  
  const existingUser = await mongodb.findOne({ email: req.body.email });
  if (existingUser) {
    return res.status(409).send("Email already exists");
  }

  const newUser = await mongodb.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  });

  res.json(newUser);
});


app.post("/login", (req, res) => {
  const body = req.body;
  if (!body.email || !body.password) {
    res.status(404).send("encounter occur");
  }
  mongodb
    .findOne({ email: body.email })
    .then((result) => {
      if (result) {
        if (result.password === body.password) {
          res.json({ success: true, userName: result.name,userEmail:result.email });
        } else {
          res.json("password is incorrect");
        }
      } else {
        res.json("no user exist");
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Internal Server Error");
    });
});

app.post("/create-checkout-session", async (req, res) => {
  try {
    const { curData, username,useremail } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: curData.name,
            },
            unit_amount: curData.price * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${frontid}/success`,
      cancel_url: `${frontid}/cancel`,
    });

    // Store data in MongoDB
    const newData = await transactionsdb.create({
      username: username,
      email: useremail,
      name: curData.name,
      price: curData.price,
      sessionId: session.id,
      timestamp: new Date().toISOString(),
    });

    res.json({ id: session.id, newData });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/bookingdetail", async (req, res) => {
  try {
    const { uemail } = req.body;
    // console.log(uemail);

    const users = await transactionsdb.find({ email: uemail });
    // console.log(users);

    if (!users ) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(users);
  } catch (error) {
    console.error("Error retrieving user details:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.delete("/bookingdelete", async (req, res) => {
  try {
    const { id } = req.body;
    const deletedBooking = await transactionsdb.findByIdAndDelete(id);
    if (!deletedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    return res.status(200).json(deletedBooking);
  } catch (error) {
    console.error("Error deleting booking:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/firebase/login", async (req, res) => {
  const { data } = req.body;

  try {
    
    const existingUser = await mongodb.findOne({ googleId: data.user.uid });
    
    if (existingUser) {
      
      return res.status(200).json(existingUser);
    }

    
    const newUser = {
      name: data.user.displayName,
      email: data.user.email,
      googleId: data.user.uid,
      image: data.user.photoURL,
    };

    const createdUser = await mongodb.create(newUser);
    return res.status(200).json(createdUser);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});


app.listen(port, () => "Server is listening on port no:",port);
