import express from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../lib/utility.js';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/signup', async (req, res) => {
  try {
    // Get user input
    const { email, password, firstName, lastName } = req.body;

    // Validate the input
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).send('Missing required fields');
    }

    // Check if user already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { email },
    });
    if (existingCustomer) {
      return res.status(400).send('User already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Add user to database
    const customer = await prisma.customer.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
      },
    });

    // Send response
    res.json({ user: customer.email });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

router.post('/login', async (req, res) => {
  try {
    // Get user inputs
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).send('Missing required fields');
    }

    // Find user in database
    const existingCustomer = await prisma.customer.findUnique({
      where: { email },
    });
    if (!existingCustomer) {
      return res.status(404).send('User not found');
    }

    // Compare/verify password
    const passwordMatch = await comparePassword(password, existingCustomer.password);
    if (!passwordMatch) {
      return res.status(401).send('Invalid password');
    }

    // Setup user session
    req.session.user = existingCustomer.email;
    req.session.user_id = existingCustomer.customer_id;
    console.log('Logged in User: ' + req.session.user);

    // Send response
    res.send('Login successful');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

router.post('/logout', (req, res) => {
    if (!req.session.user) {
      return res.status(400).send('No active session to log out from');
    }
  
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).send('Failed to log out. Please try again.');
      }
      
      res.clearCookie('connect.sid'); // Clear the session cookie
      res.send('Logged out successfully');
    });
  });
  
router.get('/getsession', (req, res) => {
  res.json({ user: req.session.user });
});

export default router;
