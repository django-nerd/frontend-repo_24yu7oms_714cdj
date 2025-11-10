import { useEffect, useMemo, useState } from 'react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function Header({ cartCount }) {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-pink-500 grid place-content-center text-white font-bold">🐼</div>
          <div className="font-extrabold text-xl">FoodPanda</div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="hidden sm:block text-gray-600">Deliver to: <b>Downtown</b></span>
          <div className="relative">
            <input className="border rounded-full px-4 py-2 w-56 focus:outline-none focus:ring-2 focus:ring-pink-500" placeholder="Search restaurants or dishes" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Cart</span>
            <span className="inline-flex items-center justify-center w-6 h-6 text-xs rounded-full bg-pink-500 text-white">{cartCount}</span>
          </div>
        </div>
      </div>
    </header>
  )
}

function RestaurantCard({ r, onOpen }) {
  return (
    <button onClick={() => onOpen(r)} className="text-left group border rounded-xl overflow-hidden hover:shadow-lg transition bg-white">
      <div className="h-36 w-full bg-gray-100 overflow-hidden">
        <img src={r.image} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
      </div>
      <div className="p-4">
        <div className="font-semibold text-lg">{r.name}</div>
        <div className="text-sm text-gray-600">{r.cuisine} • ⭐ {r.rating.toFixed ? r.rating.toFixed(1) : r.rating}</div>
        <div className="text-sm text-gray-700 mt-1">Delivery ${r.delivery_fee?.toFixed ? r.delivery_fee.toFixed(2) : r.delivery_fee}</div>
      </div>
    </button>
  )
}

function DishCard({ d, onAdd }) {
  return (
    <div className="flex gap-4 p-4 border rounded-lg bg-white">
      <img src={d.image} alt={d.name} className="w-20 h-20 object-cover rounded" />
      <div className="flex-1">
        <div className="font-semibold">{d.name}</div>
        <div className="text-sm text-gray-600">{d.description}</div>
        <div className="mt-1 font-semibold">${d.price.toFixed ? d.price.toFixed(2) : d.price}</div>
      </div>
      <button onClick={() => onAdd(d)} className="self-start bg-pink-500 text-white px-3 py-1.5 rounded hover:bg-pink-600">Add</button>
    </div>
  )
}

function Cart({ items, onQty, onCheckout, fee }) {
  const subtotal = useMemo(() => items.reduce((s, it) => s + it.price * it.qty, 0), [items])
  const total = subtotal + fee
  return (
    <div className="sticky top-20 bg-white border rounded-xl p-4">
      <div className="font-bold mb-3">Your Order</div>
      {items.length === 0 ? (
        <div className="text-sm text-gray-500">Your cart is empty</div>
      ) : (
        <div className="space-y-3">
          {items.map(it => (
            <div key={it.id} className="flex items-center justify-between gap-2">
              <div>
                <div className="font-medium">{it.name}</div>
                <div className="text-xs text-gray-500">${(it.price * it.qty).toFixed(2)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onQty(it.id, Math.max(1, it.qty-1))} className="w-7 h-7 rounded bg-gray-100">-</button>
                <span className="w-6 text-center">{it.qty}</span>
                <button onClick={() => onQty(it.id, it.qty+1)} className="w-7 h-7 rounded bg-gray-100">+</button>
              </div>
            </div>
          ))}
          <div className="border-t pt-3 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><b>${subtotal.toFixed(2)}</b></div>
            <div className="flex justify-between"><span>Delivery</span><b>${fee.toFixed(2)}</b></div>
            <div className="flex justify-between text-lg mt-1"><span>Total</span><b>${total.toFixed(2)}</b></div>
          </div>
          <button onClick={onCheckout} className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">Checkout</button>
        </div>
      )}
    </div>
  )
}

function App() {
  const [restaurants, setRestaurants] = useState([])
  const [active, setActive] = useState(null)
  const [menu, setMenu] = useState([])
  const [cart, setCart] = useState([])
  const [email, setEmail] = useState('guest@example.com')

  useEffect(() => {
    const load = async () => {
      // ensure seed exists
      await fetch(`${API_BASE}/seed`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reset: false }) })
      const res = await fetch(`${API_BASE}/restaurants`)
      const data = await res.json()
      setRestaurants(data)
    }
    load()
  }, [])

  const openRestaurant = async (r) => {
    setActive(r)
    const res = await fetch(`${API_BASE}/restaurants/${r.id}/menu`)
    const data = await res.json()
    setMenu(data)
    setCart([])
  }

  const addToCart = (d) => {
    setCart(prev => {
      const id = d.id
      const existing = prev.find(i => i.id === id)
      if (existing) return prev.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { id, name: d.name, price: d.price, qty: 1, restaurant_id: d.restaurant_id }]
    })
  }

  const changeQty = (id, qty) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i))
  }

  const checkout = async () => {
    if (!active || cart.length === 0) return
    const body = {
      email,
      address: '123 Main St',
      items: cart.map(c => ({ item_id: c.id, restaurant_id: c.restaurant_id, name: c.name, price: c.price, qty: c.qty })),
      delivery_fee: active.delivery_fee
    }
    const res = await fetch(`${API_BASE}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    alert(`Order placed! Total $${data.total.toFixed ? data.total.toFixed(2) : data.total}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50">
      <Header cartCount={cart.reduce((s,c)=>s+c.qty,0)} />

      <main className="max-w-6xl mx-auto p-4">
        {!active && (
          <>
            <h2 className="text-2xl font-bold mb-4">Popular restaurants</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {restaurants.map(r => (
                <RestaurantCard key={r.id} r={r} onOpen={openRestaurant} />
              ))}
            </div>
          </>
        )}

        {active && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <button onClick={()=>setActive(null)} className="text-sm text-gray-600 mb-3">← Back to restaurants</button>
              <div className="flex items-start gap-4 mb-4">
                <img src={active.image} className="w-28 h-28 object-cover rounded" />
                <div>
                  <div className="text-2xl font-bold">{active.name}</div>
                  <div className="text-gray-600">{active.cuisine} • ⭐ {active.rating}</div>
                  <div className="text-gray-700">Delivery ${active.delivery_fee}</div>
                </div>
              </div>
              <div className="grid gap-4">
                {menu.map(d => (
                  <DishCard key={d.id} d={d} onAdd={addToCart} />
                ))}
              </div>
            </div>
            <div>
              <div className="mb-3">
                <label className="text-sm text-gray-600">Email for order</label>
                <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full border rounded px-3 py-2" />
              </div>
              <Cart items={cart} onQty={changeQty} onCheckout={checkout} fee={active.delivery_fee || 0} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
