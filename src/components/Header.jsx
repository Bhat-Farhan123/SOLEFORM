import { useState } from 'react'
import { Menu, Search, ShoppingBag, Heart, X, PackageSearch } from 'lucide-react'

const links = [
  { label: 'New arrivals', action: 'new-arrivals' },
  { label: 'Running', action: 'running' },
  { label: 'Court classics', action: 'court' },
  { label: 'Suede', action: 'suede' },
  { label: 'Everyday', action: 'everyday' },
  { label: 'High-top', action: 'high-top' },
  { label: 'Our story', action: 'about' },
  { label: 'Collections', action: 'collections' },
]

function navigateTo(link, onNavigate, closeMenu) {
  closeMenu?.()
  onNavigate?.(link.action)
}

export default function Header({ cartCount, onCartClick, searchQuery, onSearchChange, wishlistCount, onWishlistClick, wishlistActive, onNavigate, onOrderHistoryClick }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  return <>
    <div className="announcement"><span>COMPLIMENTARY SHIPPING ON ORDERS OVER ₹5,000</span><span className="announcement-extra">MADE FOR YOUR EVERYDAY ROTATION ↗</span></div>
    <header className="site-header">
      <button className="icon-button mobile-menu-button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      <a className="wordmark" href="#top" aria-label="SOLEFORM home">SOLEFORM<span className="wordmark-dot">.</span></a>
      <nav className="desktop-nav" aria-label="Main navigation">{links.map(link => <a href={link.action === 'about' ? '#footer' : '#products'} key={link.action} onClick={e => { e.preventDefault(); navigateTo(link, onNavigate) }}>{link.label}</a>)}</nav>
      <div className="header-actions">
        <button className={`icon-button search-button ${searchOpen ? 'is-active' : ''}`} aria-label="Search products" onClick={() => setSearchOpen(!searchOpen)}><Search /></button>
        <button className="icon-button order-history-button" onClick={onOrderHistoryClick} aria-label="Order history and tracking" title="Order history / Track order"><PackageSearch /><span className="header-action-label">Orders</span></button>
        <button className={`icon-button wishlist-button ${wishlistActive ? 'is-active' : ''}`} onClick={onWishlistClick} aria-label={`Wishlist, ${wishlistCount} saved products`}><Heart fill={wishlistActive ? 'currentColor' : 'none'} /><span className="wishlist-count">{wishlistCount}</span></button>
        <button className="icon-button bag-button" onClick={onCartClick} aria-label={`Shopping bag, ${cartCount} items`}><ShoppingBag /><span className="cart-count">{cartCount}</span></button>
      </div>
    </header>
    {searchOpen && <form className="search-panel" onSubmit={e => {e.preventDefault(); document.querySelector('#products')?.scrollIntoView({behavior:'smooth'}); setSearchOpen(false)}}><Search size={18}/><input autoFocus value={searchQuery} onChange={e => onSearchChange(e.target.value)} placeholder="Search sneakers, styles…" aria-label="Search sneakers"/><button type="button" className="search-clear" onClick={() => onSearchChange('')}>Clear</button><button type="submit">View results</button></form>}
    {menuOpen && <nav className="mobile-nav" aria-label="Mobile navigation">{links.map(link => <a href={link.action === 'about' ? '#footer' : '#products'} key={link.action} onClick={e => { e.preventDefault(); navigateTo(link, onNavigate, () => setMenuOpen(false)) }}>{link.label}</a>)}<button onClick={() => {onOrderHistoryClick?.(); setMenuOpen(false)}}>Order history / Track order</button><button onClick={() => {onWishlistClick(); setMenuOpen(false)}}>Wishlist ({wishlistCount})</button><a href="#footer" onClick={() => setMenuOpen(false)}>Help & contact</a></nav>}
  </>
}
