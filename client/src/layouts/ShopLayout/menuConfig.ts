/** Quick links shown in each category's mega menu panel. Each one is just a filtered collection URL. */
export const MENU_QUICK_LINKS: Record<string, { label: string; query: string }[]> = {
  chargers: [
    { label: 'Phone chargers, 20W to 30W', query: 'wattage=20,30' },
    { label: 'Laptop chargers, 65W and up', query: 'wattage=65,100,140' },
    { label: 'Wireless chargers', query: 'wattage=15' },
    { label: 'Under ৳2,000', query: 'maxPrice=2000' },
  ],
  'power-banks': [
    { label: 'Pocket size, up to 10,000 mAh', query: 'capacity=5000,10000' },
    { label: 'High capacity, 20,000 mAh and up', query: 'capacity=20000,25000,26800' },
    { label: 'Laptop power banks, 65W and up', query: 'wattage=65,100' },
    { label: 'Under ৳3,000', query: 'maxPrice=3000' },
  ],
  cables: [
    { label: '100W and up', query: 'wattage=100,240' },
    { label: 'Under ৳600', query: 'maxPrice=600' },
    { label: 'Bestsellers', query: 'sort=bestselling' },
  ],
  'hubs-docks': [
    { label: 'Compact, up to 5 ports', query: 'ports=1,4,5' },
    { label: 'Work hubs, 7 ports and up', query: 'ports=7,8,12' },
    { label: 'Under ৳3,000', query: 'maxPrice=3000' },
  ],
  audio: [
    { label: 'New arrivals', query: 'sort=newest' },
    { label: 'Bestsellers', query: 'sort=bestselling' },
    { label: 'Under ৳3,000', query: 'maxPrice=3000' },
  ],
  'car-charging': [
    { label: 'Bestsellers', query: 'sort=bestselling' },
    { label: 'Under ৳2,500', query: 'maxPrice=2500' },
  ],
};
