export interface Payment {
  ID: number;
  order_id: number;
  method: string;
  amount: number;
  status: string;
}
