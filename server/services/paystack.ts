import { ENV } from "../_core/env";

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data?: {
    id: number;
    reference: string;
    amount: number;
    paid_at: string;
    status: string;
    customer: {
      id: number;
      email: string;
      first_name: string;
      last_name: string;
    };
  };
}

/**
 * Initialize a Paystack payment
 */
export async function initializePayment(
  email: string,
  amount: number,
  reference: string,
  metadata?: Record<string, unknown>,
  callbackUrl?: string
): Promise<PaystackInitializeResponse> {
  try {
    const secretKey = ENV.paystackSecretKey;
    
    if (!secretKey) {
      throw new Error("PAYSTACK_SECRET_KEY is not configured in environment variables");
    }

    // Use default callback URL if not provided
    const callback = callbackUrl || `http://localhost:3000/payment/callback`;

    console.log("[Paystack] Initializing payment:", {
      email,
      amount: amount * 100,
      reference,
      callback_url: callback,
      hasSecretKey: !!secretKey,
      secretKeyPrefix: secretKey.substring(0, 8) + "...",
    });

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100), // Convert to kobo
        reference,
        callback_url: callback,
        metadata,
      }),
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      console.error("[Paystack] API error response:", {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      });
      throw new Error(`Paystack API error: ${response.statusText} - ${responseData?.message || 'Unknown error'}`);
    }

    return responseData;
  } catch (error) {
    console.error("[Paystack] Initialize payment error:", error);
    throw error;
  }
}

/**
 * Verify a Paystack payment
 */
export async function verifyPayment(
  reference: string
): Promise<PaystackVerifyResponse> {
  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ENV.paystackSecretKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Paystack API error: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("[Paystack] Verify payment error:", error);
    throw error;
  }
}

/**
 * Check if payment was successful
 */
export function isPaymentSuccessful(data: PaystackVerifyResponse): boolean {
  return (
    data.status === true &&
    data.data?.status === "success"
  );
}
