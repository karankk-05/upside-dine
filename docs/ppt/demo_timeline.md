# Upside Dine Demo Timeline

This plan is for a `10-12 minute` live demo with multiple people role-playing in parallel.

## Roles on screen

- `Student`
- `Mess Worker`
- `Canteen Manager`
- `Delivery Coordinator`

## Happy-path features to show

- Student dashboard as the single entry point
- Mess extras booking
- Booking detail page with QR code
- Mess worker scan and verification
- Crowd monitoring screen with live density and recommendation
- Canteen menu browsing and cart flow
- Checkout and payment success
- Canteen manager order acceptance and status progression
- Delivery coordinator assignment
- Student delivery OTP
- Delivery coordinator OTP confirmation
- Final proof through order status/history and completed delivery state

## Suggested run of show

### `0:00 - 1:00` Opening context

- Start on the `Student Dashboard`
- Point out that one student can access mess, crowd, and canteen flows from the same app
- Introduce the other live role players already waiting on their own dashboards

### `1:00 - 3:00` Mess extras flow

- Student opens `Book Extras`
- Selects an extra item and confirms booking
- Open the booking detail page
- Show the generated `QR code`

### `3:00 - 4:00` Mess worker verification

- Switch to the `Mess Worker` screen
- Worker scans or verifies the booking
- Show the success state and that the issue happens at the counter in real time

### `4:00 - 5:15` Crowd monitoring

- Return to the student
- Open the `Crowd Monitor`
- Show current density, live mess visibility, and best-time recommendation
- Keep this short and visual

### `5:15 - 6:45` Canteen ordering + payment

- Student opens a canteen
- Adds items to cart
- Proceeds to checkout
- Completes payment
- Open the student order detail page immediately after order creation

### `6:45 - 8:45` Canteen manager fulfilment

- Switch to the `Canteen Manager` dashboard
- Open the incoming order
- Move it through:
  `Accept -> Preparing -> Ready`
- Assign a `Delivery Coordinator`

### `8:45 - 10:15` Delivery handoff + OTP

- Switch to the `Delivery Coordinator`
- Show the order in pending or active deliveries
- Open the active delivery view
- Student reads out the `OTP`
- Delivery coordinator enters the OTP and confirms delivery

### `10:15 - 11:30` Proof + recap

- Show the final completed state
- Point out the updated student order status and delivery completion
- Close by summarizing the three connected workflows:
  `mess convenience`, `crowd awareness`, and `canteen delivery`

## PPT slide mapping

- `Demo Workflow 01`: Student -> Mess Worker
- `Demo Workflow 02`: Student -> Crowd -> Canteen Order
- `Demo Workflow 03`: Canteen Manager -> Delivery Coordinator -> OTP Closure

## Pre-demo checklist

- Keep all four role dashboards logged in before the presentation starts
- Ensure the mess extras menu already has at least one bookable item
- Ensure the canteen already has active menu items
- Keep one student order window ready to show order status quickly
- Keep one manager order window ready for status updates
- Keep one delivery dashboard ready for immediate acceptance
- Rehearse the OTP handoff once before the final presentation
- Avoid side branches during the demo:
  `preordering`, `manager cancellation`, `QR failure`, and other exception paths
