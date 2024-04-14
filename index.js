const express = require('express')
const cors = require('cors')
const { Db } = require('mongodb')
const res = require('express/lib/response')
const bcrypt = require('bcrypt');
const EmployeeDB = require('./data')
const session = require('express-session');
const passport = require('passport');
const passportLocal = require('passport-local');

const app = express()
const port = process.env.PORT || 8080
var db = new EmployeeDB;

const corsOptions = {
  credentials: true,
  origin: "http://localhost:8080"
}

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }))
app.use(cors(corsOptions))
app.use(session({ secret: "98fhasdhf9a41djlnq", resave: false, saveUninitialized: true }))
app.use(passport.initialize())
app.use(passport.session())

class Employee {
  constructor(fName, lName, id, payRate, timecards, encryptedPassword, supervisor) {
      this.fName = fName;
      this.lName = lName;
      this.id = id;
      this.payRate = payRate;
      this.timecards = timecards;
      this.encryptedPassword = encryptedPassword;
      this.supervisor = supervisor;
  }
}

class Timecard { 
  constructor(date, startTime, endTime) {
    this.date = date;
    this.startTime = startTime;
    this.endTime = endTime;
  }
}

class ActiveEmployee {
  constructor(id, startDate, startTime) {
    this.id = id;
    this.startDate = startDate;
    this.startTime = startTime;
  }
}

var ACTIVE_EMPLOYEES = [];

// -----------------------  Employees ----------------------- \\
function handleGetEmployees(req, res) {
  db.getAllEmployees((response) => {
    res.json(response);
  })
}

function handleGetSingleEmployee(req, res) {
  db.getEmployeeByEmployeeId(req.params.employeeId).then((user) => {
    res.json(user);
  })
}

function handleCreateEmployee(req, res) {
  if(req.user && req.user.supervisor) {
    bcrypt.hash(req.body.plainPassword, 12).then((hash) => {
      const encryptedPassword = hash;
      db.createEmployee(new Employee(req.body.firstName, req.body.lastName, req.body.employeeID, req.body.payRate, [], encryptedPassword, req.body.supervisor)).then(() => {
        res.status(201).send("Created");
      }).catch((error) => {
        if(error.errors) {
          let errorMessages = {};
          for(let e in error.errors) {
            errorMessages[e] = error.errors[e].message;
          }
          res.status(422).json(errorMessages);
        } else if(error.code == 11000) {
          res.status(400).send("Duplicate entry, bad request");
        } else {
          res.status(500).send("Server error");
        }
      })
    })
  } else {
    res.status(403).send("Forbidden");
  }
}

function handleDeleteEmployee(req, res, databaseId) {
  if(req.user && req.user.supervisor) {
    var errors = db.deleteEmployee(databaseId);
    if(errors) {
      res.status(500).send(errors);
    } else {
      res.status(200).send("OK");
    }
  } else {
    res.status(403).send("Forbidden");
  }
}

function handleUpdateEmployee(req, res, databaseId) {
  if(req.user && req.user.supervisor) {
    if(req.body.plainPassword != "") {
      bcrypt.hash(req.body.plainPassword, 12).then((hash) => {
        const encryptedPassword = hash;
        updatedEmployeeObject = new Employee(req.body.firstName, req.body.lastName, req.body.employeeID, req.body.payRate, [], encryptedPassword, req.body.supervisor);
        db.updateEmployee(databaseId, updatedEmployeeObject).then(employee => {
          res.status(200).send("Updated");
        }).catch((error) => {
          if(error.errors) {
            let errorMessages = {};
            for(let e in error.errors) {
              errorMessages[e] = error.errors[e].message;
            }
            res.status(422).json(errorMessages);
          } else {
            res.status(500).send("Server error");
          }
        })
      })
    } else {
      updatedEmployeeObject = new Employee(req.body.firstName, req.body.lastName, req.body.employeeID, req.body.payRate, [], req.body.plainPassword, req.body.supervisor);
      db.updateEmployee(databaseId, updatedEmployeeObject).then(employee => {
        res.status(200).send("Updated");
      }).catch((error) => {
        if(error.errors) {
          let errorMessages = {};
          for(let e in error.errors) {
            errorMessages[e] = error.errors[e].message;
          }
          res.status(422).json(errorMessages);
        } else {
          res.status(500).send("Server error");
        }
      })
    }
  } else {
    res.status(403).send("Forbidden");
  }
}


// -----------------------  Timecards ----------------------- \\
function handleCreateTimecard(req, res, databaseId) {
  if(req.user && req.user.supervisor) {
    newTimecard = new Timecard(req.body.date, req.body.startTime, req.body.endTime);
    db.createTimecard(databaseId, newTimecard).then(() => {
      res.status(201).send("Created");
    });
  } else {
    res.status(403).send("Forbidden");
  }
}

function handleUpdateTimecard(req, res, databaseId) {
  if(req.user && req.user.supervisor) {
    updatedTimecardObject = new Timecard(req.body.date, req.body.startTime, req.body.endTime);
    db.updateTimecard(databaseId, updatedTimecardObject).then(() => {
      res.status(200).send("OK");
    });
  } else {
    res.status(403).send("Forbidden");
  }
}

function handleDeleteTimecard(req, res, databaseId) {
  if(req.user && req.user.supervisor) {
    db.deleteTimecard(databaseId, req.body.timecardDate).then(() => {
      res.status(200).send("OK");
    });
  } else {
    res.status(403).send("Forbidden");
  }
}

// -----------------------  Active Employees ----------------------- \\
function handleGetActiveEmployees(req, res) {
  if(req.user && req.user.supervisor) {
    res.json(ACTIVE_EMPLOYEES);
  } else {
    res.status(403).send("Forbidden");
  }
}


function handleGetActiveStatus(req, res, employeeId) {
  for(let i = 0; i < ACTIVE_EMPLOYEES.length; i++) {
    if(ACTIVE_EMPLOYEES[i].id == employeeId) {
      res.json({ isActive: true });
      return true;
    }
  }
  res.json({ isActive: false });
  return false;
}

function handleCreateActivity(req, res, id, startDate, startTime) {
  ACTIVE_EMPLOYEES.push(new ActiveEmployee(id, startDate, startTime));
  res.status(201).send("Created");
}

function handleDeleteActivity(req, res, employeeId) {
  for(let i = 0; i < ACTIVE_EMPLOYEES.length; i++) {
    if(ACTIVE_EMPLOYEES[i].id == employeeId) {
      let deletedActivity = ACTIVE_EMPLOYEES[i];
      ACTIVE_EMPLOYEES.splice(i, 1);
      return res.json(deletedActivity);
    }
  }
  res.status(404).send("Not Found");
  return false;
}


passport.use(new passportLocal.Strategy(
  {
    usernameField: 'id',
    passwordField: 'plainPassword'
  },
  function(id, plainPassword, done) {
    db.getEmployeeByEmployeeId(id).then((loginUser) => {
      if(loginUser) { // Good username
        bcrypt.compare(plainPassword, loginUser.encryptedPassword).then((result) => {
          if(result) { // Good username and good password
            done(null, loginUser);
          } else { // Bad Password
            done(null, false);
          }
        });
      } else { // Bad username
        done(null, false);
      }
    }).catch(function (err) {
      done(err);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(userId, done) {
  db.getEmployee(userId).then(function(user) {
      done(null, user);
  }).catch(function(err) {
      done(err);
  });
});

// Get Employees
app.get('/employees', (req, res) => {
  handleGetEmployees(req, res);
});

// Get Single Employee
app.get('/employees/:employeeId', (req, res) => {
  handleGetSingleEmployee(req, res);
});

// Create Employee
app.post('/employees', (req, res) => {
  handleCreateEmployee(req, res);
});

// Delete Employee
app.delete('/employees/:databaseId', (req, res) => {
  handleDeleteEmployee(req, res, req.params.databaseId);
});


// Update Employee
app.put('/employees/:databaseId', (req, res) => {
  handleUpdateEmployee(req, res, req.params.databaseId);
});

// Create Timecard
app.post('/timecards/:databaseId', (req, res) => {
  handleCreateTimecard(req, res, req.params.databaseId);
});

// Update Timecard
app.put('/timecards/:databaseId', (req, res) => {
  handleUpdateTimecard(req, res, req.params.databaseId);
});

// Delete Timecard
app.delete('/timecards/:databaseId', (req, res) => {
  handleDeleteTimecard(req, res, req.params.databaseId);
});

// Get List of all Active Employees
app.get('/activities', (req, res) => {
  handleGetActiveEmployees(req, res);
});

// Get Active Status Of Single Employee
app.get('/activities/:employeeId', (req, res) => {
  handleGetActiveStatus(req, res, req.params.employeeId);
});

// Create Active Timecard
app.post('/activities', (req, res) => {
  handleCreateActivity(req, res, req.body.id, req.body.startDate, req.body.startTime);
});

// Delete Active Timecard
app.delete('/activities/:employeeId', (req, res) => {
  handleDeleteActivity(req, res, req.params.employeeId);
});

// Create Session
app.post('/session', passport.authenticate('local'), (req, res) => {
  res.sendStatus(201);
});

// Get Session
app.get('/session', function(req, res) {
  if(req.user) {
      res.json(req.user);
  } else {
      res.sendStatus(401);
  }
});

// Delete Session
app.post('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`The server is running at http://localhost/${port}`)
});