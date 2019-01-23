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
    type: Schema.Types.ObjectId,
    ref: 'User',
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

exerciseSchema.pre('save', async function(next) {
  if (this.date === null) {
    this.date = await Date.now();
  }
  next();
});

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
  const user = await User.findById(req.body.userId);
  if (!user) {
    res.send("No user exists with that id!");
    return;
  }
  
  const theExercise = {
    userId: req.body.userId,
    description: req.body.description,
    duration: req.body.duration,
    date: req.body.date // if no date entered, the presave in mongoose will input date
  }
  const exercise = await new Exercise(theExercise).save();
  
  const newUser = await User.findOneAndUpdate(
    { _id: req.body.userId },
    { '$addToSet' : { exercises: exercise._id } },
    { new: true }
  )
  res.json(exercise);
})

app.get('/api/exercise/log/:user', async (req, res) => {
  const user = await User.findById(req.params.user); //.populate('exercises');
  res.json(user)
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
