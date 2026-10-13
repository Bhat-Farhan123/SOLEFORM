from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from typing import Optional
from urllib.parse import unquote
import json, os, re, secrets, shutil, uuid
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent / '.env')
except ImportError:
    pass

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / 'backend' / 'data'
UPLOAD_DIR = ROOT / 'public' / 'uploads'
PRODUCTS_FILE = DATA_DIR / 'products.json'
ORDERS_FILE = DATA_DIR / 'orders.json'
DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ADMIN_PASSWORD = os.getenv('SOLEFORM_ADMIN_PASSWORD', '').strip()
if not ADMIN_PASSWORD or ADMIN_PASSWORD == 'replace-with-a-long-unique-password':
    raise RuntimeError('Admin password is not configured. Copy backend/.env.example to backend/.env and set SOLEFORM_ADMIN_PASSWORD.')


SEED = [
 {"id":1,"name":"Form Runner 01","price":6499,"tag":"RUNNING INSPIRED","category":"Running","image":"/images/form-runner.png","images":["/images/form-runner.png"],"alt":"Cream sneaker with neon lime and black accents","tone":"stone","description":"A bold everyday runner with a sculpted sole, breathable mesh and signature neon-lime details.","sizes":[6,7,8,9,10,11],"stock":{"6":4,"7":5,"8":8,"9":6,"10":4,"11":2},"featured":True},
 {"id":2,"name":"Afterhours Low","price":5999,"tag":"COURT CLASSIC","category":"Court","image":"/images/afterhours-low.png","images":["/images/afterhours-low.png"],"alt":"Black chunky everyday sneaker","tone":"sage","description":"A court-inspired low-top with an all-black finish, cushioned support and an easy everyday profile.","sizes":[6,7,8,9,10,11],"stock":{"6":3,"7":4,"8":6,"9":5,"10":3,"11":2},"featured":True},
 {"id":3,"name":"Terrain Suede","price":7299,"tag":"PREMIUM SUEDE","category":"Suede","image":"/images/terrain-suede.png","images":["/images/terrain-suede.png"],"alt":"Sand suede sneaker with gum outsole","tone":"sand","description":"Soft sand-toned suede and a gum outsole bring a refined texture to this versatile silhouette.","sizes":[6,7,8,9,10,11],"stock":{"6":2,"7":3,"8":4,"9":4,"10":2,"11":1},"featured":True},
 {"id":4,"name":"Everyday Mono","price":5499,"tag":"DAILY ESSENTIAL","category":"Everyday","image":"/images/everyday-mono.png","images":["/images/everyday-mono.png"],"alt":"Minimal white everyday sneaker","tone":"mist","description":"A clean monochrome sneaker designed to pair with just about anything in your rotation.","sizes":[6,7,8,9,10,11],"stock":{"6":5,"7":7,"8":9,"9":7,"10":5,"11":3},"featured":True}
]

if not PRODUCTS_FILE.exists():
    PRODUCTS_FILE.write_text(json.dumps(SEED, indent=2), encoding='utf-8')

# Add the starter catalog expansion once, without overwriting products managed by the admin.
try:
    existing = json.loads(PRODUCTS_FILE.read_text(encoding='utf-8'))
    if isinstance(existing, list):
        known = {str(item.get('name', '')).casefold() for item in existing if isinstance(item, dict)}
        catalog_additions = [["Motion Runner 02", 6999, "Running", "RUNNING INSPIRED", "stone", "/images/hero-runner.png"], ["Pace Runner 03", 7499, "Running", "PERFORMANCE SERIES", "mist", "/images/form-runner.png"], ["Aero Runner", 6799, "Running", "LIGHTWEIGHT COMFORT", "sage", "/images/hero-runner.png"], ["Velocity Knit", 6299, "Running", "BREATHABLE KNIT", "sand", "/images/form-runner.png"], ["Trackline Runner", 7199, "Running", "DAILY PERFORMANCE", "stone", "/images/hero-runner.png"], ["Courtline 02", 6499, "Court", "COURT CLASSIC", "mist", "/images/afterhours-low.png"], ["Retro Court 01", 6999, "Court", "RETRO COURT", "sage", "/images/afterhours-low.png"], ["Courtform Mono", 5799, "Court", "CLEAN COURT STYLE", "mist", "/images/everyday-mono.png"], ["Baseline Low", 6199, "Court", "EVERYDAY COURT", "stone", "/images/afterhours-low.png"], ["Night Shift Court", 7299, "Court", "AFTER-DARK EDITION", "sage", "/images/afterhours-low.png"], ["Earth Suede 02", 7499, "Suede", "PREMIUM SUEDE", "sand", "/images/terrain-suede.png"], ["Desert Low", 6999, "Suede", "DESERT TONES", "sand", "/images/terrain-suede.png"], ["Stone Suede", 7799, "Suede", "TEXTURED ESSENTIAL", "stone", "/images/terrain-suede.png"], ["Dune Walker", 7199, "Suede", "SOFT EARTH PALETTE", "sand", "/images/terrain-suede.png"], ["Canyon Suede", 7599, "Suede", "PREMIUM MATERIALS", "sage", "/images/terrain-suede.png"], ["Streetform Low", 5799, "Everyday", "STREET ESSENTIAL", "mist", "/images/everyday-mono.png"], ["Cloudstep Knit", 6299, "Everyday", "ALL-DAY COMFORT", "mist", "/images/everyday-mono.png"], ["Highline Street", 7999, "Everyday", "CITY ROTATION", "stone", "/images/campaign-high-top.png"], ["Daily Form 02", 5599, "Everyday", "DAILY ESSENTIAL", "mist", "/images/everyday-mono.png"], ["Mono Flex", 5999, "Everyday", "MINIMAL BY DESIGN", "stone", "/images/everyday-mono.png"], ["Courtform High 01", 7499, "High-top", "LIMITED EDITION", "stone", "/images/campaign-high-top.png"], ["Midnight High", 7799, "High-top", "HIGH-TOP SERIES", "sage", "/images/campaign-high-top.png"], ["Canvas Rise", 6799, "High-top", "CANVAS COLLECTION", "sand", "/images/campaign-high-top.png"], ["Volt High 02", 8199, "Limited edition", "LIMITED RUN", "stone", "/images/hero-runner.png"], ["Studio Edition 01", 8999, "Limited edition", "STUDIO EXCLUSIVE", "sage", "/images/campaign-high-top.png"]]
        next_id = max([int(item.get('id', 0)) for item in existing if isinstance(item, dict)] + [0]) + 1
        for name, price, category, tag, tone, image in catalog_additions:
            if name.casefold() not in known:
                existing.append({"id": next_id, "name": name, "price": price, "category": category, "tag": tag,
                    "image": image, "images": [image], "alt": f"SOLEFORM {name} sneaker", "tone": tone,
                    "description": f"{name} brings considered materials, everyday comfort and a distinctive SOLEFORM silhouette to your rotation.",
                    "sizes": [6,7,8,9,10,11], "stock": {"6":3,"7":5,"8":6,"9":6,"10":4,"11":2}, "featured": False})
                known.add(name.casefold()); next_id += 1
        PRODUCTS_FILE.write_text(json.dumps(existing, indent=2, ensure_ascii=False), encoding='utf-8')
except (OSError, json.JSONDecodeError, TypeError, ValueError):
    pass

def read_products():
    try:
        data = json.loads(PRODUCTS_FILE.read_text(encoding='utf-8'))
        return data if isinstance(data, list) else SEED.copy()
    except (json.JSONDecodeError, OSError):
        return SEED.copy()

def save_products(products):
    temp = PRODUCTS_FILE.with_suffix('.tmp')
    temp.write_text(json.dumps(products, indent=2, ensure_ascii=False), encoding='utf-8')
    temp.replace(PRODUCTS_FILE)

def read_orders():
    try:
        data = json.loads(ORDERS_FILE.read_text(encoding='utf-8')) if ORDERS_FILE.exists() else []
        return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError):
        return []

def save_orders(orders):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    temp = ORDERS_FILE.with_suffix('.tmp')
    temp.write_text(json.dumps(orders, indent=2, ensure_ascii=False), encoding='utf-8')
    temp.replace(ORDERS_FILE)

def require_admin(password: Optional[str]):
    if not password or not secrets.compare_digest(password, ADMIN_PASSWORD):
        raise HTTPException(status_code=401, detail='Admin password is incorrect.')

app = FastAPI(title='SOLEFORM Local Store API', version='1.0.0')
ALLOWED_ORIGINS = [origin.strip() for origin in os.getenv('SOLEFORM_ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000').split(',') if origin.strip()]
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_credentials=True, allow_methods=['*'], allow_headers=['*'])
app.mount('/uploads', StaticFiles(directory=str(UPLOAD_DIR)), name='uploads')

@app.get('/api/health')
def health(): return {'status':'ok','storage':'local-json'}

@app.get('/api/products')
def list_products(): return read_products()

@app.post('/api/orders')
def create_order(payload: dict):
    # Demo checkout: persist an order record locally; no payment is collected.
    print('[SOLEFORM DEBUG] POST /api/orders received', flush=True)
    customer = payload.get('customer') if isinstance(payload.get('customer'), dict) else {}
    items = payload.get('items') if isinstance(payload.get('items'), list) else []
    if not str(customer.get('name', '')).strip() or not str(customer.get('email', '')).strip() or not items:
        raise HTTPException(status_code=400, detail='Customer details and at least one cart item are required.')
    clean_items = []
    subtotal = 0
    products_by_id = {int(p.get('id', -1)): p for p in read_products() if isinstance(p, dict)}
    for item in items:
        try:
            pid, size, qty = int(item.get('product_id')), int(item.get('size')), int(item.get('quantity'))
        except (TypeError, ValueError):
            raise HTTPException(status_code=400, detail='Invalid cart item.')
        product = products_by_id.get(pid)
        if not product or qty < 1 or qty > 20 or size not in [int(v) for v in product.get('sizes', [])]:
            raise HTTPException(status_code=400, detail='A cart item is invalid or no longer available.')
        price = int(product.get('price', 0))
        stock = product.get('stock') or {}
        if int(stock.get(str(size), 0) or 0) < qty:
            raise HTTPException(status_code=409, detail=f'Not enough stock for {product.get("name")} UK {size}.')
        clean_items.append({'product_id': pid, 'name': product.get('name'), 'price': price, 'size': size, 'quantity': qty, 'image': product.get('image')})
        subtotal += price * qty
    shipping = 0 if subtotal >= 5000 else 199
    order = {'id': 'SF-' + uuid.uuid4().hex[:8].upper(), 'created_at': __import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat(), 'status': 'received', 'payment_status': 'not_collected', 'customer': {key: str(customer.get(key, '')).strip() for key in ('name','email','phone','address','city','pin','state')}, 'items': clean_items, 'subtotal': subtotal, 'shipping': shipping, 'total': subtotal + shipping}
    orders = read_orders()
    orders.append(order)
    # Reserve stock when an order is recorded so repeated checkout cannot exceed available inventory.
    products = read_products()
    for line in clean_items:
        for product in products:
            if int(product.get('id', -1)) == line['product_id']:
                stock = product.setdefault('stock', {})
                key = str(line['size'])
                stock[key] = max(0, int(stock.get(key, 0) or 0) - line['quantity'])
                break
    print(f"[SOLEFORM DEBUG] Saving order {order['id']} and updated product stock to {DATA_DIR}", flush=True)
    save_products(products)
    save_orders(orders)
    print(f"[SOLEFORM DEBUG] Order {order['id']} saved successfully; total_orders={len(orders)}", flush=True)
    return order

@app.post('/api/orders/import-history')
def import_legacy_order_history(payload: dict):
    # One-time migration for old demo orders stored in browser localStorage.
    incoming = payload.get('orders') if isinstance(payload.get('orders'), list) else []
    if not incoming:
        return {'imported': 0, 'orders': []}
    orders = read_orders()
    known_ids = {str(order.get('id', '')).upper() for order in orders if isinstance(order, dict)}
    imported = []
    for item in incoming[:200]:
        if not isinstance(item, dict):
            continue
        order_id = str(item.get('id', '')).strip().upper()
        customer = item.get('customer') if isinstance(item.get('customer'), dict) else {}
        email = str(customer.get('email', '')).strip().casefold()
        lines = item.get('items') if isinstance(item.get('items'), list) else []
        if not order_id.startswith('SF-') or not email or not lines or order_id in known_ids:
            continue
        clean_lines = []
        for line in lines[:50]:
            if not isinstance(line, dict):
                continue
            try:
                qty = max(1, min(100, int(line.get('quantity', 1))))
                price = max(0, int(float(line.get('price', 0))))
                size = int(line.get('size', 8))
            except (TypeError, ValueError):
                continue
            name = str(line.get('name', '')).strip()
            if not name:
                continue
            clean_lines.append({'product_id': line.get('product_id'), 'name': name, 'price': price, 'size': size, 'quantity': qty, 'image': str(line.get('image', ''))})
        if not clean_lines:
            continue
        try:
            subtotal = max(0, int(float(item.get('subtotal', sum(line['price'] * line['quantity'] for line in clean_lines)))))
            shipping = max(0, int(float(item.get('shipping', 0))))
            total = max(0, int(float(item.get('total', subtotal + shipping))))
        except (TypeError, ValueError):
            continue
        record = {
            'id': order_id,
            'created_at': str(item.get('created_at') or __import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat()),
            'status': str(item.get('status') or 'received'),
            'payment_status': str(item.get('payment_status') or 'not_collected'),
            'customer': {key: str(customer.get(key, '')).strip() for key in ('name','email','phone','address','city','pin','state')},
            'items': clean_lines, 'subtotal': subtotal, 'shipping': shipping, 'total': total,
            'migrated_from_browser_history': True,
        }
        orders.append(record); imported.append(record); known_ids.add(order_id)
    if imported:
        save_orders(orders)
    stored_ids = sorted({str(item.get('id', '')).strip().upper() for item in incoming if isinstance(item, dict) and str(item.get('id', '')).strip().upper() in known_ids})
    return {'imported': len(imported), 'orders': imported, 'stored_ids': stored_ids}

@app.get('/api/orders/history')
def list_customer_order_history(email: str):
    email_key = unquote(str(email or '')).strip().casefold()
    if not email_key or '@' not in email_key:
        raise HTTPException(status_code=400, detail='Enter the email address used at checkout.')
    matches = [order for order in read_orders() if str((order.get('customer') or {}).get('email', '')).strip().casefold() == email_key]
    return sorted(matches, key=lambda order: str(order.get('created_at', '')), reverse=True)

@app.delete('/api/orders/history')
def clear_customer_order_history(email: str):
    email_key = unquote(str(email or '')).strip().casefold()
    if not email_key or '@' not in email_key:
        raise HTTPException(status_code=400, detail='Enter the email address used at checkout.')
    orders = read_orders()
    remaining = [order for order in orders if str((order.get('customer') or {}).get('email', '')).strip().casefold() != email_key]
    removed = len(orders) - len(remaining)
    save_orders(remaining)
    return {'ok': True, 'deleted': removed}

@app.post('/api/orders/lookup')
def lookup_customer_order(payload: dict):
    """Return a customer's order only when both order ID and email match."""
    order_id = str(payload.get('order_id', '')).strip().upper()
    email = str(payload.get('email', '')).strip().casefold()
    if not order_id or not email:
        raise HTTPException(status_code=400, detail='Enter your order ID and checkout email.')
    orders = read_orders()
    for order in orders:
        customer = order.get('customer') or {}
        if str(order.get('id', '')).upper() == order_id and str(customer.get('email', '')).strip().casefold() == email:
            # Return only the matching customer's order; never expose other orders.
            return {key: order.get(key) for key in ('id', 'created_at', 'status', 'payment_status', 'items', 'subtotal', 'shipping', 'total')}
    raise HTTPException(status_code=404, detail='We could not find an order matching that ID and email.')

@app.get('/api/admin/orders')
def list_admin_orders(x_admin_password: Optional[str] = Header(default=None)):
    require_admin(x_admin_password)
    return sorted(read_orders(), key=lambda order: str(order.get('created_at', '')), reverse=True)

@app.delete('/api/admin/orders')
def clear_all_admin_orders(x_admin_password: Optional[str] = Header(default=None)):
    require_admin(x_admin_password)
    removed = len(read_orders())
    save_orders([])
    return {'ok': True, 'deleted': removed}

@app.patch('/api/admin/orders/{order_id}')
def update_order_status(order_id: str, payload: dict, x_admin_password: Optional[str] = Header(default=None)):
    require_admin(x_admin_password)
    allowed_statuses = {'received', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'}
    status = str(payload.get('status', '')).strip().lower()
    if status not in allowed_statuses:
        raise HTTPException(status_code=400, detail='Choose a valid order status.')
    try:
        orders = json.loads(ORDERS_FILE.read_text(encoding='utf-8')) if ORDERS_FILE.exists() else []
    except (OSError, json.JSONDecodeError):
        orders = []
    for order in orders:
        if order.get('id') == order_id:
            order['status'] = status
            save_orders(orders)
            return order
    raise HTTPException(status_code=404, detail='Order not found.')

@app.post('/api/admin/login')
def admin_login(payload: dict):
    require_admin(str(payload.get('password','')))
    return {'ok':True, 'message':'Admin password accepted.'}

@app.post('/api/admin/upload')
async def upload_image(file: UploadFile = File(...), x_admin_password: Optional[str] = Header(default=None)):
    require_admin(x_admin_password)
    allowed = {'.png','.jpg','.jpeg','.webp'}
    ext = Path(file.filename or '').suffix.lower()
    if ext not in allowed: raise HTTPException(status_code=400, detail='Use PNG, JPG, JPEG or WebP images.')
    content_type = (file.content_type or '').lower()
    if not content_type.startswith('image/'): raise HTTPException(status_code=400, detail='The uploaded file must be an image.')
    data = await file.read()
    if not data or len(data) > 8 * 1024 * 1024: raise HTTPException(status_code=400, detail='Image must be under 8 MB.')
    filename = f'{uuid.uuid4().hex}{ext}'
    (UPLOAD_DIR / filename).write_bytes(data)
    return {'url':f'/uploads/{filename}', 'filename':filename}

@app.post('/api/admin/products')
def create_product(product: dict, x_admin_password: Optional[str] = Header(default=None)):
    require_admin(x_admin_password)
    products = read_products()
    clean = validate_product(product)
    clean['id'] = max([int(p.get('id',0)) for p in products] + [0]) + 1
    products.append(clean); save_products(products)
    return clean

@app.put('/api/admin/products/{product_id}')
def update_product(product_id: int, product: dict, x_admin_password: Optional[str] = Header(default=None)):
    require_admin(x_admin_password)
    products = read_products()
    for index, old in enumerate(products):
        if int(old.get('id',-1)) == product_id:
            clean = validate_product(product); clean['id'] = product_id
            products[index] = clean; save_products(products); return clean
    raise HTTPException(status_code=404, detail='Product not found.')

@app.delete('/api/admin/products/{product_id}')
def delete_product(product_id: int, x_admin_password: Optional[str] = Header(default=None)):
    require_admin(x_admin_password)
    products = read_products(); updated = [p for p in products if int(p.get('id',-1)) != product_id]
    if len(updated) == len(products): raise HTTPException(status_code=404, detail='Product not found.')
    save_products(updated); return {'ok':True, 'deleted_id':product_id}

def validate_product(product):
    name = str(product.get('name','')).strip()
    try: price = int(float(product.get('price',0)))
    except (TypeError, ValueError): price = 0
    category = str(product.get('category','Everyday')).strip()
    description = str(product.get('description','')).strip()
    image = str(product.get('image','')).strip()
    images = product.get('images') if isinstance(product.get('images'), list) else []
    images = [str(i).strip() for i in images if str(i).strip()]
    if image and image not in images: images.insert(0, image)
    if images and not image: image = images[0]
    sizes = product.get('sizes', [6,7,8,9,10,11])
    try: sizes = sorted(set(int(s) for s in sizes if 4 <= int(s) <= 15))
    except (TypeError, ValueError): sizes = [6,7,8,9,10,11]
    if not name: raise HTTPException(status_code=400, detail='Product name is required.')
    if price < 1 or price > 10000000: raise HTTPException(status_code=400, detail='Enter a valid price.')
    if not image: raise HTTPException(status_code=400, detail='Upload at least one product image.')
    if not sizes: raise HTTPException(status_code=400, detail='Select at least one size.')
    tone = str(product.get('tone','stone'))
    if tone not in {'stone','sage','sand','mist'}: tone = 'stone'
    return {'name':name,'price':price,'category':category,'tag':str(product.get('tag') or category.upper()).strip(), 'image':image,'images':images,'alt':str(product.get('alt') or name),'tone':tone,'description':description,'sizes':sizes,'stock':{str(s):max(0,int((product.get('stock') or {}).get(str(s),0) or 0)) for s in sizes},'featured':bool(product.get('featured',False))}
