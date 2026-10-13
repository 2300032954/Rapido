import { useEffect, useState } from 'react'
import { api } from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function Wallet() {
  const { user, updateUser } = useAuth()
  const [balance, setBalance] = useState(0)
  const [txns, setTxns] = useState([])
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    const res = await api.get(`/wallet/${user.id}`)
    setBalance(res.data.balance)
    setTxns(res.data.transactions)
    updateUser({ wallet: res.data.balance })
  }

  useEffect(() => { load() }, [user.id])

  const addMoney = async () => {
    if (!amount || Number(amount) <= 0) return alert('Enter amount')
    setLoading(true)
    try {
      await api.post('/wallet/add-money', {
        user_id: user.id,
        amount: Number(amount),
        method: 'upi',
        reference: 'demo_' + Date.now()
      })
      setAmount('')
      await load()
      alert('Money added!')
    } catch (e) {
      alert('Failed to add money')
    }
    setLoading(false)
  }

  return (
    <div className="container" style={{ paddingBottom: 90 }}>
      <h2>My Wallet</h2>

      <div className="card" style={{ background: '#1a1a1a', color: 'white', textAlign: 'center' }}>
        <p style={{ color: '#ccc', fontSize: 13 }}>Available balance</p>
        <h1 style={{ color: 'white', fontSize: 40 }}>₹{balance}</h1>
      </div>

      <div className="card">
        <h3>Add Money</h3>
        <input type="number" placeholder="Enter amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <div style={{ display: 'flex', gap: 8 }}>
          {[100, 200, 500, 1000].map((a) => (
            <button key={a} className="btn-outline" style={{ margin: 0, padding: '8px 0', flex: 1 }} onClick={() => setAmount(String(a))}>
              ₹{a}
            </button>
          ))}
        </div>
        <button className="btn-primary" onClick={addMoney} disabled={loading}>
          {loading ? 'Processing...' : 'Add Money (UPI)'}
        </button>
      </div>

      <div className="card">
        <h3>Transaction History</h3>
        {txns.length === 0 && <p style={{ color: '#888', fontSize: 13 }}>No transactions yet</p>}
        {txns.map((t) => (
          <div key={t.id} className="txn-row">
            <div>
              <p style={{ fontWeight: 600, fontSize: 14 }}>{t.description}</p>
              <p style={{ fontSize: 11, color: '#888' }}>{new Date(t.date).toLocaleString()}</p>
            </div>
            <span className={t.type === 'credit' ? 'txn-credit' : 'txn-debit'}>
              {t.type === 'credit' ? '+' : '-'}₹{t.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}