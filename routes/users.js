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
  if (!req.session) {
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

router.put('/updateInfo', async (req, res) => {
  try {
    const currentUserId = req.session.user_id;

    if (!currentUserId) {
      return res.status(401).send('User not logged in');
    }

    const {
      firstName,
      lastName,
      street,
      city,
      province,
      country,
      postal_code,
    } = req.body;

    // Update customer information
    await prisma.customer.update({
      where: { customer_id: currentUserId },
      data: {
        firstName,
        lastName,
      },
    });

    // Update or create the customer's address
    await prisma.address.upsert({
      where: { id: currentUserId },
      update: {
        street,
        city,
        province,
        country,
        postal_code,
      },
      create: {
        id: currentUserId,
        street,
        city,
        province,
        country,
        postal_code,
      },
    });

    res.send('Profile updated successfully');
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).send('Failed to update profile');
  }
});


router.get('/basic', async (req, res) => {
  try {
    // Retrieve the customer_id from the session
    const currentUserId = req.session.user_id;

    if (!currentUserId) {
      return res.status(401).send('User not logged in');
    }

    // Fetch the customer's basic information
    const customer = await prisma.customer.findUnique({
      where: { customer_id: currentUserId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    // Fetch the customer's address (if exists)
    const address = await prisma.address.findFirst({
      where: { id: currentUserId }, 
    });

    if (!customer) {
      return res.status(404).send('Customer not found');
    }

    // Combine customer and address info
    const responseData = {
      ...customer,
      address,
    };

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching customer info:', error);
    res.status(500).send('Internal server error');
  }
});


// Orders route
router.get('/orders', async (req, res) => {
  try {
   
    const userId = req.session.user_id;

    if (!userId) {
      return res.status(401).json({ message: 'User not logged in' });
    }

    // Fetch all transactions for the user
    const orders = await prisma.transaction.findMany({
      where: { userId: parseInt(userId) },
      include: { product: true }, // Include product details
    });

    if (orders.length === 0) {
      return res.status(404).json({ message: 'You have not purchased any products yet.' });
    }

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Cart route
router.get('/cart', async (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.status(401).json({ message: 'User not logged in' });
  }

  try {
    // Fetch all cart items for the user from the CartItem table
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: parseInt(userId) },
      include: { product: true }, // Include product details
    });

    if (cartItems.length === 0) {
      return res.status(404).json({ message: 'Your cart is empty.' });
    }

    res.json(cartItems);
  } catch (error) {
    console.error('Error fetching cart items:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route to handle adding a product to the cart
router.post('/addToCart', async (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.status(401).json({ message: 'User not logged in' });
  }

  const { productId } = req.body;
  if (!productId) {
    return res.status(400).json({ message: 'Product ID is required' });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
    });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if the product is already in the cart
    const existingCartItem = await prisma.cartItem.findFirst({
      where: { userId: parseInt(userId), productId: parseInt(productId) },
    });

    if (existingCartItem) {
      // Increase the quantity if the product is already in the cart
      await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + 1 },
      });
      return res.json({ message: 'Product quantity updated in cart' });
    }

    // Otherwise, add a new item to the cart
    const cartItem = await prisma.cartItem.create({
      data: {
        userId: parseInt(userId),
        productId: product.id,
        quantity: 1, // Default quantity
      },
    });

    res.json({ message: 'Product added to cart successfully', cartItem });
  } catch (error) {
    console.error('Error adding product to cart:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/cart', async (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.status(401).json({ message: 'User not logged in' });
  }

  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: parseInt(userId) },
      include: { product: true }, // Include product details
    });

    if (cartItems.length === 0) {
      return res.status(404).json({ message: 'Your cart is empty.' });
    }

    res.json(cartItems);
  } catch (error) {
    console.error('Error fetching cart items:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Route to remove an item from the cart
router.delete('/cart/:id', async (req, res) => {
  const user = req.session.user;
  if (!user || !user.customer_id) {
    return res.status(401).json({ message: 'User not logged in' });
  }

  const customerId = user.customer_id;
  const itemId = parseInt(req.params.id);

  try {
    // Check if the cart item exists and belongs to the user
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
    });

    if (!cartItem || cartItem.userId !== customerId) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    // Delete the cart item
    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    res.json({ message: 'Item removed from cart successfully' });
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route to update the quantity of an item in the cart
router.put('/cart/:id', async (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.status(401).json({ message: 'User not logged in' });
  }

  const itemId = parseInt(req.params.id);
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return res.status(400).json({ message: 'Invalid quantity' });
  }

  try {
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
    });

    if (!cartItem || cartItem.userId !== userId) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    // Update the quantity
    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    res.json({ message: 'Cart item quantity updated successfully' });
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/purchase', async (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.status(401).json({ message: 'User not logged in' });
  }

  // Extract data from the request
  const { productIds, cardNumber, cardholderName, cvv, expiryDate } = req.body;

  // Check if all payment details are provided
  if (!cardNumber || !cardholderName || !cvv || !expiryDate) {
    return res.status(400).json({ message: 'All payment details are required' });
  }

  // Validate payment details
  const cardNumberRegex = /^\d{16}$/;
  const nameRegex = /^[a-zA-Z\s]+$/;
  const cvvRegex = /^\d{3}$/;
  const expiryDateRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;

  if (
    !cardNumberRegex.test(cardNumber) ||
    !nameRegex.test(cardholderName) ||
    !cvvRegex.test(cvv) ||
    !expiryDateRegex.test(expiryDate)
  ) {
    return res.status(400).json({ message: 'Invalid input format' });
  }

  try {
    let totalCost = 0;

    // Calculate total cost for multiple products
    if (productIds && productIds.length > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
      });

      if (products.length === 0) {
        return res.status(404).json({ message: 'No products found' });
      }

      // Calculate total cost
      products.forEach((product) => {
        totalCost += parseFloat(product.cost);
      });
    } else {
      return res.status(400).json({ message: 'No products provided' });
    }

    // Create a single transaction record with product IDs and total amount
    await prisma.transaction.create({
      data: {
        userId,
        productIds: productIds.join(','), // Store product IDs as a comma-separated string
        totalAmount: totalCost,           // Store the total cost
      },
    });

    res.json({ message: 'Purchase successful', totalCost: totalCost.toFixed(2) });
  } catch (error) {
    console.error('Error processing purchase:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
