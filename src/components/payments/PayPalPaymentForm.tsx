"use client"

import { useState } from "react"
import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer,
  ReactPayPalScriptOptions,
} from "@paypal/react-paypal-js"
import { fetchWithCsrf } from "@/lib/client/csrf"
import { logError, logInfo } from "@/lib/error-logger"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Define the props for the component
export interface PayPalPaymentFormProps {
  paypalOrderId: string // This is the key prop
  recipientId: string
  amount: number // in cents
  message?: string
  storyId?: string | null
  storyTitle?: string | null
  onSuccess: () => void
  onError: (error: Error) => void
  onCancel: () => void
}

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ""

// This component contains the PayPal Buttons and related logic.
// It must be a child of PayPalScriptProvider to use the usePayPalScriptReducer hook.
const PayPalButtonsComponent = (props: PayPalPaymentFormProps) => {
  const { paypalOrderId, recipientId, amount, message, storyId, onSuccess, onError, onCancel } = props
  const [{ isPending, isRejected }] = usePayPalScriptReducer()
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const createOrder = () => {
    logInfo('PayPal createOrder callback triggered', { paypalOrderId })
    // We already have the order ID from the backend, so we just return it.
    return Promise.resolve(paypalOrderId)
  }

  const handleApprove = async (data: { orderID: string }, actions: any) => {
    logInfo('PayPal approve callback triggered', { orderId: data.orderID })

    try {
      setIsProcessing(true)
      toast({
        title: "Processing Payment",
        description: "Please wait while we process your payment...",
      })

      const details = await actions.order.capture()
      logInfo('PayPal payment captured:', { details })

      if (details?.status === "COMPLETED") {
        const response = await fetchWithCsrf('/api/donations/record-paypal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipientId: recipientId,
            amount: amount,
            message: message,
            storyId: storyId,
            paypalOrderId: data.orderID,
            paypalTransactionId: details.purchase_units[0]?.payments?.captures[0]?.id,
          }),
        })

        const responseData = await response.json()

        if (!response.ok) {
          logError(new Error('Failed to record PayPal payment'), { details: responseData })
        }

        toast({
          title: "Payment Successful!",
          description: "Your donation has been processed successfully. Thank you for your support!",
          variant: "default",
        })

        setTimeout(() => {
          onSuccess()
        }, 1500)
      } else {
        throw new Error("Payment was not completed")
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logError(err, { context: 'Error capturing PayPal payment' })
      toast({
        title: "Payment Failed",
        description: err.message,
        variant: "destructive",
      })
      onError(err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleError = (err: any) => {
    const error = err instanceof Error ? err : new Error("An error occurred with the PayPal payment.")
    logError(error, { context: 'PayPalButtons onError' })
    onError(error)
  }

  if (isRejected) {
    return (
      <div className="p-4 text-center text-destructive">
        <p>Failed to load PayPal checkout.</p>
        <p>Please try again later.</p>
      </div>
    )
  }

  return (
    <>
      {(isPending || isProcessing) && (
        <div className="flex justify-center items-center p-4">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}
      <div style={{ display: isPending || isProcessing ? 'none' : 'block' }}>
        <PayPalButtons
          key={paypalOrderId}
          style={{ layout: "vertical" }}
          createOrder={createOrder}
          onApprove={handleApprove}
          onError={handleError}
          onCancel={() => {
            logInfo('PayPal payment cancelled')
            onCancel()
          }}
        />
      </div>
    </>
  )
}

// The main component that provides the PayPal script
export function PayPalPaymentForm(props: PayPalPaymentFormProps) {
  if (!PAYPAL_CLIENT_ID) {
    props.onError(new Error("PayPal client ID is not configured."))
    return (
      <div className="p-4 text-center text-destructive">
        <p>PayPal is not configured correctly.</p>
      </div>
    )
  }

  const paypalOptions: ReactPayPalScriptOptions = {
    clientId: PAYPAL_CLIENT_ID,
    currency: "USD",
    intent: "capture",
  }

  return (
    <PayPalScriptProvider options={paypalOptions}>
      <PayPalButtonsComponent {...props} />
    </PayPalScriptProvider>
  )
}
