import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.0.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!stripeSecretKey || !webhookSecret) {
      throw new Error('Stripe configuration missing')
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify webhook signature
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      throw new Error('Missing stripe-signature header')
    }

    const body = await req.text()
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return new Response(
        JSON.stringify({ error: 'Webhook signature verification failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Received event:', event.type)

    // Handle specific events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'subscription' && session.subscription) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          const userId = subscription.metadata.supabase_user_id
          const planId = subscription.metadata.plan_id || 'pro'
          const billingCycle = subscription.metadata.billing_cycle || 'monthly'

          if (userId) {
            // Update subscription in database
            await supabase
              .from('subscriptions')
              .upsert({
                user_id: userId,
                plan_id: planId,
                status: subscription.status === 'trialing' ? 'trialing' : 'active',
                billing_cycle: billingCycle,
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: subscription.id,
                stripe_price_id: subscription.items.data[0]?.price.id,
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end,
              })

            // Create notification
            await supabase.from('notifications').insert({
              user_id: userId,
              type: 'subscription_activated',
              title: 'Suscripcion activada',
              message: `Tu plan ${planId.toUpperCase()} ha sido activado correctamente.`,
              icon: '✨',
              data: { plan_id: planId },
            })

            console.log(`Subscription activated for user ${userId}: ${planId}`)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata.supabase_user_id

        if (userId) {
          const newPlanId = subscription.metadata.plan_id || 'pro'

          await supabase
            .from('subscriptions')
            .update({
              plan_id: newPlanId,
              status: subscription.status === 'past_due' ? 'past_due' :
                      subscription.status === 'trialing' ? 'trialing' :
                      subscription.cancel_at_period_end ? 'cancelled' : 'active',
              stripe_price_id: subscription.items.data[0]?.price.id,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
            })
            .eq('user_id', userId)

          console.log(`Subscription updated for user ${userId}`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata.supabase_user_id

        if (userId) {
          // Downgrade to free plan
          await supabase
            .from('subscriptions')
            .update({
              plan_id: 'free',
              status: 'active',
              stripe_subscription_id: null,
              stripe_price_id: null,
              current_period_start: null,
              current_period_end: null,
              cancel_at_period_end: false,
            })
            .eq('user_id', userId)

          // Create notification
          await supabase.from('notifications').insert({
            user_id: userId,
            type: 'subscription_cancelled',
            title: 'Suscripcion cancelada',
            message: 'Tu suscripcion ha sido cancelada. Has vuelto al plan Free.',
            icon: '⚠️',
          })

          console.log(`Subscription cancelled for user ${userId}`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const userId = subscription.metadata.supabase_user_id

          if (userId) {
            // Mark as past due
            await supabase
              .from('subscriptions')
              .update({ status: 'past_due' })
              .eq('user_id', userId)

            // Create notification
            await supabase.from('notifications').insert({
              user_id: userId,
              type: 'payment_failed',
              title: 'Error en el pago',
              message: 'No pudimos procesar tu pago. Por favor actualiza tu metodo de pago.',
              icon: '❌',
              action_url: '/settings',
            })

            console.log(`Payment failed for user ${userId}`)
          }
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string

        if (subscriptionId && invoice.billing_reason === 'subscription_cycle') {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const userId = subscription.metadata.supabase_user_id

          if (userId) {
            // Update subscription dates
            await supabase
              .from('subscriptions')
              .update({
                status: 'active',
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              })
              .eq('user_id', userId)

            // Create notification
            await supabase.from('notifications').insert({
              user_id: userId,
              type: 'payment_succeeded',
              title: 'Pago procesado',
              message: `Tu pago de $${(invoice.amount_paid / 100).toFixed(2)} ha sido procesado correctamente.`,
              icon: '✅',
            })

            console.log(`Payment succeeded for user ${userId}`)
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
