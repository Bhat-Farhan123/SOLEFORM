import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Box, Check, ChevronRight, ClipboardList, ImagePlus, LayoutDashboard, LogOut, Package, Pencil, Plus, Search, ShieldCheck, Trash2, UploadCloud, X } from 'lucide-react'
import './admin.css'

const API = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const emptyForm = () => ({ name:'', price:'', category:'Running', tag:'', description:'', image:'', images:[], alt:'', tone:'stone', sizes:[6,7,8,9,10,11], stock:{}, featured:false })
const money = n => `₹${Number(n || 0).toLocaleString('en-IN')}`

export default function AdminApp() {
  const [password, setPassword] = useState(() => sessionStorage.getItem('soleform-admin-password') || '')
  const [loggedIn, setLoggedIn] = useState(false)
  const [loginPassword, setLoginPassword] = useState('')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [form, setForm] = useState(emptyForm())
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState({ type:'', text:'' })
  const [view, setView] = useState('products')
  const fileRef = useRef(null)

  const request = async (path, options = {}) => {
    const headers = { ...(options.headers || {}) }
    if (password) headers['X-Admin-Password'] = password
    if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json'
    const response = await fetch(`${API}${path}`, { ...options, headers })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.detail || 'Request failed. Is the backend running?')
    return data
  }
  const loadProducts = async () => { const data = await request('/api/products'); setProducts(data) }
  const loadOrders = async () => { const data = await request('/api/admin/orders'); setOrders(Array.isArray(data) ? data : []) }
  const updateOrderStatus = async (orderId, status) => { try { const updated = await request(`/api/admin/orders/${encodeURIComponent(orderId)}`, { method:'PATCH', body:JSON.stringify({status}) }); setOrders(current => current.map(order => order.id === orderId ? updated : order)); flash(`Order ${orderId} updated to ${status}.`) } catch(error) { flash(error.message, 'error') } }
  const clearAllOrders = async () => {
    if (!orders.length) return flash('There are no orders to clear.', 'error')
    if (!window.confirm(`Permanently delete all ${orders.length} orders from backend/data/orders.json? This also clears customer order history.`)) return
    setBusy(true)
    try { const result = await request('/api/admin/orders', { method:'DELETE' }); setOrders([]); flash(`${result.deleted || 0} orders cleared from store history.`) }
    catch(error) { flash(error.message, 'error') } finally { setBusy(false) }
  }
  const flash = (text, type='success') => { setNotice({text,type}); window.setTimeout(() => setNotice({text:'',type:''}), 4000) }

  useEffect(() => {
    let active = true
    const storedPassword = sessionStorage.getItem('soleform-admin-password') || ''
    if (!loggedIn && storedPassword) {
      fetch(`${API}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: storedPassword }),
      }).then(async response => {
        if (!response.ok) throw new Error('Admin session expired.')
        if (!active) return
        setPassword(storedPassword)
        setLoggedIn(true)
      }).catch(() => {
        sessionStorage.removeItem('soleform-admin-password')
        if (active) setPassword('')
      })
      return () => { active = false }
    }
    if (loggedIn) {
      ;(async () => {
        // If the storefront has old browser-only orders, migrate them before loading admin orders.
        try {
          let legacy = []
          try { legacy = JSON.parse(localStorage.getItem('soleform-order-history') || '[]') } catch {}
          if (Array.isArray(legacy) && legacy.length) {
            const migration = await fetch(`${API}/api/orders/import-history`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({orders:legacy}) })
            if (migration.ok) {
              const result = await migration.json().catch(() => ({}))
              const storedIds = new Set((result.stored_ids || []).map(id => String(id).toUpperCase()))
              if (legacy.every(order => order?.id && storedIds.has(String(order.id).toUpperCase()))) localStorage.removeItem('soleform-order-history')
            }
          }
        } catch {}
        if (!active) return
        try { await loadProducts(); await loadOrders() } catch(error) { flash(error.message, 'error') }
      })()
    }
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn])

  const filtered = useMemo(() => products.filter(p => {
    const matches = `${p.name} ${p.tag} ${p.category}`.toLowerCase().includes(search.toLowerCase().trim())
    return matches && (categoryFilter === 'All' || p.category === categoryFilter)
  }), [products, search, categoryFilter])
  const categories = useMemo(() => ['All', ...new Set(products.map(p => p.category).filter(Boolean))], [products])
  const totalStock = products.reduce((total,p) => total + Object.values(p.stock || {}).reduce((n,v) => n + Number(v || 0),0),0)

  const login = async e => {
    e.preventDefault(); setBusy(true)
    try {
      const response = await fetch(`${API}/api/admin/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({password:loginPassword}) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.detail || 'Could not sign in.')
      setPassword(loginPassword); sessionStorage.setItem('soleform-admin-password',loginPassword); setLoggedIn(true); flash('Welcome back. Your catalog is ready.')
    } catch(error) { flash(error.message,'error') } finally { setBusy(false) }
  }
  const logout = () => { sessionStorage.removeItem('soleform-admin-password'); setPassword(''); setLoggedIn(false); setLoginPassword('') }
  const resetForm = () => { setForm(emptyForm()); setEditingId(null); if (fileRef.current) fileRef.current.value = '' }
  const editProduct = product => {
    setForm({ ...emptyForm(), ...product, price:String(product.price), images:product.images?.length ? product.images : [product.image], sizes:product.sizes || [6,7,8,9,10,11], stock:product.stock || {} })
    setEditingId(product.id); setView('form'); window.scrollTo({top:0,behavior:'smooth'})
  }
  const uploadFiles = async files => {
    const selected = Array.from(files || [])
    if (!selected.length) return
    setBusy(true)
    try {
      const uploaded = []
      for (const file of selected) {
        const body = new FormData(); body.append('file',file)
        const data = await request('/api/admin/upload',{method:'POST',body})
        uploaded.push(data.url)
      }
      setForm(current => { const images = [...current.images,...uploaded]; return { ...current, images, image:current.image || images[0] } })
      flash(`${uploaded.length} image${uploaded.length > 1 ? 's' : ''} uploaded.`)
    } catch(error) { flash(error.message,'error') } finally { setBusy(false); if (fileRef.current) fileRef.current.value = '' }
  }
  const saveProduct = async e => {
    e.preventDefault(); if (!form.images.length && !form.image) return flash('Please upload at least one product image.','error')
    setBusy(true)
    const payload = { ...form, price:Number(form.price), image:form.image || form.images[0], images:form.images.length ? form.images : [form.image], tag:form.tag.trim() || form.category.toUpperCase(), alt:form.alt.trim() || form.name, sizes:form.sizes.map(Number), stock:form.stock }
    try {
      await request(editingId ? `/api/admin/products/${editingId}` : '/api/admin/products',{method:editingId ? 'PUT' : 'POST',body:JSON.stringify(payload)})
      await loadProducts(); resetForm(); setView('products'); flash(editingId ? 'Product updated.' : 'Product added to the storefront.')
    } catch(error) { flash(error.message,'error') } finally { setBusy(false) }
  }
  const deleteProduct = async product => {
    if (!window.confirm(`Delete “${product.name}” from the catalog?`)) return
    setBusy(true)
    try { await request(`/api/admin/products/${product.id}`,{method:'DELETE'}); setProducts(current => current.filter(p => p.id !== product.id)); if (editingId === product.id) resetForm(); flash(`${product.name} deleted.`) }
    catch(error) { flash(error.message,'error') } finally { setBusy(false) }
  }
  const toggleSize = size => setForm(current => {
    const exists = current.sizes.includes(size)
    const sizes = exists ? current.sizes.filter(s => s !== size) : [...current.sizes,size].sort((a,b) => a-b)
    const stock = {...current.stock}; if (!exists && stock[size] === undefined) stock[size] = 0
    return {...current,sizes,stock}
  })

  if (!loggedIn) return <main className="admin-login-shell"><div className="admin-login-card"><a className="admin-brand" href="/">SOLEFORM<span> / ADMIN</span></a><div className="admin-login-icon"><ShieldCheck size={26}/></div><p className="admin-eyebrow">STORE MANAGEMENT</p><h1>Good to see you.</h1><p className="admin-muted">Sign in to manage your products, images, sizes and stock.</p><form onSubmit={login} className="admin-form-stack"><label>Admin password<input type="password" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} placeholder="Enter your admin password" autoComplete="current-password" required /></label><button className="admin-primary" disabled={busy}>{busy ? 'CHECKING…' : 'SIGN IN'} <ChevronRight size={17}/></button></form><p className="admin-login-footnote">Local development setup · API must be running on port 8000</p><a className="admin-back-link" href="/"> <ArrowLeft size={15}/> Back to SOLEFORM store</a></div></main>

  return <div className="admin-app-shell">
    <aside className="admin-sidebar"><a className="admin-brand" href="/">SOLEFORM<span> / ADMIN</span></a><div className="admin-sidebar-caption">WORKSPACE</div><button className={`admin-nav-item ${view === 'products' ? 'active' : ''}`} onClick={()=>setView('products')}><LayoutDashboard size={18}/> Product catalog</button><button className={`admin-nav-item ${view === 'form' ? 'active' : ''}`} onClick={()=>{resetForm();setView('form')}}><Plus size={18}/> Add a product</button><button className={`admin-nav-item ${view === 'orders' ? 'active' : ''}`} onClick={()=>{setView('orders');loadOrders().catch(error=>flash(error.message,'error'))}}><ClipboardList size={18}/> Orders</button><div className="admin-sidebar-bottom"><div className="admin-security-note"><ShieldCheck size={17}/><div><strong>Local admin</strong><span>Protected by password</span></div></div><button className="admin-nav-item" onClick={logout}><LogOut size={18}/> Sign out</button><a className="admin-back-link" href="/"> <ArrowLeft size={15}/> View storefront</a></div></aside>
    <main className="admin-main"><header className="admin-topbar"><div><p className="admin-eyebrow">SOLEFORM / CONTROL ROOM</p><h1>{view === 'form' ? (editingId ? 'Edit product' : 'Add a product') : view === 'orders' ? 'Order management' : 'Product catalog'}</h1></div><div className="admin-topbar-actions"><span className="admin-status"><i/> Backend JSON connected</span><button className="admin-icon-button" onClick={logout} title="Sign out" aria-label="Sign out"><LogOut size={18}/></button></div></header>
      {notice.text && <div className={`admin-notice ${notice.type}`} role="status">{notice.type === 'error' ? <X size={17}/> : <Check size={17}/>} {notice.text}<button onClick={()=>setNotice({text:'',type:''})} aria-label="Dismiss"><X size={15}/></button></div>}
      {view === 'orders' ? <section className="admin-catalog-panel admin-orders-panel"><div className="admin-catalog-heading"><div><p className="admin-eyebrow">CUSTOMER CHECKOUTS</p><h2>Orders <span>{orders.length}</span></h2></div><div className="admin-order-toolbar"><button className="admin-secondary" onClick={()=>loadOrders().then(()=>flash('Orders refreshed.')).catch(error=>flash(error.message,'error'))}>REFRESH ORDERS</button><button className="admin-danger-action" onClick={clearAllOrders} disabled={busy || orders.length === 0}>CLEAR ALL HISTORY</button></div></div>{orders.length ? <div className="admin-order-list">{orders.map(order=><article className="admin-order-card" key={order.id}><div className="admin-order-head"><div><strong>{order.id}</strong><span>{order.created_at ? new Date(order.created_at).toLocaleString('en-IN') : 'Date unavailable'}</span></div><strong>{money(order.total)}</strong></div><div className="admin-order-customer"><strong>{order.customer?.name || 'Customer'}</strong><span>{order.customer?.email || 'No email'} · {order.customer?.phone || 'No phone'}</span><span>{[order.customer?.address,order.customer?.city,order.customer?.state,order.customer?.pin].filter(Boolean).join(', ')}</span></div><div className="admin-order-lines">{(order.items || []).map((item,index)=><div key={`${order.id}-${index}`}><span>{item.name} · UK {item.size} × {item.quantity}</span><strong>{money(Number(item.price||0)*Number(item.quantity||1))}</strong></div>)}</div><div className="admin-order-footer"><span className="admin-order-payment">COD DEMO · {order.payment_status || 'not collected'}</span><label>Order status<select value={['received_demo'].includes(order.status)?'received':(order.status || 'received')} onChange={e=>updateOrderStatus(order.id,e.target.value)}><option value="received">Received</option><option value="confirmed">Confirmed</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></label></div></article>)}</div> : <div className="admin-empty-state"><Package size={28}/><strong>No orders yet</strong><span>Orders placed through checkout will appear here.</span></div>}</section> : view === 'form' ? <section className="admin-form-layout"><form className="admin-product-form" onSubmit={saveProduct}>
        <div className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-step">01</span><h2>Product information</h2></div><span className="admin-required">* Required</span></div><div className="admin-fields-grid"><label className="span-two">Product name *<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Motion Runner 02" required maxLength={80}/></label><label>Price (INR) *<div className="admin-price-input"><span>₹</span><input type="number" min="1" step="1" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="6499" required/></div></label><label>Collection *<select value={form.category} onChange={e=>setForm({...form,category:e.target.value,tag:form.tag || e.target.value.toUpperCase()})}><option>Running</option><option>Court</option><option>Suede</option><option>Everyday</option><option>High-top</option><option>Limited edition</option></select></label><label className="span-two">Product label<input value={form.tag} onChange={e=>setForm({...form,tag:e.target.value})} placeholder="e.g. RUNNING INSPIRED" maxLength={60}/></label><label className="span-two">Description<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Describe the materials, comfort and silhouette…" rows={4} maxLength={500}/><small>{form.description.length}/500 characters</small></label><label>Image description<input value={form.alt} onChange={e=>setForm({...form,alt:e.target.value})} placeholder="Accessible image description" maxLength={160}/></label><label>Image background<select value={form.tone} onChange={e=>setForm({...form,tone:e.target.value})}><option value="stone">Stone</option><option value="sage">Sage</option><option value="sand">Sand</option><option value="mist">Mist</option></select></label></div></div>
        <div className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-step">02</span><h2>Product photography</h2></div><span className="admin-required">Up to 8 MB each</span></div><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={e=>uploadFiles(e.target.files)}/><button type="button" className="admin-upload-zone" onClick={()=>fileRef.current?.click()} disabled={busy}><span className="admin-upload-icon"><UploadCloud size={24}/></span><strong>{busy ? 'Working…' : 'Click to upload sneaker photos'}</strong><span>PNG, JPG or WebP · Multiple images supported</span><span className="admin-upload-button"><ImagePlus size={16}/> Choose images</span></button>{form.images.length > 0 && <div className="admin-image-grid">{form.images.map((src,index)=><div className={`admin-image-preview ${form.image===src?'selected':''}`} key={`${src}-${index}`}><button type="button" className="admin-image-select" onClick={()=>setForm({...form,image:src})} title="Set as main image">{form.image===src?'MAIN IMAGE':'SET AS MAIN'}</button><img src={src.startsWith('/uploads/') ? `${API}${src}` : src} alt={`Product view ${index+1}`}/><button type="button" className="admin-image-remove" onClick={()=>setForm(current=>{const images=current.images.filter((_,i)=>i!==index);return {...current,images,image:current.image===src?(images[0]||''):current.image}})} aria-label="Remove image"><X size={15}/></button></div>)}</div>}</div>
        <div className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-step">03</span><h2>Sizes & inventory</h2></div><span className="admin-required">UK sizing</span></div><p className="admin-help-text">Choose which sizes customers can select, then enter the quantity available for each size.</p><div className="admin-size-grid">{Array.from({length:10},(_,i)=>i+4).map(size=><button type="button" key={size} className={form.sizes.includes(size)?'admin-size-chip selected':'admin-size-chip'} onClick={()=>toggleSize(size)}>{size}{form.sizes.includes(size)&&<Check size={12}/>}</button>)}</div>{form.sizes.length > 0 ? <div className="admin-stock-table"><div className="admin-stock-head"><span>UK SIZE</span><span>QUANTITY IN STOCK</span></div>{form.sizes.map(size=><label className="admin-stock-row" key={size}><span>UK {size}</span><input aria-label={`Stock for UK size ${size}`} type="number" min="0" max="100000" value={form.stock[size] ?? 0} onChange={e=>setForm(current=>({...current,stock:{...current.stock,[size]:Math.max(0,Number(e.target.value))}}))}/><span>pairs</span></label>)}</div>:<p className="admin-inline-warning">Select at least one size before saving.</p>}</div>
        <div className="admin-form-actions"><button type="button" className="admin-secondary" onClick={()=>{resetForm();setView('products')}}>Cancel</button><button className="admin-primary" disabled={busy}>{busy ? 'SAVING…' : editingId ? 'SAVE CHANGES' : 'PUBLISH PRODUCT'} <ChevronRight size={17}/></button></div>
      </form><aside className="admin-preview-panel"><div className="admin-preview-label"><span>LIVE PREVIEW</span><span className="admin-preview-dot"/></div><div className={`admin-preview-image product-tone-${form.tone}`}><span className="admin-preview-brand">SF / {String(editingId || 'NEW').padStart(3,'0')}</span>{form.image ? <img src={form.image.startsWith('/uploads/') ? `${API}${form.image}` : form.image} alt={form.alt || form.name}/> : <div className="admin-preview-empty"><ImagePlus size={30}/><span>Your sneaker photo<br/>will appear here</span></div>}</div><div className="admin-preview-copy"><p>{form.tag || form.category.toUpperCase()}</p><h3>{form.name || 'Your sneaker name'}</h3><strong>{form.price ? money(form.price) : '₹—'}</strong><span>{form.sizes.length} sizes available · {form.images.length} photos</span></div><p className="admin-preview-note">Preview of the product card. The storefront refreshes its catalog from the local API.</p></aside></section> : <>
        <section className="admin-stat-grid"><article><div className="admin-stat-icon"><Package size={19}/></div><span>CATALOG PRODUCTS</span><strong>{products.length.toString().padStart(2,'0')}</strong><small>Products in your rotation</small></article><article><div className="admin-stat-icon"><Box size={19}/></div><span>TOTAL STOCK</span><strong>{totalStock.toLocaleString('en-IN')}</strong><small>Pairs across all sizes</small></article><article><div className="admin-stat-icon"><ImagePlus size={19}/></div><span>COLLECTIONS</span><strong>{new Set(products.map(p=>p.category)).size.toString().padStart(2,'0')}</strong><small>Distinct product categories</small></article></section>
        <section className="admin-catalog-panel"><div className="admin-catalog-heading"><div><p className="admin-eyebrow">YOUR INVENTORY</p><h2>All products <span>{products.length}</span></h2></div><button className="admin-primary" onClick={()=>{resetForm();setView('form')}}><Plus size={17}/> ADD PRODUCT</button></div><div className="admin-catalog-toolbar"><label className="admin-search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products or labels…"/></label><select aria-label="Filter by collection" value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></div><div className="admin-product-table-wrap"><table className="admin-product-table"><thead><tr><th>PRODUCT</th><th>COLLECTION</th><th>PRICE</th><th>SIZES</th><th>STOCK</th><th>ACTIONS</th></tr></thead><tbody>{filtered.map(p=><tr key={p.id}><td><div className="admin-table-product"><div className={`admin-table-image product-tone-${p.tone}`}><img src={p.image?.startsWith('/uploads/') ? `${API}${p.image}` : p.image} alt=""/></div><div><strong>{p.name}</strong><span>{p.tag}</span></div></div></td><td><span className="admin-category-pill">{p.category}</span></td><td className="admin-table-price">{money(p.price)}</td><td>{(p.sizes || []).length} sizes</td><td><span className={(Object.values(p.stock || {}).reduce((a,b)=>a+Number(b||0),0)===0)?'admin-stock-pill empty':'admin-stock-pill'}>{Object.values(p.stock || {}).reduce((a,b)=>a+Number(b||0),0)} pairs</span></td><td><div className="admin-row-actions"><button onClick={()=>editProduct(p)} aria-label={`Edit ${p.name}`} title="Edit product"><Pencil size={16}/></button><button className="danger" onClick={()=>deleteProduct(p)} aria-label={`Delete ${p.name}`} title="Delete product"><Trash2 size={16}/></button></div></td></tr>)}</tbody></table>{filtered.length===0&&<div className="admin-empty-state"><Package size={28}/><strong>No products found</strong><span>Try a different search, or add a new sneaker.</span></div>}</div><div className="admin-table-footer"><span>Showing {filtered.length} of {products.length} products</span><span><i/> Changes save to local files</span></div></section>
      </>}
      <footer className="admin-footer"><span>SOLEFORM / EVERYDAY ICONS. UNCOMMON ENERGY.</span><span>LOCAL CATALOG · BACKED UP IN YOUR PROJECT FILES</span></footer>
    </main>
  </div>
}
