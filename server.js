const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

////////////////////////////////
//////// MONGO DB ///////////////


const mongoose = require('mongoose')
const Schema = mongoose.Schema;
mongoose.connect(process.env.SRVADDRESS, { useNewUrlParser: true } )

const userSchema = new Schema({
  username: String,
  exercises: [{
    type: Schema.Types.ObjectId, 
    ref: 'Exercise',}]
})

const User = mongoose.model('User', userSchema)

const exerciseSchema = Schema({
  userId: { 
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
})

const Exercise = mongoose.model('Exercise', exerciseSchema)


//// SOME MIDDLEWARES ///////////

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))

////////////////////////////////
//////// ROUTES ///////////////


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/exercise/users', async (req, res) => {
  const users = await User.find({});
  res.json(users);
})


app.post('/api/exercise/new-user', async (req, res) => {
  const user = await new User({username: req.body.username}).save()
  res.json(user);
})

app.post('/api/exercise/add', async (req, res) => { ///////////////////////////////// START FIXING THIS
  const exercise = await new Exercise({
    userId: req.body.userId,
    description: req.body.description,
    duration: req.body.duration,
    date: req.body.date || Date.now
    }).save();
  res.send(exercise);
})














// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
