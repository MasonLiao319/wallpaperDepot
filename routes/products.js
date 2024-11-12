import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();

const prisma = new PrismaClient();

router.get('/all', async (req, res) => {
    const products = await prisma.products.findMany();
    if (products.length === 0) {
      res.status(404).json({ message: 'No wallpapers found' }); // Responds with 404 if no records are found
    } else {
      res.json(products); // Responds with the list of wallpapers as a JSON array
    }
  });
  
  
  // Get a contact by id
  router.get('/:id', async (req, res) => {
    const id = req.params.id;
  
    //validation: id is a number
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid wallpaper ID' });
      return;
    }
  
    //By ID
    const product = await prisma.product.findUnique({
  
      // where clause
      where: {
        id: parseInt(id),
      },
    });
  
  
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Wallpaper not found.' });
    }
  
  });


  


export default router;