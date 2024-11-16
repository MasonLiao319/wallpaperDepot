import bcrypt from 'bcrypt';

// functions for password hashing
async function hashPassword(plaintextPassword) {
  const hash = await bcrypt.hash(plaintextPassword, 10);
  console.log(hash);
  return hash;
}

async function comparePassword(plaintextPassword, hash) {
  return await bcrypt.compare(plaintextPassword, hash);
}

// function to hash sensitive user data (e.g., credit card details)
async function hashUserData(plaintextData) { // Updated to match your usage
  const hash = await bcrypt.hash(plaintextData, 10);
  return hash;
}

// function to compare sensitive data
async function compareUserData(plaintextData, hash) { // Updated to match your usage
  return await bcrypt.compare(plaintextData, hash);
}

// Export all functions
export { hashPassword, comparePassword, hashUserData, compareUserData };
