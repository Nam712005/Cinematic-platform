import axiosClient from './axiosClient.js';

export const premiumApi = {
  listPlans: () => axiosClient.get('/premium-plans').then((r) => r.data),
  checkoutPreview: (payload) =>
    axiosClient.post('/orders/checkout-preview', payload).then((r) => r.data),
  completeMockPayment: (payload) =>
    axiosClient.post('/orders/complete-mock-payment', payload).then((r) => r.data),
  listMyOrders: (params) => axiosClient.get('/orders/my-orders', { params }).then((r) => r.data),
  getOrderResult: (orderCode) =>
    axiosClient.get(`/orders/${orderCode}/result`).then((r) => r.data),
};
