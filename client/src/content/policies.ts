/**
 * Starter text for the footer pages. Check every line matches how you really
 * run the shop before going live, especially returns, warranty and privacy.
 */
export interface PolicyPage {
  title: string;
  intro: string;
  sections: { heading: string; body: string[] }[];
}

export const POLICIES: Record<string, PolicyPage> = {
  shipping: {
    title: 'Shipping and delivery',
    intro: 'We deliver across Bangladesh, and you pay in cash when your order arrives.',
    sections: [
      {
        heading: 'Charges and times',
        body: [
          'Inside Rajshahi: ৳50, usually 1 to 2 days.',
          'Inside Dhaka: ৳50, usually 2 to 3 days.',
          'Everywhere else in Bangladesh: ৳120, usually 3 to 5 days.',
          'Couriers don’t deliver on Fridays, so a Friday date moves to Saturday.',
        ],
      },
      {
        heading: 'What happens after you order',
        body: [
          'We call the number you gave at checkout to confirm the order. Please keep your phone on.',
          'Once it’s confirmed we pack it and hand it to a courier, and you get an email with the courier’s name and tracking number.',
          'You can follow every step from My orders, or from Track your order with your order number and phone number.',
        ],
      },
    ],
  },
  returns: {
    title: 'Returns and refunds',
    intro: 'Changed your mind? You have 7 days from delivery to send it back.',
    sections: [
      {
        heading: 'How to return',
        body: [
          'Contact us within 7 days of delivery with your order number.',
          'The product must be unused, with its box and everything that came in it.',
          'We arrange the pickup or tell you where to send it.',
        ],
      },
      {
        heading: 'Refunds',
        body: ['Once we receive and check the item, we refund you by bKash, Nagad or bank transfer within 5 working days.', 'Delivery charges are not refunded unless the item was faulty or wrong.'],
      },
    ],
  },
  warranty: {
    title: 'Warranty',
    intro: 'Every VoltNest product comes with an 18-month warranty from the delivery date.',
    sections: [
      {
        heading: 'What’s covered',
        body: ['Faults in materials or how it was made, under normal use.', 'We repair or replace the product. If we can’t, we refund it.'],
      },
      {
        heading: 'What isn’t covered',
        body: ['Damage from drops, water, or using the wrong voltage.', 'Normal wear, like scratches on the case or a frayed cable end from bending.'],
      },
      { heading: 'How to claim', body: ['Contact us with your order number and a short description or photo of the problem.'] },
    ],
  },
  contact: {
    title: 'Contact us',
    intro: 'We answer Saturday to Thursday, 10 am to 8 pm.',
    sections: [
      { heading: 'Email', body: ['support@voltnest.test'] },
      { heading: 'About an order', body: ['Have your order number ready. It starts with VN- and is in your confirmation email.'] },
    ],
  },
  about: {
    title: 'About VoltNest',
    intro: 'VoltNest makes chargers, power banks, cables and audio gear for everyday use in Bangladesh.',
    sections: [
      {
        heading: 'What we care about',
        body: ['Gear that charges fast and safely, at a fair price.', 'Delivery to your door anywhere in the country, with Cash on Delivery.', 'Warranty and support that actually answer.'],
      },
    ],
  },
  privacy: {
    title: 'Privacy policy',
    intro: 'This page explains what we collect when you shop with us, and why.',
    sections: [
      {
        heading: 'What we collect',
        body: [
          'Your name, phone number, email and delivery address, so we can deliver your order and contact you about it.',
          'Your order history, so you can track orders and review products.',
          'If you make an account, your password is stored scrambled (hashed). We can never see it.',
        ],
      },
      {
        heading: 'Who sees it',
        body: ['Our staff, to process orders.', 'The courier, who gets your name, phone and address for delivery.', 'We never sell your information.'],
      },
      { heading: 'Your choices', body: ['Ask us to correct or delete your details at any time through the contact page.'] },
    ],
  },
  terms: {
    title: 'Terms of service',
    intro: 'By ordering from VoltNest you agree to these terms.',
    sections: [
      {
        heading: 'Orders and prices',
        body: [
          'Prices are in Bangladeshi taka and include VAT where it applies.',
          'An order is accepted once we confirm it by phone. We may cancel an order we can’t confirm.',
          'If a price on the site is clearly wrong, we’ll tell you before confirming the order.',
        ],
      },
      { heading: 'Payment', body: ['Cash on Delivery: please pay the courier the full total shown in your confirmation email.'] },
      { heading: 'Returns and warranty', body: ['See the Returns and refunds and Warranty pages.'] },
    ],
  },
};
