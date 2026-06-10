import { useEffect, useState } from 'react'

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js'

export function useRazorpay() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Don't load twice
    if (document.querySelector(`script[src="${RAZORPAY_SCRIPT}"]`)) {
      setLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src  = RAZORPAY_SCRIPT
    script.async = true
    script.onload  = () => setLoaded(true)
    script.onerror = () => console.error('Razorpay SDK failed to load')
    document.body.appendChild(script)

    return () => {
      // Don't remove — keep for reuse across navigations
    }
  }, [])

  // openCheckout — call this when user clicks "Enroll now"
  // options: { orderId, amount, currency, courseName,
  //            userName, userEmail, userPhone,
  //            onSuccess, onFailure }
  const openCheckout = ({
    orderId,
    amount,
    currency = 'INR',
    courseName,
    userName,
    userEmail,
    userPhone = '',
    onSuccess,
    onFailure,
  }) => {
    if (!loaded || !window.Razorpay) {
      console.error('Razorpay not loaded yet')
      return
    }

    const options = {
      key:          import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount,
      currency,
      name:         'eduroot',
      description:  courseName,
      image:        'https://eduroot.online/logo.png',
      order_id:     orderId,
      prefill: {
        name:    userName  || '',
        email:   userEmail || '',
        contact: userPhone || '',
      },
      notes: {
        course: courseName,
      },
      theme: {
        color: '#0F3D2E',
      },
      modal: {
        // Don't close on backdrop click during payment
        backdropclose: false,
        escape:        false,
        ondismiss: () => {
          onFailure?.({ description: 'Payment cancelled by user' })
        },
      },
      handler: (response) => {
        // response contains:
        //   razorpay_payment_id
        //   razorpay_order_id
        //   razorpay_signature
        onSuccess?.(response)
      },
    }

    const rzp = new window.Razorpay(options)

    // Also listen for payment failure events
    rzp.on('payment.failed', (response) => {
      onFailure?.(response.error)
    })

    rzp.open()
  }

  return { loaded, openCheckout }
}
