import api from "./axios";


export async function getTransactions(page = 1) {
  const response = await api.get(`/transactions?page=${page}`)
  return response.data
}

export async function getTransactionById(id) {
  const response = await api.get(`/transactions/${id}`)
  return response.data
}

export async function createTransaction(data) {
  const response = await api.post('/transactions', data)
  return response.data
}

export async function getPurchases(page = 1) {
  const response = await api.get(`/purchases?page=${page}`)
  return response.data
}

export async function purchaseCoins(data) {
  const response = await api.post('/purchases', data)
  return response.data
}