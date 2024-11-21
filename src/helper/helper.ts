const axios = require("axios");

export function generatePaymentReference(length = 20) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let reference = "R"; // Start with 'R' as per your example
  for (let i = 0; i < length - 1; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    reference += characters[randomIndex];
  }
  return reference;
}

// Function to initiate payment
export async function initiatePayment(data: any) {
  const baseUrl = "https://api.ercaspay.com/api/v1";
  const secretKey = process.env.ECRS_KEY;
  try {
    const response = await axios.post(`${baseUrl}/payment/initiate`, data, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${secretKey}`,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error(
      "Error Initiating Payment:",
      error.response?.data || error.message
    );
  }
}

export const verifyTransaction = async (transactionRef: string) => {
  const baseUrl = "https://api.ercaspay.com/api/v1";
  const url = `${baseUrl}/payment/transaction/verify/${transactionRef}`;
  const secretKey = process.env.ECRS_KEY;
  try {
    const response = await axios.get(url, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${secretKey}`,
      },
    });
    return response.data;
  } catch (error : any) {
    console.error("API Error:", error.response.data);
    return error.response.data; // Return error response data
  }
};


