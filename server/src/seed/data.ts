/**
 * Demo catalogue for VoltNest. All names, specs and copy are original —
 * no Anker brand names, product names, photos or marketing text.
 * Prices are in BDT.
 */

export interface SeedCategory {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
}

export const categories: SeedCategory[] = [
  { name: 'Chargers', slug: 'chargers', description: 'Wall and wireless chargers from 20W to 140W.', sortOrder: 1 },
  { name: 'Power Banks', slug: 'power-banks', description: 'Portable batteries for phones, tablets and laptops.', sortOrder: 2 },
  { name: 'Cables', slug: 'cables', description: 'Braided and silicone cables built to bend 30,000+ times.', sortOrder: 3 },
  { name: 'Hubs & Docks', slug: 'hubs-docks', description: 'Add HDMI, USB and Ethernet ports to your laptop.', sortOrder: 4 },
  { name: 'Audio', slug: 'audio', description: 'Earbuds, headphones and speakers.', sortOrder: 5 },
  { name: 'Car Charging', slug: 'car-charging', description: 'Car chargers, mounts and jump starters.', sortOrder: 6 },
];

type Options = { color?: string; wattage?: number; capacity?: number; ports?: number; length?: number };

interface SeedVariantInput {
  name: string;
  options: Options;
  price: number;
  compareAtPrice?: number;
  stock: number;
}

interface SeedProductInput {
  name: string;
  category: string; // category slug
  short: string;
  highlights: string[];
  specs: [string, string][];
  variants: SeedVariantInput[];
  sales: number;
  daysAgo: number; // published this many days ago → drives "New Arrivals"
  featured?: boolean;
}

const v = (name: string, options: Options, price: number, stock: number, compareAtPrice?: number): SeedVariantInput => ({
  name,
  options,
  price,
  stock,
  compareAtPrice,
});

const products: SeedProductInput[] = [
  // ───────────── Chargers ─────────────
  {
    name: 'VoltNest Nova 20W USB-C Charger', category: 'chargers', sales: 860, daysAgo: 80, featured: true,
    short: 'A palm-sized fast charger that takes most phones to 50% in about 30 minutes.',
    highlights: ['20W USB-C Power Delivery', 'Fold-flat pins for travel', 'Overheat and surge protection'],
    specs: [['Output', '20W max'], ['Ports', '1 × USB-C'], ['Input', '100–240V AC'], ['Weight', '32 g']],
    variants: [v('White', { color: 'White', wattage: 20, ports: 1 }, 1290, 120, 1590), v('Black', { color: 'Black', wattage: 20, ports: 1 }, 1290, 80, 1590)],
  },
  {
    name: 'VoltNest Nova 30W GaN Charger', category: 'chargers', sales: 640, daysAgo: 60,
    short: 'GaN chips keep it small and cool while charging a phone or a tablet at full speed.',
    highlights: ['30W from a 30% smaller body', 'Charges iPad and MacBook Air', 'Temperature monitoring'],
    specs: [['Output', '30W max'], ['Ports', '1 × USB-C'], ['Technology', 'GaN'], ['Weight', '45 g']],
    variants: [v('White', { color: 'White', wattage: 30, ports: 1 }, 1990, 95, 2390), v('Black', { color: 'Black', wattage: 30, ports: 1 }, 1990, 60, 2390)],
  },
  {
    name: 'VoltNest Nova Duo 45W GaN Charger', category: 'chargers', sales: 410, daysAgo: 40,
    short: 'Two USB-C ports that share 45W, so your phone and earbuds charge together.',
    highlights: ['Dual USB-C', 'Smart power split between ports', 'Foldable pins'],
    specs: [['Output', '45W max (single port)'], ['Ports', '2 × USB-C'], ['Technology', 'GaN'], ['Weight', '78 g']],
    variants: [v('Graphite', { color: 'Graphite', wattage: 45, ports: 2 }, 3290, 70, 3790)],
  },
  {
    name: 'VoltNest Vertex 65W 3-Port GaN Charger', category: 'chargers', sales: 720, daysAgo: 50, featured: true,
    short: 'One charger for a laptop, a phone and a watch, at a size that fits in a pocket.',
    highlights: ['65W for most USB-C laptops', '2 × USB-C + 1 × USB-A', 'Replaces three chargers'],
    specs: [['Output', '65W max'], ['Ports', '2 × USB-C, 1 × USB-A'], ['Technology', 'GaN'], ['Weight', '112 g']],
    variants: [v('Black', { color: 'Black', wattage: 65, ports: 3 }, 4490, 85, 5290), v('White', { color: 'White', wattage: 65, ports: 3 }, 4490, 40, 5290)],
  },
  {
    name: 'VoltNest Vertex 100W 4-Port GaN Charger', category: 'chargers', sales: 290, daysAgo: 12,
    short: 'Enough power for a 16-inch laptop plus three more devices from one wall socket.',
    highlights: ['100W single-port output', '3 × USB-C + 1 × USB-A', 'Live power allocation'],
    specs: [['Output', '100W max'], ['Ports', '3 × USB-C, 1 × USB-A'], ['Technology', 'GaN'], ['Weight', '205 g']],
    variants: [v('Black', { color: 'Black', wattage: 100, ports: 4 }, 6990, 45, 7990)],
  },
  {
    name: 'VoltNest Vertex 140W Desktop Charger', category: 'chargers', sales: 95, daysAgo: 5,
    short: 'A desk-top charging station with a small display that shows the power each port draws.',
    highlights: ['140W total output', 'Port-by-port power display', '1.5 m AC cable'],
    specs: [['Output', '140W max'], ['Ports', '3 × USB-C, 1 × USB-A'], ['Display', 'Mono LCD'], ['Weight', '320 g']],
    variants: [v('Graphite', { color: 'Graphite', wattage: 140, ports: 4 }, 9490, 25)],
  },
  {
    name: 'VoltNest Pad 15W Wireless Charging Pad', category: 'chargers', sales: 330, daysAgo: 70,
    short: 'Set your phone down and it charges, even through most cases up to 5 mm thick.',
    highlights: ['15W fast wireless', 'Non-slip silicone ring', 'Soft LED that dims at night'],
    specs: [['Output', '15W max'], ['Standard', 'Qi'], ['Input', 'USB-C'], ['Diameter', '90 mm']],
    variants: [v('Black', { color: 'Black', wattage: 15, ports: 0 }, 1690, 110), v('White', { color: 'White', wattage: 15, ports: 0 }, 1690, 70)],
  },
  {
    name: 'VoltNest Trio 3-in-1 Wireless Stand', category: 'chargers', sales: 180, daysAgo: 20,
    short: 'Charges a phone, a watch and earbuds at once from one stand on your nightstand.',
    highlights: ['Phone, watch and earbuds together', 'Adjustable phone angle', 'Adapter included'],
    specs: [['Output', '15W + 5W + 3W'], ['Standard', 'Qi'], ['Input', 'USB-C, 36W adapter'], ['Weight', '410 g']],
    variants: [v('Black', { color: 'Black', wattage: 15, ports: 0 }, 4990, 35, 5990)],
  },

  // ───────────── Power Banks ─────────────
  {
    name: 'VoltNest Pocket 5000 Mini Power Bank', category: 'power-banks', sales: 540, daysAgo: 85,
    short: 'Lipstick-sized backup battery that adds about one full charge to most phones.',
    highlights: ['5,000 mAh', '20W USB-C in and out', 'Weighs just 105 g'],
    specs: [['Capacity', '5,000 mAh'], ['Output', '20W max'], ['Ports', '1 × USB-C'], ['Weight', '105 g']],
    variants: [
      v('Black', { color: 'Black', capacity: 5000, wattage: 20, ports: 1 }, 1490, 140),
      v('White', { color: 'White', capacity: 5000, wattage: 20, ports: 1 }, 1490, 90),
      v('Blue', { color: 'Blue', capacity: 5000, wattage: 20, ports: 1 }, 1490, 60),
    ],
  },
  {
    name: 'VoltNest Flux 10000 Slim Power Bank', category: 'power-banks', sales: 980, daysAgo: 75, featured: true,
    short: 'A slim 10,000 mAh battery that charges a phone about twice and fits in a jeans pocket.',
    highlights: ['10,000 mAh', '22.5W fast charging', 'USB-C + USB-A'],
    specs: [['Capacity', '10,000 mAh'], ['Output', '22.5W max'], ['Ports', '1 × USB-C, 1 × USB-A'], ['Weight', '198 g']],
    variants: [
      v('Black', { color: 'Black', capacity: 10000, wattage: 22.5, ports: 2 }, 2290, 150, 2690),
      v('Lavender', { color: 'Lavender', capacity: 10000, wattage: 22.5, ports: 2 }, 2290, 70, 2690),
    ],
  },
  {
    name: 'VoltNest Flux 10000 Magnetic Power Bank', category: 'power-banks', sales: 450, daysAgo: 30,
    short: 'Snaps to the back of magnetic-ready phones and charges without a cable.',
    highlights: ['Magnetic wireless charging', 'Fold-out kickstand', 'USB-C for wired charging'],
    specs: [['Capacity', '10,000 mAh'], ['Wireless output', '15W'], ['Wired output', '20W USB-C'], ['Weight', '220 g']],
    variants: [
      v('White', { color: 'White', capacity: 10000, wattage: 15, ports: 1 }, 3490, 65),
      v('Black', { color: 'Black', capacity: 10000, wattage: 15, ports: 1 }, 3490, 55),
    ],
  },
  {
    name: 'VoltNest Flux 20000 Power Bank', category: 'power-banks', sales: 760, daysAgo: 65,
    short: 'Four phone charges in one battery, with three ports for sharing.',
    highlights: ['20,000 mAh', 'Charges three devices at once', 'LED battery level'],
    specs: [['Capacity', '20,000 mAh'], ['Output', '22.5W max'], ['Ports', '1 × USB-C, 2 × USB-A'], ['Weight', '355 g']],
    variants: [v('Black', { color: 'Black', capacity: 20000, wattage: 22.5, ports: 3 }, 3290, 120, 3790)],
  },
  {
    name: 'VoltNest Flux 20000 PD 65W Laptop Power Bank', category: 'power-banks', sales: 260, daysAgo: 18,
    short: 'Keeps a USB-C laptop running through a long flight or a power cut.',
    highlights: ['65W USB-C for laptops', 'Digital percentage display', 'Recharges in 2.5 hours'],
    specs: [['Capacity', '20,000 mAh'], ['Output', '65W max'], ['Ports', '2 × USB-C, 1 × USB-A'], ['Weight', '420 g']],
    variants: [v('Gray', { color: 'Gray', capacity: 20000, wattage: 65, ports: 3 }, 5990, 50)],
  },
  {
    name: 'VoltNest Titan 26800 Power Bank', category: 'power-banks', sales: 150, daysAgo: 9,
    short: 'Our biggest battery that is still allowed in airline cabin bags.',
    highlights: ['26,800 mAh', '100W USB-C', 'Airline-friendly under 100 Wh'],
    specs: [['Capacity', '26,800 mAh / 96.5 Wh'], ['Output', '100W max'], ['Ports', '2 × USB-C, 1 × USB-A'], ['Weight', '560 g']],
    variants: [v('Black', { color: 'Black', capacity: 26800, wattage: 100, ports: 3 }, 6490, 30)],
  },
  {
    name: 'VoltNest Titan 25000 Power Bank with Built-in Cable', category: 'power-banks', sales: 120, daysAgo: 3,
    short: 'A built-in USB-C cable doubles as a carry strap, so you never forget it at home.',
    highlights: ['Built-in USB-C cable', '45W fast charging', '25,000 mAh'],
    specs: [['Capacity', '25,000 mAh'], ['Output', '45W max'], ['Ports', 'Built-in USB-C, 1 × USB-C, 1 × USB-A'], ['Weight', '490 g']],
    variants: [v('Black', { color: 'Black', capacity: 25000, wattage: 45, ports: 3 }, 4990, 40)],
  },
  {
    name: 'VoltNest Solar 10000 Outdoor Power Bank', category: 'power-banks', sales: 90, daysAgo: 55,
    short: 'Rugged, splash-resistant battery with a solar panel for emergencies and camping.',
    highlights: ['IP65 splash and dust resistant', 'Solar top-up panel', 'Built-in flashlight'],
    specs: [['Capacity', '10,000 mAh'], ['Output', '18W max'], ['Ports', '1 × USB-C, 1 × USB-A'], ['Rating', 'IP65']],
    variants: [
      v('Forest Green', { color: 'Forest Green', capacity: 10000, wattage: 18, ports: 2 }, 2990, 35),
      v('Black', { color: 'Black', capacity: 10000, wattage: 18, ports: 2 }, 2990, 30),
    ],
  },

  // ───────────── Cables ─────────────
  {
    name: 'VoltNest Braid USB-C to USB-C Cable 60W', category: 'cables', sales: 1200, daysAgo: 88, featured: true,
    short: 'Double-braided nylon cable for everyday phone and tablet charging.',
    highlights: ['60W fast charging', 'Tested to 30,000 bends', 'Reusable cable tie'],
    specs: [['Power', '60W max'], ['Data', 'USB 2.0, 480 Mbps'], ['Connectors', 'USB-C to USB-C'], ['Jacket', 'Braided nylon']],
    variants: [v('1 m', { color: 'Black', length: 1, wattage: 60 }, 490, 300), v('2 m', { color: 'Black', length: 2, wattage: 60 }, 590, 220, 690)],
  },
  {
    name: 'VoltNest Braid USB-C to USB-C Cable 240W', category: 'cables', sales: 520, daysAgo: 45,
    short: 'Carries full power for the most demanding USB-C laptops and gaming handhelds.',
    highlights: ['240W EPR support', 'E-marker chip', 'Aluminium connector housings'],
    specs: [['Power', '240W max'], ['Data', 'USB 2.0, 480 Mbps'], ['Connectors', 'USB-C to USB-C'], ['Jacket', 'Braided nylon']],
    variants: [v('1 m', { color: 'Black', length: 1, wattage: 240 }, 890, 140), v('2 m', { color: 'Black', length: 2, wattage: 240 }, 1090, 100)],
  },
  {
    name: 'VoltNest Braid USB-C to Lightning Cable', category: 'cables', sales: 870, daysAgo: 82,
    short: 'Fast charging for Lightning iPhones and AirPods from any USB-C charger.',
    highlights: ['MFi certified', 'Fast charging with 20W+ chargers', 'Braided jacket'],
    specs: [['Power', 'Up to 20W'], ['Certification', 'MFi'], ['Connectors', 'USB-C to Lightning'], ['Jacket', 'Braided nylon']],
    variants: [v('1 m', { color: 'White', length: 1 }, 690, 180), v('2 m', { color: 'White', length: 2 }, 790, 120)],
  },
  {
    name: 'VoltNest Basic USB-A to USB-C Cable', category: 'cables', sales: 640, daysAgo: 90,
    short: 'A dependable cable for older chargers, car ports and computers.',
    highlights: ['3A charging', 'Reinforced strain relief', 'Great value'],
    specs: [['Power', '3A / 15W'], ['Data', 'USB 2.0'], ['Connectors', 'USB-A to USB-C'], ['Jacket', 'PVC']],
    variants: [v('1 m', { color: 'Black', length: 1, wattage: 15 }, 290, 400), v('2 m', { color: 'Black', length: 2, wattage: 15 }, 350, 250)],
  },
  {
    name: 'VoltNest Loop 3-in-1 Charging Cable', category: 'cables', sales: 210, daysAgo: 35,
    short: 'One cable with USB-C, Lightning and Micro-USB tips for the whole family.',
    highlights: ['Three connectors in one', 'Charge up to three devices', 'Tangle-free braid'],
    specs: [['Power', '3A total'], ['Connectors', 'USB-A to USB-C + Lightning + Micro-USB'], ['Length', '1.2 m'], ['Jacket', 'Braided nylon']],
    variants: [v('1.2 m', { color: 'Black', length: 1.2 }, 790, 90)],
  },
  {
    name: 'VoltNest Silicone USB-C Cable 100W', category: 'cables', sales: 330, daysAgo: 14,
    short: 'Soft-touch silicone that never tangles and wipes clean.',
    highlights: ['100W charging', 'Tangle-free silicone', 'Three colours'],
    specs: [['Power', '100W max'], ['Data', 'USB 2.0'], ['Connectors', 'USB-C to USB-C'], ['Length', '1 m']],
    variants: [
      v('Mint', { color: 'Mint', length: 1, wattage: 100 }, 690, 80),
      v('Coral', { color: 'Coral', length: 1, wattage: 100 }, 690, 70),
      v('Black', { color: 'Black', length: 1, wattage: 100 }, 690, 110),
    ],
  },
  {
    name: 'VoltNest Coil Retractable USB-C Cable', category: 'cables', sales: 75, daysAgo: 6,
    short: 'Pulls out to 0.9 m and winds back into a coin-sized case.',
    highlights: ['Retractable design', '60W charging', 'Key-ring loop'],
    specs: [['Power', '60W max'], ['Connectors', 'USB-C to USB-C'], ['Length', '0.9 m extended'], ['Weight', '38 g']],
    variants: [v('0.9 m', { color: 'Black', length: 0.9, wattage: 60 }, 590, 60)],
  },

  // ───────────── Hubs & Docks ─────────────
  {
    name: 'VoltNest Link 5-in-1 USB-C Hub', category: 'hubs-docks', sales: 410, daysAgo: 60, featured: true,
    short: 'Adds 4K HDMI, two USB-A ports and card readers to a thin laptop.',
    highlights: ['4K 30Hz HDMI', '100W pass-through charging', 'SD and microSD'],
    specs: [['Ports', 'HDMI, 2 × USB-A, SD, microSD'], ['Video', '4K @ 30Hz'], ['Pass-through', '100W PD'], ['Housing', 'Aluminium']],
    variants: [v('Space Gray', { color: 'Space Gray', ports: 5 }, 2990, 75, 3490)],
  },
  {
    name: 'VoltNest Link 7-in-1 USB-C Hub', category: 'hubs-docks', sales: 300, daysAgo: 48,
    short: 'The everyday work hub: screen, keyboard, mouse, drive and charger through one port.',
    highlights: ['4K 60Hz HDMI', '3 × USB-A 5 Gbps', '100W pass-through'],
    specs: [['Ports', 'HDMI, 3 × USB-A, USB-C PD, SD, microSD'], ['Video', '4K @ 60Hz'], ['Data', '5 Gbps'], ['Housing', 'Aluminium']],
    variants: [v('Space Gray', { color: 'Space Gray', ports: 7 }, 3990, 60)],
  },
  {
    name: 'VoltNest Link 8-in-1 Ethernet Hub', category: 'hubs-docks', sales: 170, daysAgo: 25,
    short: 'Adds a wired gigabit connection for steady video calls and big downloads.',
    highlights: ['Gigabit Ethernet', '4K HDMI', '100W pass-through'],
    specs: [['Ports', 'Ethernet, HDMI, 3 × USB-A, USB-C PD, SD, microSD'], ['Network', '1 Gbps'], ['Video', '4K @ 60Hz'], ['Housing', 'Aluminium']],
    variants: [v('Space Gray', { color: 'Space Gray', ports: 8 }, 4790, 40)],
  },
  {
    name: 'VoltNest Dock 12-in-1 Docking Station', category: 'hubs-docks', sales: 60, daysAgo: 10,
    short: 'A desk dock that drives two monitors and charges your laptop with one cable.',
    highlights: ['Dual 4K displays', '100W laptop charging', '12 ports'],
    specs: [['Ports', '2 × HDMI, DP, Ethernet, 4 × USB-A, 2 × USB-C, audio'], ['Video', 'Dual 4K @ 60Hz'], ['Power', '100W to laptop'], ['Adapter', '135W included']],
    variants: [v('Space Gray', { color: 'Space Gray', ports: 12 }, 12990, 15)],
  },
  {
    name: 'VoltNest Link USB-C to HDMI 4K Adapter', category: 'hubs-docks', sales: 380, daysAgo: 77,
    short: 'Plug a USB-C laptop or phone into a TV or projector.',
    highlights: ['4K 60Hz', 'Plug and play', 'Braided cable'],
    specs: [['Ports', '1 × HDMI'], ['Video', '4K @ 60Hz'], ['Cable', '15 cm braided'], ['Housing', 'Aluminium']],
    variants: [v('Space Gray', { color: 'Space Gray', ports: 1 }, 1490, 130)],
  },
  {
    name: 'VoltNest Link 4-Port USB 3.0 Hub', category: 'hubs-docks', sales: 290, daysAgo: 84,
    short: 'Four extra USB-A ports for desktops and older laptops.',
    highlights: ['4 × USB-A 5 Gbps', 'Slim, light body', 'Status LED'],
    specs: [['Ports', '4 × USB-A'], ['Data', '5 Gbps'], ['Connector', 'USB-A'], ['Weight', '35 g']],
    variants: [v('Black', { color: 'Black', ports: 4 }, 1290, 160)],
  },

  // ───────────── Audio ─────────────
  {
    name: 'VoltNest Echo Buds Lite True Wireless Earbuds', category: 'audio', sales: 690, daysAgo: 58, featured: true,
    short: 'Light everyday earbuds with punchy sound and 30 hours of total playtime.',
    highlights: ['30 h with case', 'IPX5 sweat resistant', 'Low-latency game mode'],
    specs: [['Playtime', '7 h (30 h with case)'], ['Bluetooth', '5.3'], ['Water resistance', 'IPX5'], ['Charging', 'USB-C']],
    variants: [v('Black', { color: 'Black' }, 2490, 120, 2990), v('White', { color: 'White' }, 2490, 90, 2990)],
  },
  {
    name: 'VoltNest Echo Buds Pro ANC Earbuds', category: 'audio', sales: 240, daysAgo: 16,
    short: 'Active noise cancelling quiets traffic and office chatter.',
    highlights: ['Adaptive noise cancelling', 'Six-mic calls', 'Wireless charging case'],
    specs: [['Playtime', '8 h (36 h with case)'], ['Bluetooth', '5.3, multipoint'], ['ANC', 'Adaptive'], ['Water resistance', 'IPX4']],
    variants: [v('Black', { color: 'Black' }, 5990, 50, 6990), v('Navy', { color: 'Navy' }, 5990, 35, 6990)],
  },
  {
    name: 'VoltNest Echo Open Clip Earbuds', category: 'audio', sales: 80, daysAgo: 4,
    short: 'Open-ear clips that stay put on runs and let you hear the road.',
    highlights: ['Open-ear design', 'Secure clip fit', 'IPX5'],
    specs: [['Playtime', '8 h (32 h with case)'], ['Bluetooth', '5.4'], ['Water resistance', 'IPX5'], ['Weight', '5.5 g per bud']],
    variants: [v('Black', { color: 'Black' }, 4490, 40)],
  },
  {
    name: 'VoltNest Echo Over-Ear ANC Headphones', category: 'audio', sales: 190, daysAgo: 33,
    short: 'Cushioned over-ear headphones with 50 hours of battery and noise cancelling.',
    highlights: ['50 h playtime with ANC off', 'Fold-flat for travel', '3.5 mm wired mode'],
    specs: [['Playtime', '40 h ANC on, 50 h off'], ['Bluetooth', '5.3, multipoint'], ['Drivers', '40 mm'], ['Weight', '255 g']],
    variants: [v('Black', { color: 'Black' }, 7490, 30), v('Sand', { color: 'Sand' }, 7490, 25)],
  },
  {
    name: 'VoltNest Boom Mini Bluetooth Speaker', category: 'audio', sales: 520, daysAgo: 72,
    short: 'A pocket speaker with a strap, loud enough for a room.',
    highlights: ['12 h playtime', 'IPX7 waterproof', 'Pair two for stereo'],
    specs: [['Output', '5W'], ['Playtime', '12 h'], ['Water resistance', 'IPX7'], ['Bluetooth', '5.3']],
    variants: [
      v('Black', { color: 'Black', wattage: 5 }, 2290, 100),
      v('Blue', { color: 'Blue', wattage: 5 }, 2290, 60),
      v('Red', { color: 'Red', wattage: 5 }, 2290, 45),
    ],
  },
  {
    name: 'VoltNest Boom Max Waterproof Speaker', category: 'audio', sales: 140, daysAgo: 22,
    short: 'Big, room-filling sound with deep bass for rooftops and picnics.',
    highlights: ['30W stereo', '24 h playtime', 'Floats in water'],
    specs: [['Output', '30W'], ['Playtime', '24 h'], ['Water resistance', 'IP67'], ['Weight', '1.1 kg']],
    variants: [v('Black', { color: 'Black', wattage: 30 }, 6990, 30, 7990)],
  },

  // ───────────── Car Charging ─────────────
  {
    name: 'VoltNest Drive 30W Dual-Port Car Charger', category: 'car-charging', sales: 450, daysAgo: 79,
    short: 'Sits flush in the cigarette socket and fast-charges two phones.',
    highlights: ['USB-C + USB-A', 'Flush-fit design', 'Blue ring light'],
    specs: [['Output', '30W total'], ['Ports', '1 × USB-C, 1 × USB-A'], ['Input', '12–24V DC'], ['Weight', '18 g']],
    variants: [v('Black', { color: 'Black', wattage: 30, ports: 2 }, 1190, 150)],
  },
  {
    name: 'VoltNest Drive 67W 3-Port Car Charger', category: 'car-charging', sales: 220, daysAgo: 28,
    short: 'Charges a laptop in the car while two phones top up.',
    highlights: ['67W USB-C for laptops', 'Three ports', 'Aluminium shell'],
    specs: [['Output', '67W total'], ['Ports', '2 × USB-C, 1 × USB-A'], ['Input', '12–24V DC'], ['Weight', '32 g']],
    variants: [v('Gunmetal', { color: 'Gunmetal', wattage: 67, ports: 3 }, 2290, 70)],
  },
  {
    name: 'VoltNest Drive Magnetic Car Mount with 15W Charging', category: 'car-charging', sales: 160, daysAgo: 38,
    short: 'Snap your phone on and it charges while you navigate.',
    highlights: ['Strong magnetic hold', '15W wireless charging', 'Vent and dash clips'],
    specs: [['Output', '15W wireless'], ['Mount', 'Vent clip + dash base'], ['Input', 'USB-C'], ['Rotation', '360°']],
    variants: [v('Black', { color: 'Black', wattage: 15 }, 3490, 45)],
  },
  {
    name: 'VoltNest Drive Vent Phone Holder', category: 'car-charging', sales: 300, daysAgo: 86,
    short: 'A simple, sturdy grip that clamps phones from 4.7 to 6.9 inches.',
    highlights: ['One-hand release', 'Fits most vents', 'No-scratch pads'],
    specs: [['Phone size', '4.7–6.9 in'], ['Mount', 'Air vent hook'], ['Rotation', '360°'], ['Weight', '85 g']],
    variants: [v('Black', { color: 'Black' }, 890, 140)],
  },
  {
    name: 'VoltNest Drive Jump Starter 1000A Power Bank', category: 'car-charging', sales: 45, daysAgo: 8,
    short: 'Starts a flat car battery and doubles as a power bank and flashlight.',
    highlights: ['1000A peak current', 'Starts petrol engines up to 6 L', 'Reverse-polarity protection'],
    specs: [['Peak current', '1000A'], ['Capacity', '12,000 mAh'], ['USB output', '18W'], ['Weight', '520 g']],
    variants: [v('Black', { color: 'Black', capacity: 12000, ports: 2 }, 8990, 20)],
  },
];

// ───────────── builders ─────────────

export const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const PLACEHOLDER_COLORS = ['E8EEFF', 'EEF1F4', 'E9F5F1', 'FFF2E5'];

/** Placeholder images until real photos are uploaded to Cloudinary (Day 5). */
const placeholderImages = (name: string, index: number) => {
  const label = encodeURIComponent(name.replace(/^VoltNest\s+/, ''));
  const bg = PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length];
  const bg2 = PLACEHOLDER_COLORS[(index + 1) % PLACEHOLDER_COLORS.length];
  return [
    { url: `https://placehold.co/800x800/${bg}/2440E6/png?font=inter&text=${label}`, alt: name },
    { url: `https://placehold.co/800x800/${bg2}/1B2230/png?font=inter&text=${label}`, alt: `${name}, second view` },
  ];
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Turns the compact list above into documents ready for ProductModel.create(). */
export function buildProducts(categoryIdBySlug: Map<string, unknown>, now = new Date()) {
  return products.map((p, i) => {
    const categoryId = categoryIdBySlug.get(p.category);
    if (!categoryId) throw new Error(`Unknown category "${p.category}" on ${p.name}`);
    const slug = slugify(p.name);
    const skuBase = `VN-${String(i + 1).padStart(3, '0')}`;

    return {
      name: p.name,
      slug,
      brand: 'VoltNest',
      shortDescription: p.short,
      description: `${p.short} ${p.highlights.join('. ')}. Covered by an 18-month VoltNest warranty.`,
      categoryIds: [categoryId],
      images: placeholderImages(p.name, i),
      highlights: p.highlights,
      specs: p.specs.map(([label, value]) => ({ label, value })),
      variants: p.variants.map((vr, j) => ({
        sku: `${skuBase}-${j + 1}`,
        name: vr.name,
        options: vr.options,
        price: vr.price,
        compareAtPrice: vr.compareAtPrice,
        costPrice: Math.round(vr.price * 0.58), // demo margin ≈ 42%
        stock: vr.stock,
      })),
      tags: [p.category],
      status: 'active' as const,
      isFeatured: Boolean(p.featured),
      salesCount: p.sales,
      publishedAt: new Date(now.getTime() - p.daysAgo * DAY_MS),
    };
  });
}

export const PRODUCT_COUNT = products.length;
