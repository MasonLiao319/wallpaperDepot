// This script seeds the database with initial product data.
// Use this script for development or testing purposes only.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  
  const products = [
    {
      name: "Morandi 1",
      description: "Beautiful minimal wallpaper 1",
      cost: 2.99,
      filename: "pic1.png",
    },
    {
      name: "Morandi 2",
      description: "Beautiful minimal wallpaper 2",
      cost: 3.99,
      filename: "pic2.png",
    },
    {
      name: "Morandi 3",
      description: "Beautiful minimal wallpaper 3",
      cost: 4.99,
      filename: "pic3.png",
    },
    {
      name: "Morandi 4",
      description: "Beautiful minimal wallpaper 4",
      cost: 3.49,
      filename: "pic4.png",
    },
    {
      name: "Morandi 5",
      description: "Beautiful minimal wallpaper 5",
      cost: 5.29,
      filename: "pic5.png",
    },
    {
      name: "Morandi 6",
      description: "Beautiful minimal wallpaper 6",
      cost: 1.99,
      filename: "pic6.png",
    },
    {
      name: "Morandi 7",
      description: "Beautiful minimal wallpaper 7",
      cost: 2.99,
      filename: "pic7.png",
    },
    {
      name: "Morandi 8",
      description: "Beautiful minimal wallpaper 8",
      cost: 3.69,
      filename: "pic8.png",
    },
    {
      name: "Morandi 9",
      description: "Beautiful minimal wallpaper 9",
      cost: 3.99,
      filename: "pic9.png",
    },
    {
      name: "Morandi 10",
      description: "Beautiful minimal wallpaper 10",
      cost: 4.99,
      filename: "pic10.png",
    },

    {
      name: "Pixel 11",
      description: "Beautiful minimal wallpaper 9",
      cost: 3.99,
      filename: "pic1.png",
    },
    {
      name: "Pixel 12",
      description: "Beautiful minimal wallpaper 10",
      cost: 4.99,
      filename: "pic12.png",
    },


  ];

  
  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
  }

  console.log("Product data seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
