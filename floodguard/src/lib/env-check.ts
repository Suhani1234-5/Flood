// src/lib/env-check.ts

export const config = {
  // Yeh variable sirf backend par chalega
  dbUrl: process.env.DATABASE_URL, 
  
  // Yeh variable frontend/client par bhi chalega kyunki NEXT_PUBLIC_ laga hai
  appName: process.env.NEXT_PUBLIC_APP_NAME,
};

// Console log sirf test karne ke liye (Production mein hata dena chahiye)
console.log("App Name:", config.appName);