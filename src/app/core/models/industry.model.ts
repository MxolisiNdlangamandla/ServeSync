export type IndustryType = 'restaurant' | 'barbershop' | 'salon' | 'carwash' | 'lounge';

export interface IndustryOption {
  id: IndustryType;
  name: string;
  icon: string;
  enabled: boolean;
}

export interface IndustryLabels {
  table: string;
  tables: string;
  customer: string;
  customers: string;
  staff: string;
  staffPlural: string;
  order: string;
  orders: string;
  item: string;
  items: string;
}

export const INDUSTRY_OPTIONS: IndustryOption[] = [
  { id: 'restaurant', name: 'Restaurant', icon: '🍽️', enabled: true },
  //{ id: 'barbershop', name: 'Barbershop', icon: '💈', enabled: false },
  //{ id: 'salon', name: 'Hair Salon', icon: '💇', enabled: false },
  //{ id: 'carwash', name: 'Car Wash', icon: '🚗', enabled: false },
  //{ id: 'lounge', name: 'Lounge / Hospitality', icon: '🍸', enabled: false },
];

export const INDUSTRY_LABELS: Record<IndustryType, IndustryLabels> = {
  restaurant: {
    table: 'Table', tables: 'Tables',
    customer: 'Customer', customers: 'Customers',
    staff: 'Waiter', staffPlural: 'Waiters',
    order: 'Order', orders: 'Orders',
    item: 'Item', items: 'Items',
  },
  barbershop: {
    table: 'Chair', tables: 'Chairs',
    customer: 'Client', customers: 'Clients',
    staff: 'Barber', staffPlural: 'Barbers',
    order: 'Service', orders: 'Services',
    item: 'Service', items: 'Services',
  },
  salon: {
    table: 'Station', tables: 'Stations',
    customer: 'Client', customers: 'Clients',
    staff: 'Stylist', staffPlural: 'Stylists',
    order: 'Service', orders: 'Services',
    item: 'Service', items: 'Services',
  },
  carwash: {
    table: 'Bay', tables: 'Bays',
    customer: 'Vehicle', customers: 'Vehicles',
    staff: 'Staff', staffPlural: 'Staff',
    order: 'Request', orders: 'Requests',
    item: 'Service', items: 'Services',
  },
  lounge: {
    table: 'Table', tables: 'Tables',
    customer: 'Guest', customers: 'Guests',
    staff: 'Staff', staffPlural: 'Staff',
    order: 'Order', orders: 'Orders',
    item: 'Item', items: 'Items',
  },
};
