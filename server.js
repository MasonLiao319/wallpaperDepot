import express from 'express';
import cors from 'cors';
import usersRouter from './routes/users.js';
import productsRouter from './routes/products.js';
import session from 'express-session';

const port = process.env.PORT || 3001;
const app = express();

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

//cors middleware
// cors middleware
app.use(cors({
  origin: 'http://localhost:5173', // react client
  credentials: true
}));


// session middleware
app.use(session({
  secret: '0*nhfg-4svf^gdhfu76#Ra2A',
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: false,  // Set to `true` if using HTTPS in production
    sameSite: 'lax',  // Consider 'none' if client and server are on different origins
    maxAge: 3600000 // 1 hour in milliseconds
  }
}));
 
// routes
// app.use('/api/', homeRouter);
app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});