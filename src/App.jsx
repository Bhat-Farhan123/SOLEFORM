import { lazy, Suspense, useEffect, useState } from 'react'
import {
  ArrowUpRight,
  Instagram,
  X,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  SlidersHorizontal,
  Heart,
  Search,
  Footprints,
  Layers3,
  PackageCheck,
} from "lucide-react";

import Header from './components/Header.jsx'
import ProductCard from './components/ProductCard.jsx'
const Sneaker3D = lazy(() => import('./components/Sneaker3D.jsx'))
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const defaultProducts = [
  { id: 1, name: 'Form Runner 01', price: 6499, tag: 'RUNNING INSPIRED', image: '/images/form-runner.png', alt: 'Cream sneaker with neon lime and black accents', tone: 'stone', description: 'A bold everyday runner with a sculpted sole, breathable mesh and signature neon-lime details.' },
  { id: 2, name: 'Afterhours Low', price: 5999, tag: 'COURT CLASSIC', image: '/images/afterhours-low.png', alt: 'Black chunky everyday sneaker', tone: 'sage', description: 'A court-inspired low-top with an all-black finish, cushioned support and an easy everyday profile.' },
  { id: 3, name: 'Terrain Suede', price: 7299, tag: 'PREMIUM SUEDE', image: '/images/terrain-suede.png', alt: 'Sand suede sneaker with gum outsole', tone: 'sand', description: 'Soft sand-toned suede and a gum outsole bring a refined texture to this versatile silhouette.' },
  { id: 4, name: 'Everyday Mono', price: 5499, tag: 'DAILY ESSENTIAL', image: '/images/everyday-mono.png', alt: 'Minimal white everyday sneaker', tone: 'mist', description: 'A clean monochrome sneaker designed to pair with just about anything in your rotation.' },
]
const sizes = [6, 7, 8, 9, 10, 11]

function App() {
  useEffect(() => {
    const onBeforeUnload = event => {
      console.error('[SOLEFORM DEBUG] DOCUMENT IS UNLOADING. If checkout logs immediately precede this, inspect Vite terminal for a matching filesystem event/reload.')
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])
  const [products, setProducts] = useState(defaultProducts)
  const [cart, setCart] = useState(() => { try { return JSON.parse(localStorage.getItem('soleform-cart') || '[]') } catch { return [] } })
  const [placingOrder, setPlacingOrder] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  useEffect(() => { try { localStorage.setItem('soleform-cart', JSON.stringify(cart)) } catch {} }, [cart])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedSize, setSelectedSize] = useState(8)
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [orderConfirmation, setOrderConfirmation] = useState(null)
  const [orderHistoryOpen, setOrderHistoryOpen] = useState(false)
  const [customerOrders, setCustomerOrders] = useState([])
  const [customerEmail, setCustomerEmail] = useState(() => { try { const old = JSON.parse(localStorage.getItem('soleform-order-history') || '[]'); return old.find(order => order.customer?.email)?.customer.email || '' } catch { return '' } })
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyMessage, setHistoryMessage] = useState('')
  const [toast, setToast] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('All sneakers')
  const [sortBy, setSortBy] = useState('featured')
  const [wishlist, setWishlist] = useState(() => { try { return JSON.parse(localStorage.getItem('soleform-wishlist') || '[]') } catch { return [] } })
  const [infoPage, setInfoPage] = useState('')
  const [galleryImage, setGalleryImage] = useState(null)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [wishlistOnly, setWishlistOnly] = useState(false)
  const [showAllProducts, setShowAllProducts] = useState(false)
  const [collectionPage, setCollectionPage] = useState(false)
  useEffect(() => {
    let active = true
    fetch(`${API_BASE}/api/products`)
      .then(response => response.ok ? response.json() : Promise.reject(new Error('API unavailable')))
      .then(data => { if (active && Array.isArray(data) && data.length) setProducts(data) })
      .catch(() => {})
    return () => { active = false }
  }, [])
  const filteredProducts = products.filter(product => {
    const queryMatch = `${product.name} ${product.tag} ${product.category || ''} ${product.description}`.toLowerCase().includes(searchQuery.trim().toLowerCase())
    const categoryMatch = category === 'All sneakers' || `${product.name} ${product.tag} ${product.category || ''}`.toLowerCase().includes(category.toLowerCase())
    return queryMatch && categoryMatch && (!wishlistOnly || wishlist.includes(product.id))
  }).sort((a, b) => sortBy === 'price-low' ? a.price - b.price : sortBy === 'price-high' ? b.price - a.price : sortBy === 'name' ? a.name.localeCompare(b.name) : a.id - b.id)
  const browsingCollection = category !== 'All sneakers' || Boolean(searchQuery.trim()) || wishlistOnly
  const visibleProducts = browsingCollection || showAllProducts ? filteredProducts : filteredProducts.slice(0, 4)
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const cartTotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0)
  const toggleWishlist = id => setWishlist(current => { const next = current.includes(id) ? current.filter(item => item !== id) : [...current, id]; localStorage.setItem('soleform-wishlist', JSON.stringify(next)); notify(current.includes(id) ? 'Removed from your wishlist' : 'Saved to your wishlist'); return next })
  const notify = message => { setToast(message); window.clearTimeout(window.__soleformToastTimer); window.__soleformToastTimer = window.setTimeout(() => setToast(''), 2200) }
  const addToBag = (product, size = selectedSize) => {
    setCart(current => {
      const found = current.find(item => item.product.id === product.id && item.size === size)
      return found ? current.map(item => item.product.id === product.id && item.size === size ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { product, size, quantity: 1 }]
    })
    setSelectedProduct(null)
    setGalleryImage(null)
    setGalleryIndex(0)
    setCartOpen(false)
    notify(`${product.name} · UK ${size} added to your bag`)
  }
  const changeQuantity = (id, size, delta) => setCart(current => current.map(item => item.product.id === id && item.size === size ? { ...item, quantity: item.quantity + delta } : item).filter(item => item.quantity > 0))
  const removeItem = (id, size) => setCart(current => current.filter(item => !(item.product.id === id && item.size === size)))
  const migrateLegacyOrderHistory = async () => {
    let legacy = []
    try { legacy = JSON.parse(localStorage.getItem('soleform-order-history') || '[]') } catch {}
    if (!Array.isArray(legacy) || !legacy.length) return
    const response = await fetch(`${API_BASE}/api/orders/import-history`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orders: legacy }),
    })
    if (!response.ok) throw new Error('Could not migrate your previous order history yet.')
    const result = await response.json().catch(() => ({}))
    const storedIds = new Set((result.stored_ids || []).map(id => String(id).toUpperCase()))
    const fullyMigrated = legacy.every(order => order?.id && storedIds.has(String(order.id).toUpperCase()))
    if (fullyMigrated) { try { localStorage.removeItem('soleform-order-history') } catch {} }
  }
  const refreshCustomerOrderStatuses = async (emailValue = customerEmail) => {
    const email = String(emailValue || '').trim()
    if (!email) { setHistoryMessage('Enter the email address you used at checkout.'); return }
    setHistoryLoading(true)
    setHistoryMessage('')
    try {
      await migrateLegacyOrderHistory()
      const response = await fetch(`${API_BASE}/api/orders/history?email=${encodeURIComponent(email)}`)
      const data = await response.json().catch(() => [])
      if (!response.ok) throw new Error(data.detail || 'Could not load order history.')
      setCustomerOrders(Array.isArray(data) ? data : [])
      setCustomerEmail(email)
      setHistoryMessage(data.length ? `Showing ${data.length} order${data.length === 1 ? '' : 's'} saved by the store.` : 'No orders were found for this email address.')
    } catch (error) {
      setHistoryMessage(error.message || 'Could not load order history. Check that the backend is running.')
    } finally { setHistoryLoading(false) }
  }
  const clearCustomerOrderHistory = async () => {
    const email = String(customerEmail || '').trim()
    if (!email) { setHistoryMessage('Enter the email address used at checkout before clearing history.'); return }
    if (!window.confirm(`Delete all SOLEFORM orders saved for ${email}? This also removes them from the admin order list.`)) return
    setHistoryLoading(true)
    setHistoryMessage('')
    try {
      await migrateLegacyOrderHistory()
      const response = await fetch(`${API_BASE}/api/orders/history?email=${encodeURIComponent(email)}`, { method: 'DELETE' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.detail || 'Could not clear order history.')
      setCustomerOrders([])
      setHistoryMessage(`${data.deleted || 0} order${data.deleted === 1 ? '' : 's'} deleted from the store history.`)
    } catch (error) { setHistoryMessage(error.message || 'Could not clear order history.') }
    finally { setHistoryLoading(false) }
  }
  useEffect(() => {
    let active = true
    // Automatically move old browser-only orders into backend/data/orders.json.
    migrateLegacyOrderHistory().catch(() => {})
    if (customerEmail) refreshCustomerOrderStatuses(customerEmail).catch(() => {})
    return () => { active = false }
  }, [])
  useEffect(() => { if (orderHistoryOpen && customerEmail) refreshCustomerOrderStatuses(customerEmail) }, [orderHistoryOpen])
  // Keep the confirmation visible long enough to read, then return to the storefront.
  useEffect(() => {
    if (!orderConfirmation) return
    const timer = window.setTimeout(() => {
      setOrderConfirmation(null)
      setCheckoutOpen(false)
    }, 8000)
    return () => window.clearTimeout(timer)
  }, [orderConfirmation])
  const submitOrder = async formElement => {
    console.info('[SOLEFORM CHECKOUT] submitOrder called', { placingOrder, hasForm: Boolean(formElement), cartItems: cart.length, time: new Date().toISOString() })
    if (placingOrder || !formElement || cart.length === 0) { console.warn('[SOLEFORM CHECKOUT] submitOrder aborted by guard'); return }
    setCheckoutError('')
    setPlacingOrder(true)
    const data = new FormData(formElement)
    const shipping = cartTotal >= 5000 ? 0 : 199
    const payload = { customer: { name: String(data.get('fullName')).trim(), email: String(data.get('email')).trim(), phone: String(data.get('phone')).trim(), address: String(data.get('address')).trim(), city: String(data.get('city')).trim(), pin: String(data.get('pin')).trim(), state: String(data.get('state')).trim() }, items: cart.map(item => ({ product_id: item.product.id, name: item.product.name, price: item.product.price, size: item.size, quantity: item.quantity, image: item.product.image })), subtotal: cartTotal, shipping, total: cartTotal + shipping, payment_method: 'cash_on_delivery_demo' }
    try {
      console.info('[SOLEFORM CHECKOUT] Sending POST /api/orders', { api: API_BASE, items: payload.items.length, total: payload.total })
      const response = await fetch(`${API_BASE}/api/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      console.info('[SOLEFORM CHECKOUT] Order API response', { status: response.status, ok: response.ok, time: new Date().toISOString() })
      if (!response.ok) {
        let message = 'Order service unavailable. Please try again.'
        try { const problem = await response.json(); message = problem.detail || message } catch {}
        throw new Error(message)
      }
      const order = await response.json()
      console.info('[SOLEFORM CHECKOUT] Order saved; setting confirmation state', { orderId: order.id, time: new Date().toISOString() })
      const historyEntry = { ...order, customer: order.customer || payload.customer, items: order.items || payload.items, created_at: order.created_at || new Date().toISOString() }
      setCustomerEmail(payload.customer.email)
      setCustomerOrders(current => [historyEntry, ...current.filter(item => item.id !== historyEntry.id)])
      setOrderConfirmation({ name: payload.customer.name, email: payload.customer.email, id: order.id, total: Number(order.total || payload.total) })
      setCart([])
      try { localStorage.removeItem('soleform-cart') } catch {}
    } catch (error) {
      console.error('[SOLEFORM CHECKOUT] Order failed', error)
      setCheckoutError(error.message || 'Could not place the order. Please try again.')
    } finally {
      setPlacingOrder(false)
    }
  }
  const handleCheckoutSubmit = event => {
    console.warn('[SOLEFORM CHECKOUT] FORM SUBMIT EVENT FIRED', { eventType: event.type, defaultPreventedBefore: event.defaultPrevented, time: new Date().toISOString() })
    // Capture phase prevents native form navigation even when Enter is pressed in a field.
    event.preventDefault()
    event.stopPropagation()
    const form = event.currentTarget
    if (placingOrder || !form) return
    if (!form.checkValidity()) { form.reportValidity(); return }
    void submitOrder(form)
  }
  const handlePlaceOrderClick = event => {
    console.info('[SOLEFORM CHECKOUT] PLACE ORDER CLICKED', { eventType: event.type, buttonType: event.currentTarget.type, time: new Date().toISOString() })
    // The CTA is type=button, so it cannot trigger a browser form navigation.
    event.preventDefault()
    const form = event.currentTarget.form
    if (!form || placingOrder) return
    if (!form.checkValidity()) { form.reportValidity(); return }
    void submitOrder(form)
  }


  return <div id="top" className="app-shell">
    <Header cartCount={cartCount} onCartClick={() => setCartOpen(true)} onOrderHistoryClick={() => setOrderHistoryOpen(true)} searchQuery={searchQuery} onSearchChange={setSearchQuery} wishlistCount={wishlist.length} wishlistActive={wishlistOnly} onWishlistClick={() => { setWishlistOnly(value => !value); document.querySelector('#products')?.scrollIntoView({behavior:'smooth'}) }} onNavigate={action => {
      setGalleryImage(null)
      if (action === 'about' || action === 'collections') { setInfoPage(action); return }
      if (action === 'new-arrivals') { setCategory('All sneakers'); setSearchQuery(''); setWishlistOnly(false); setCollectionPage(false); setShowAllProducts(false) }
      if (action === 'running') { setCategory('Running'); setWishlistOnly(false); setCollectionPage(true); setShowAllProducts(true) }
      if (action === 'court') { setCategory('Court'); setWishlistOnly(false); setCollectionPage(true); setShowAllProducts(true) }
      if (action === 'suede') { setCategory('Suede'); setWishlistOnly(false); setCollectionPage(true); setShowAllProducts(true) }
      if (action === 'everyday') { setCategory('Everyday'); setWishlistOnly(false); setCollectionPage(true); setShowAllProducts(true) }
      if (action === 'high-top') { setCategory('High-top'); setWishlistOnly(false); setCollectionPage(true); setShowAllProducts(true) }
      setInfoPage('')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }} />
    <main>
      {!collectionPage && <>
      <section className="hero section-wrap">
        <div className="hero-copy"><p className="eyebrow hero-kicker"><span className="lime-pip"/> ENGINEERED FOR EVERYDAY ICONS</p><h1>OWN YOUR<br className="desktop-break"/> GROUND<span className="hero-period">.</span></h1><p className="hero-description">Built for the everyday. Designed to stand out.<br className="desktop-break"/> Meet the silhouettes moving street culture forward.</p><div className="hero-actions"><a className="button button-dark" href="#products">SHOP NEW DROPS <ArrowUpRight size={15}/></a><span className="hero-caption">NEW SEASON / 2026</span></div></div>
        
        <div className="hero-visual">
          <span className="drop-badge">
            DROP<strong>01</strong>
          </span>

          <Suspense fallback={<div className="sneaker3d-preview-fallback" role="status" aria-label="Loading interactive sneaker"><div className="sneaker3d-preview-mark" aria-hidden="true">SF<span>01</span></div><span>LOADING INTERACTIVE 3D</span></div>}><Sneaker3D /></Suspense>
        </div>

      </section>
      <section className="benefits section-wrap" aria-label="Our benefits"><div><strong>DESIGNED TO MOVE</strong><span>Comfort from first step</span></div><div><strong>BUILT TO LAST</strong><span>Materials that go further</span></div><div><strong>CULTURE IN MOTION</strong><span>Inspired by the streets</span></div><div><strong>EASY RETURNS</strong><span>A better way to shop</span></div></section>
      </>}
      <section id="products" className={`products-section section-wrap ${collectionPage ? 'collection-page-view' : ''}`}>
      {collectionPage && <div className="collection-page-top"><button type="button" className="collection-back" onClick={() => { setCollectionPage(false); setCategory('All sneakers'); setSearchQuery(''); setWishlistOnly(false); setShowAllProducts(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>← BACK TO HOME</button><span>SOLEFORM / COLLECTIONS</span></div>}
      <div className="section-heading"><div><p className="eyebrow"><span className="section-number">01</span> {collectionPage ? 'SHOP THE COLLECTION' : 'THE LATEST ROTATION'}</p><h2>{wishlistOnly ? 'Your saved rotation.' : collectionPage ? `${category === 'All sneakers' ? 'All sneakers' : category} collection.` : 'Fresh off the line.'}</h2><p className="section-subtitle">{collectionPage ? `Explore every style in our ${category === 'All sneakers' ? 'full' : category.toLowerCase()} rotation.` : 'New silhouettes. Everyday energy.'}</p></div><span className="product-count-label">{filteredProducts.length.toString().padStart(2, '0')} PRODUCTS</span></div>
      <div className="catalog-toolbar"><div className="category-tabs" role="group" aria-label="Browse collections">{['All sneakers', 'Running', 'Court', 'Suede', 'Everyday', 'High-top', 'Limited edition'].map(item => <button key={item} className={category === item ? 'category-tab active' : 'category-tab'} onClick={() => { setCategory(item); setCollectionPage(item !== 'All sneakers'); setWishlistOnly(false); setShowAllProducts(item !== 'All sneakers'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>{item}</button>)}</div><div className="catalog-tools"><label className="sort-control"><SlidersHorizontal size={15}/><span>Sort</span><select aria-label="Sort products" value={sortBy} onChange={e => setSortBy(e.target.value)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name: A–Z</option></select></label>{wishlistOnly && <button className="clear-filters" onClick={() => setWishlistOnly(false)}>SHOW ALL <X size={13}/></button>}</div></div>
      {filteredProducts.length ? <div className="product-grid">{visibleProducts.map(product => <ProductCard key={product.id} product={product} onAdd={addToBag} onView={product => { setSelectedProduct(product); setSelectedSize(product.sizes?.includes(8) ? 8 : (product.sizes?.[0] || 8)); setGalleryImage(null); setGalleryIndex(0) }} isWishlisted={wishlist.includes(product.id)} onToggleWishlist={toggleWishlist}/>)}</div> : <div className="no-products"><Search size={25}/><h3>{wishlistOnly ? 'Your wishlist is taking shape.' : 'No sneakers found.'}</h3><p>{wishlistOnly ? 'Tap the heart on a sneaker to save it here.' : 'Try another search or clear your filters.'}</p><button className="button button-dark" onClick={() => {setSearchQuery('');setCategory('All sneakers');setWishlistOnly(false);setCollectionPage(false)}}>CLEAR FILTERS</button></div>}
      {!collectionPage && !browsingCollection && filteredProducts.length > 4 && <div className="show-more-products"><button className="button button-dark" onClick={() => setShowAllProducts(value => !value)}>{showAllProducts ? 'SHOW LESS' : `SHOW MORE (${filteredProducts.length - 4})`} <ArrowUpRight size={15}/></button></div>}
      </section>
      {!collectionPage && <section className="campaign section-wrap"><div className="campaign-copy"><p className="eyebrow"><span className="lime-pip dark-pip"/> THE STREET IS YOURS</p><span className="campaign-index">SF / CAMPAIGN 001</span><h2>NO RULES.<br/>JUST YOUR<br/>NEXT MOVE<span className="campaign-period">.</span></h2><p>A new uniform for wherever you are headed.</p><a className="button button-dark" href="#products">EXPLORE THE EDIT <ArrowUpRight size={15}/></a></div><div className="campaign-image-stage"><span className="campaign-image-label">FORM / IN MOTION</span><img src="/images/campaign-high-top.png" alt="Cream and olive high-top sneaker" loading="lazy" /></div></section>}
    </main>
    <footer id="footer" className="site-footer"><div className="footer-main section-wrap"><div className="footer-brand"><a className="wordmark" href="#top">SOLEFORM</a><p>Everyday icons. Uncommon energy.</p><div className="social-links"><a href="#footer" aria-label="Instagram"><Instagram size={17}/></a><a href="#footer" aria-label="TikTok" className="tiktok-mark">♪</a></div></div><div className="footer-column"><h3>SHOP</h3><a href="#products" onClick={e => {e.preventDefault();setCategory('All sneakers');setCollectionPage(false);setSearchQuery('');setWishlistOnly(false);window.scrollTo({top:0,behavior:'smooth'})}}>New arrivals</a><a href="#products" onClick={e => {e.preventDefault();setCategory('Running');setWishlistOnly(false);setCollectionPage(true);setShowAllProducts(true);window.scrollTo({top:0,behavior:'smooth'})}}>Running</a><a href="#products" onClick={e => {e.preventDefault();setCategory('Court');setWishlistOnly(false);setCollectionPage(true);setShowAllProducts(true);window.scrollTo({top:0,behavior:'smooth'})}}>Court classics</a><button className="footer-link-button" onClick={() => setInfoPage('collections')}>All collections ↗</button></div><div className="footer-column"><h3>HELP</h3><button className="footer-link-button" onClick={() => setInfoPage('shipping')}>Shipping & returns</button><button className="footer-link-button" onClick={() => setInfoPage('size-guide')}>Size guide</button><button className="footer-link-button" onClick={() => setInfoPage('contact')}>Contact us</button><button className="footer-link-button" onClick={() => setInfoPage('faqs')}>FAQs</button><button className="footer-link-button" onClick={() => setOrderHistoryOpen(true)}>Order history ↗</button></div><div className="footer-column"><h3>FOLLOW THE ROTATION</h3><button className="footer-link-button" onClick={() => setInfoPage('about')}>Our story ↗</button><button className="footer-link-button" onClick={() => setInfoPage('collections')}>The collections ↗</button></div></div><div className="footer-bottom section-wrap"><span>© 2026 SOLEFORM — CONCEPT STORE DESIGN</span><span>EVERYDAY ICONS. UNCOMMON ENERGY.</span></div></footer>

    {infoPage && <div className="overlay info-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setInfoPage('') }}><section className="info-page" role="dialog" aria-modal="true" aria-labelledby="info-page-title"><button className="modal-close info-close" onClick={() => setInfoPage('')} aria-label="Close page"><X/></button>{infoPage === 'about' ? <div className="story-editorial"><p className="eyebrow"><span className="lime-pip"/> THE SOLEFORM POINT OF VIEW</p><div className="story-editorial-heading"><h2 id="info-page-title">Made for the<br/><span>everyday extraordinary.</span></h2><p className="story-edition">OUR STORY / 001<br/>BUILT AROUND YOUR ROTATION</p></div><div className="story-editorial-hero"><div className="story-editorial-image"><img src="/images/campaign-high-top.png" alt="SOLEFORM high-top sneaker in a neutral studio setting" loading="lazy"/><span>FORM / IN MOTION</span></div><div className="story-editorial-copy"><p className="story-lead">The best things you wear are the ones that become part of your life.</p><p>SOLEFORM starts with a simple idea: everyday footwear should never feel ordinary. We bring together confident silhouettes, considered details and a point of view that feels as natural on the street as it does wherever the day takes you.</p><p>No noise for the sake of noise. Just thoughtful design, versatile colour and comfort-minded details made for the miles, plans and small moments that make up your own rotation.</p><div className="story-signoff"><span className="story-signoff-mark">SF.</span><span>EVERYDAY ICONS.<br/>UNCOMMON ENERGY.</span></div></div></div><div className="story-principles"><article><span>01 / DESIGN</span><h3>Intent in every line.</h3><p>Clean forms, purposeful details and a silhouette that earns its place.</p></article><article><span>02 / ROTATION</span><h3>Made to be lived in.</h3><p>Versatile styles for everyday plans, spontaneous detours and everything between.</p></article><article><span>03 / EXPRESSION</span><h3>Your pace. Your rules.</h3><p>A confident foundation for the way you choose to show up.</p></article></div><button className="button button-dark" onClick={() => {setInfoPage(''); document.querySelector('#products')?.scrollIntoView({behavior:'smooth'})}}>EXPLORE THE ROTATION <ArrowUpRight size={15}/></button></div> : infoPage === 'collections' ? <><p className="eyebrow">FIND YOUR EVERYDAY ICON</p><h2 id="info-page-title">The collections.</h2><p className="info-lead">Different moods. One rotation. Choose the lane that feels like you.</p><div className="collection-tiles">{[{name:'Running inspired',filter:'Running',img:'/images/form-runner.png',label:'01 / MOVE'},{name:'Court classics',filter:'Court',img:'/images/afterhours-low.png',label:'02 / PLAY'},{name:'Suede essentials',filter:'Suede',img:'/images/terrain-suede.png',label:'03 / TEXTURE'},{name:'Everyday minimal',filter:'Everyday',img:'/images/everyday-mono.png',label:'04 / REPEAT'}].map(item => <button className="collection-tile" key={item.filter} onClick={() => {setCategory(item.filter);setWishlistOnly(false);setCollectionPage(true);setShowAllProducts(true);setInfoPage('');window.scrollTo({top:0,behavior:'smooth'})}}><span>{item.label}</span><img src={item.img} alt=""/><strong>{item.name}</strong><span className="collection-cta">SHOP EDIT ↗</span></button>)}</div></> : infoPage === 'size-guide' ? <><p className="eyebrow">FIND YOUR FIT</p><h2 id="info-page-title">Size guide.</h2><p className="info-lead">Our store uses UK sizing. If you're between sizes, consider trying both sizes for your preferred fit.</p><table className="size-guide-table"><thead><tr><th>UK</th><th>EU</th><th>US MEN</th><th>US WOMEN</th></tr></thead><tbody>{[[6,40,7,8.5],[7,41,8,9.5],[8,42,9,10.5],[9,43,10,11.5],[10,44,11,12.5],[11,45,12,13.5]].map(row=><tr key={row[0]}>{row.map(value=><td key={value}>{value}</td>)}</tr>)}</tbody></table><p className="info-footnote">Sizing is a general guide and may vary by silhouette.</p></> : infoPage === 'contact' ? <><p className="eyebrow">WE'RE HERE TO HELP</p><h2 id="info-page-title">Talk to us.</h2><p className="info-lead">Questions about fit, your rotation, or the concept store? Send us a note and we'll get back to you.</p><form className="info-contact-form" onSubmit={e => {e.preventDefault();setInfoPage('');notify('Thanks — your demo message is ready to send.')}}><label>Your name<input name="name" required placeholder="Full name"/></label><label>Email address<input name="email" type="email" required placeholder="you@example.com"/></label><label>Message<textarea name="message" required placeholder="How can we help?" rows="4"/></label><button className="button button-dark" type="submit">SEND MESSAGE <ArrowUpRight size={15}/></button><p className="info-footnote">Demo form only — messages are not sent to a server.</p></form></> : <><p className="eyebrow">THE DETAILS</p><h2 id="info-page-title">{infoPage === 'shipping' ? 'Shipping & returns.' : 'Good to know.'}</h2><div className="info-faq-list">{(infoPage === 'shipping' ? [['Shipping','Complimentary shipping is shown on orders over ₹5,000 in this concept store. Shipping is not actually booked.'],['Returns','For this demo, no physical order or return is created. A real returns policy should be added before launch.']] : [['Are these real products?','SOLEFORM is a concept storefront built to demonstrate a premium sneaker shopping experience.'],['Can I pay online?','Online payments are not connected. Checkout currently places a demo order only.'],['Will my order be saved?','Orders are not stored in a backend yet. Your bag is managed in the current browser session.']]).map(([q,a])=><article key={q}><h3>{q}</h3><p>{a}</p></article>)}</div></>}</section></div>}

      {selectedProduct && (
        <div
          className="overlay"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedProduct(null);
              setGalleryImage(null);
            }
          }}
        >
          <section
            className="product-modal product-modal-premium"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => {
                setSelectedProduct(null);
                setGalleryImage(null);
              }}
              aria-label="Close product details"
            >
              <X size={20} />
            </button>

            {/* Product gallery */}
            <div className="modal-gallery-column">
              <div
                className={`modal-product-image product-tone-${selectedProduct.tone}`}
              >
                <span className="gallery-counter">SOLEFORM / 0{selectedProduct.id}</span>

                <span className="gallery-side-label">EVERYDAY ICONS</span>

                <img
                  className={
                    galleryImage === "zoom"
                      ? "gallery-zoom"
                      : galleryImage === "flip"
                        ? "gallery-flip"
                        : ""
                  }
                  src={selectedProduct.images?.[galleryIndex] || selectedProduct.image}
                  alt={selectedProduct.alt}
                />

                 <span className="gallery-image-caption">
                  OFFICIAL PRODUCT VIEW
                </span>
              </div>

              
                
<div className="gallery-thumbnails gallery-thumbnails-premium">
  {(selectedProduct.images?.length ? selectedProduct.images : [selectedProduct.image]).map((image, index) => (
    <button type="button" key={`${image}-${index}`} className={galleryIndex === index ? "active" : ""}
      onClick={() => { setGalleryIndex(index); setGalleryImage(null) }}
      aria-label={`View product image ${index + 1}`} aria-pressed={galleryIndex === index}>
      <img src={image} alt="" />
      <span>{String(index + 1).padStart(2, '0')} / {index === 0 ? 'FULL' : 'DETAIL'}</span>
    </button>
  ))}
</div>
            </div>

            {/* Product information */}
            <div className="modal-product-info modal-product-info-premium">
              <p className="eyebrow">
                <span className="lime-pip" />
                {selectedProduct.tag}
              </p>

              <p className="modal-product-reference">
                SOLEFORM ORIGINALS / SF-0{selectedProduct.id}
              </p>

              <h2 id="product-modal-title">{selectedProduct.name}</h2>

              <div className="modal-price-row">
                <p className="modal-price">
                  ₹{selectedProduct.price.toLocaleString("en-IN")}
                </p>
                <span className="modal-tax-note">Inclusive of all taxes</span>
              </div>

              <p className="modal-description">{selectedProduct.description}</p>

              
            
              <div className="product-availability">
                <span className="availability-dot" />
                <span>{selectedProduct.stock ? (Number(selectedProduct.stock[selectedSize] ?? 0) > 0 ? `UK size ${selectedSize} selected · ${selectedProduct.stock[selectedSize]} pairs in stock` : `UK size ${selectedSize} is currently sold out`) : `UK size ${selectedSize} selected · Demo availability`}</span>
              </div>



               
              <div className="product-detail-highlights">
                <div>
                  <span className="detail-icon">
                    <Footprints size={17} />
                  </span>
                  <span>Everyday comfort</span>
                </div>

                <div>
                  <span className="detail-icon">
                    <Layers3 size={17} />
                  </span>
                  <span>Signature design</span>
                </div>

                <div>
                  <span className="detail-icon">
                    <PackageCheck size={17} />
                  </span>
                  <span>Easy-to-style silhouette</span>
                </div>
              </div>


              <div className="modal-section-divider" />

              <div className="size-heading-row">
                <p className="size-label">SELECT YOUR SIZE</p>
                <button
                  type="button"
                  className="size-guide-inline"
                  onClick={() => setInfoPage("size-guide")}
                >
                  Size guide <ArrowUpRight size={13} />
                </button>
              </div>

              <p className="size-helper">All sizes are in UK sizing.</p>

              <div className="size-grid size-grid-premium">
                {(Array.isArray(selectedProduct.sizes) && selectedProduct.sizes.length ? selectedProduct.sizes : sizes).map((size) => (
                  <button
                    type="button"
                    key={size}
                    className={
                      selectedSize === size
                        ? "size-option selected"
                        : "size-option"
                    }
                    onClick={() => setSelectedSize(size)}
                    aria-pressed={selectedSize === size}
                    disabled={Boolean(selectedProduct.stock && Number(selectedProduct.stock[size] ?? 0) <= 0)}
                    title={selectedProduct.stock && Number(selectedProduct.stock[size] ?? 0) <= 0 ? 'Currently out of stock' : `Select UK size ${size}`}
                  >
                    {size}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="button button-dark modal-add modal-add-premium"
                onClick={() => addToBag(selectedProduct, selectedSize)}
                disabled={Boolean(selectedProduct.stock && Number(selectedProduct.stock[selectedSize] ?? 0) <= 0)}
              >
                <span>ADD TO BAG</span>
                <span>
                  ₹{selectedProduct.price.toLocaleString("en-IN")}
                  <ArrowUpRight size={17} />
                </span>
              </button>

              <p className="modal-note modal-note-premium">
                <span className="lime-pip" />
                Complimentary shipping on orders over ₹5,000.
              </p>

              <div className="related-products">
                <div className="related-products-heading"><span>COMPLETE YOUR ROTATION</span><small>YOU MAY ALSO LIKE</small></div>
                <div className="related-products-grid">
                  {products.filter(product => product.id !== selectedProduct.id && (product.category === selectedProduct.category || !product.category)).slice(0, 3).map(product => (
                    <button type="button" className="related-product" key={product.id} onClick={() => { setSelectedProduct(product); setSelectedSize(product.sizes?.includes(8) ? 8 : (product.sizes?.[0] || 8)); setGalleryImage(null); setGalleryIndex(0) }}>
                      <span className={`related-product-image product-tone-${product.tone}`}><img src={product.image} alt="" /></span>
                      <strong>{product.name}</strong><span>₹{Number(product.price).toLocaleString('en-IN')}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="modal-bottom-note">
                <span>01 / CHOOSE YOUR FIT</span>
                <span>02 / MAKE IT YOURS</span>
              </div>
            </div>
          </section>
        </div>
      )}
    {cartOpen && <div className="overlay cart-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setCartOpen(false) }}><aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title"><div className="cart-heading"><div><p className="eyebrow">YOUR ROTATION</p><h2 id="cart-title">Your bag ({cartCount})</h2></div><button className="modal-close" onClick={() => setCartOpen(false)} aria-label="Close bag"><X/></button></div>{cart.length === 0 ? <div className="empty-cart"><ShoppingBag size={35}/><h3>Your bag is waiting.</h3><p>Find your next everyday icon.</p><button className="button button-dark" onClick={() => { setCartOpen(false); document.querySelector('#products')?.scrollIntoView({behavior:'smooth'}) }}>SHOP THE ROTATION</button></div> : <><div className="cart-items">{cart.map(item => <article className="cart-item" key={`${item.product.id}-${item.size}`}><div className={`cart-item-image product-tone-${item.product.tone}`}><img src={item.product.image} alt=""/></div><div className="cart-item-info"><h3>{item.product.name}</h3><p>UK size {item.size}</p><strong>₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</strong><div className="quantity-control"><button onClick={() => changeQuantity(item.product.id, item.size, -1)} aria-label="Decrease quantity"><Minus size={13}/></button><span>{item.quantity}</span><button onClick={() => changeQuantity(item.product.id, item.size, 1)} aria-label="Increase quantity"><Plus size={13}/></button><button className="remove-item" onClick={() => removeItem(item.product.id, item.size)} aria-label="Remove item"><Trash2 size={14}/></button></div></div></article>)}</div><div className="cart-summary"><div><span>Subtotal</span><strong>₹{cartTotal.toLocaleString('en-IN')}</strong></div><p>Shipping and taxes calculated at checkout.</p><button className="button button-dark" onClick={() => { setCartOpen(false); setCheckoutOpen(true); setOrderConfirmation(null) }}>CONTINUE TO CHECKOUT <ArrowUpRight size={15}/></button></div></>}</aside></div>}
    {checkoutOpen && <div className="checkout-screen">
      <header className="checkout-header section-wrap"><button className="checkout-back" onClick={() => { setCheckoutOpen(false); setCartOpen(true) }}>← BACK TO BAG</button><a className="wordmark" href="#top" onClick={e => { e.preventDefault(); setCheckoutOpen(false) }}>SOLEFORM</a><span className="checkout-secure">DEMO CHECKOUT</span></header>
      <main className="checkout-layout section-wrap">
        <div className="checkout-form-column"><p className="eyebrow">ALMOST YOURS</p><h1>Checkout.</h1><p className="checkout-intro">Your next everyday icon is just a few details away.</p>
          <form className="checkout-form" onSubmitCapture={handleCheckoutSubmit} onSubmit={event => { event.preventDefault(); event.stopPropagation() }}>
            <section className="checkout-fieldset"><div className="checkout-section-title"><span>01</span><h2>Contact information</h2></div><label>Email address<input type="email" name="email" placeholder="you@example.com" autoComplete="email" required /></label><label>Phone number<input type="tel" name="phone" placeholder="10-digit mobile number" autoComplete="tel" pattern="[0-9 +()-]{10,}" required /></label></section>
            <section className="checkout-fieldset"><div className="checkout-section-title"><span>02</span><h2>Shipping address</h2></div><label>Full name<input name="fullName" placeholder="Your full name" autoComplete="name" required /></label><label>Address<input name="address" placeholder="House / street / locality" autoComplete="street-address" required /></label><div className="checkout-two-fields"><label>City<input name="city" placeholder="City" autoComplete="address-level2" required /></label><label>PIN code<input name="pin" placeholder="6-digit PIN" inputMode="numeric" pattern="[0-9]{6}" maxLength="6" autoComplete="postal-code" required /></label></div><label>State<input name="state" placeholder="State" autoComplete="address-level1" required /></label></section>
            <section className="checkout-fieldset"><div className="checkout-section-title"><span>03</span><h2>Payment method</h2></div><div className="demo-payment"><span className="demo-radio"/><div><strong>Pay on delivery</strong><p>Demo option — no payment will be collected.</p></div><span className="demo-payment-tag">DEMO</span></div></section>
            <button className="button button-dark checkout-place-order" type="button" onClick={handlePlaceOrderClick} disabled={placingOrder || cart.length === 0}>{placingOrder ? 'PLACING ORDER…' : `PLACE ORDER · ₹${(cartTotal + (cartTotal >= 5000 ? 0 : 199)).toLocaleString('en-IN')}`} <ArrowUpRight size={16}/></button>{checkoutError && <p className="checkout-error" role="alert">{checkoutError}</p>}<p className="checkout-terms">Cash on delivery demo. No online payment is collected in this version.</p>
          </form>
        </div>
        <aside className="checkout-order-card"><p className="eyebrow">YOUR ROTATION</p><h2>Order summary <span>({cartCount})</span></h2><div className="checkout-order-items">{cart.map(item => <article className="checkout-order-item" key={`${item.product.id}-${item.size}`}><div className={`checkout-order-image product-tone-${item.product.tone}`}><img src={item.product.image} alt=""/><span>{item.quantity}</span></div><div className="checkout-order-name"><strong>{item.product.name}</strong><span>UK size {item.size}</span><span>Qty {item.quantity}</span></div><strong className="checkout-line-price">₹{(item.product.price*item.quantity).toLocaleString('en-IN')}</strong></article>)}</div><div className="checkout-cost-row"><span>Subtotal</span><span>₹{cartTotal.toLocaleString('en-IN')}</span></div><div className="checkout-cost-row"><span>Shipping</span><span>{cartTotal >= 5000 ? 'FREE' : '₹199'}</span></div><div className="checkout-cost-row checkout-grand-total"><strong>Total</strong><strong>₹{(cartTotal + (cartTotal >= 5000 ? 0 : 199)).toLocaleString('en-IN')}</strong></div><p className="checkout-demo-note">Concept store checkout · Demo only</p></aside>
      </main>

    </div>}
    {orderConfirmation && <div className="order-success-overlay" role="presentation"><section className="order-success-dialog" role="dialog" aria-modal="true" aria-labelledby="order-success-title"><button type="button" className="modal-close order-success-close" onClick={() => { setOrderConfirmation(null); setCheckoutOpen(false) }} aria-label="Close order confirmation"><X/></button><div className="confirmation-mark">✓</div><p className="eyebrow">ORDER PLACED SUCCESSFULLY</p><h2 id="order-success-title">You're in good company.</h2><p>Thanks, {orderConfirmation.name.split(' ')[0]}. Your order <strong>{orderConfirmation.id}</strong> has been received.</p><div className="confirmation-summary"><span>Order total</span><strong>₹{orderConfirmation.total.toLocaleString('en-IN')}</strong></div><p className="demo-disclaimer">Cash on delivery demo. No payment has been collected.</p><div className="order-success-actions"><button className="button button-dark" onClick={() => { setCustomerEmail(orderConfirmation.email || customerEmail); setOrderConfirmation(null); setOrderHistoryOpen(true) }}>VIEW ORDER HISTORY</button><button className="button button-light" onClick={() => { setOrderConfirmation(null); setCheckoutOpen(false); window.scrollTo({top:0,behavior:'smooth'}) }}>CONTINUE SHOPPING</button></div></section></div>}
    {orderHistoryOpen && <div className="overlay order-history-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setOrderHistoryOpen(false) }}><section className="order-history-dialog" role="dialog" aria-modal="true" aria-labelledby="order-history-title"><div className="cart-heading"><div><p className="eyebrow">YOUR SOLEFORM ACTIVITY</p><h2 id="order-history-title">Order history</h2><p className="order-history-refresh-note">Orders are loaded from the store's backend file.</p></div><button type="button" className="modal-close" onClick={() => setOrderHistoryOpen(false)} aria-label="Close order history"><X/></button></div><div className="order-history-search"><label htmlFor="order-history-email">Checkout email</label><input id="order-history-email" type="email" value={customerEmail} onChange={event => setCustomerEmail(event.target.value)} placeholder="you@example.com" autoComplete="email"/><div className="order-history-actions"><button type="button" className="order-history-refresh" onClick={() => refreshCustomerOrderStatuses()} disabled={historyLoading}>{historyLoading ? 'LOADING…' : 'LOAD MY ORDERS'}</button><button type="button" className="order-history-clear" onClick={clearCustomerOrderHistory} disabled={historyLoading}>CLEAR MY HISTORY</button></div></div>{historyMessage && <p className="order-history-feedback" role="status">{historyMessage}</p>}{customerOrders.length ? <div className="customer-order-list">{customerOrders.map(order => <article className="customer-order-card" key={order.id}><div className="customer-order-top"><strong>{order.id}</strong><span>{new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}</span></div><div className="customer-order-lines">{(order.items || []).map((item,index) => <div key={`${order.id}-${item.product_id || item.name}-${index}`}><span>{item.name} · UK {item.size} × {item.quantity}</span><strong>₹{(Number(item.price || 0)*Number(item.quantity || 1)).toLocaleString('en-IN')}</strong></div>)}</div><div className="customer-order-bottom"><span className="order-status-chip">{String(order.status || 'received').replaceAll('_',' ')}</span><strong>Total ₹{Number(order.total || 0).toLocaleString('en-IN')}</strong></div></article>)}</div> : <div className="empty-cart"><PackageCheck size={35}/><h3>No orders loaded.</h3><p>Enter the email address used at checkout and choose Load My Orders.</p></div>}<p className="order-history-note">Clearing customer history removes orders for this email from the backend order file and from the admin list.</p></section></div>}
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>
}
export default App
