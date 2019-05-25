var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var session = require("express-session")
const db = require("./app/mongoose.js")
const MongoStore = require("connect-mongo")(session)
var Detail = require("./app/modules/inventoryitem");
var Admin  = require("./app/modules/adminModel");
const { isAdminLoggedIn } = require("./app/middleware/auth.js")
const { check, validationResult } = require("express-validator/check");

// Configure app for bodyParser()
// lets us grab data from the body of POST
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(bodyParser.json());

// Set up port for server to listen on
var port = process.env.PORT || 3004;

var router = express.Router();

//setup express-session middleware
app.use(session({
  secret: 'Xy12MIbneRt Un2w',
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: false,
    expires: new Date(Date.now() + 60 * 60 * 1000)
  },
  store: new MongoStore({
    mongooseConnection: db
  })
}));

// Routes will all be prefixed with /API
app.use("/api", router);

//MIDDLE WARE-
router.use(function (req, res, next) {
  console.log("FYI...There is some processing currently going down");
  next();
});

// test route
router.get("/", function (req, res) {
  res.json({
    message: "Welcome !"
  });
});

  router.post("/login", [
    check("id").not().isEmpty().withMessage("Please provide login id.").trim().escape(),
    check("password").not().isEmpty().withMessage("Please provide login password.").trim().escape(),
  ], async (req, res) => {
    try {
    if(req.session.admin) {
      return res.json({ message: "Already Logged In!"})
    }

    const errors = validationResult(req)

    if(!errors.isEmpty()){
      return res.status(400).send({ message: "Bad Request!", error: errors.array()})
    }

    const admin = await Admin.findOne({ id: req.body.id, password: req.body.password })

    if(!admin){
      return res.json({ error: "Incorrect id or password!" })
    }

    req.session.admin = admin
    res.status(200).send({ success: "Admin Logged In!"})

    } catch(e) {
      res.status(400).send({ message: "Bad Request!", error: e})
    }
  })

  router.get("/logout", (req, res) => {
    req.session.destroy()
    res.status(200).send({ success: "Logged out!"})
  })

// add inventory item to backend database
router
  .route("/cash")
  .post(isAdminLoggedIn, async function (req, res) {
    try{
      var casht = new Details();
      casht.mobile_no = req.body.mobile_no;
      casht.inventory_name = req.body.inventory_name;
      casht.inventory_category = req.body.inventory_category;
      casht.inventory_qty = req.body.inventory_qty;
      casht.inventory_cost = req.body.inventory_cost;

      await casht.save()
      
      res.json(casht)
    } catch(e) {
      res.status(400).send({ message: "Something went wrong!", error: e})
    }
  })
  .get(function (req, res) {
    Detail.find(function (err, details) {
      if (err) {
        res.send(err);
      }
      res.json(details);
    }); 
  });

router.route("/cash/mobile_no/:mobile_no").get(isAdminLoggedIn, async function (req, res) {
  try{
      const casht = await Detail.findOne({ mobile_no: req.body.mobile_no })
      res.json(casht)
    } catch(e) {
      res.status(400).send({ message: "Something went wrong!", error: e})
    }
});
// Fire up server
app.listen(port);

// print friendly message to console
console.log("Server listening on port " + port);