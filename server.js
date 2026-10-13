const http = require('http');

const PORT = process.env.PORT || 8080;

// In-memory data stores
const sessions = new Map(); // sessionId -> { email }
const userCarts = new Map(); // email -> Array<string> of productIds

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      cookies[parts[0].trim()] = decodeURIComponent(parts.slice(1).join('=').trim());
    }
  });
  return cookies;
}

function getSession(req) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionId = cookies.sessionId;
  if (sessionId && sessions.has(sessionId)) {
    return { sessionId, ...sessions.get(sessionId) };
  }
  return null;
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;
  const session = getSession(req);

  // Helper: JSON response
  const sendJson = (statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  // Helper: HTML response
  const sendHtml = (html) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  };

  // Helper: Redirect
  const redirect = (targetUrl, setCookieHeader = null) => {
    const headers = { Location: targetUrl };
    if (setCookieHeader) {
      headers['Set-Cookie'] = setCookieHeader;
    }
    res.writeHead(302, headers);
    res.end();
  };

  // API: Add to cart
  if (req.method === 'POST' && pathname === '/api/cart') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      if (!session) {
        return sendJson(401, { error: 'Unauthorized' });
      }
      try {
        const { productId } = JSON.parse(body);
        const email = session.email;
        if (!userCarts.has(email)) {
          userCarts.set(email, []);
        }
        const cart = userCarts.get(email);
        if (!cart.includes(String(productId))) {
          cart.push(String(productId));
        }
        sendJson(200, { success: true, cart });
      } catch (e) {
        sendJson(400, { error: 'Invalid JSON' });
      }
    });
    return;
  }

  // API: Clear cart
  if (req.method === 'POST' && pathname === '/api/cart/clear') {
    if (!session) return sendJson(401, { error: 'Unauthorized' });
    userCarts.set(session.email, []);
    return sendJson(200, { success: true });
  }

  // API: Login POST
  if (req.method === 'POST' && pathname === '/api/login') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { email, password, redirect: redirectTo } = JSON.parse(body);
        const sessionId = 'sess_' + Math.random().toString(36).substring(2) + Date.now();
        sessions.set(sessionId, { email });
        if (!userCarts.has(email)) {
          userCarts.set(email, []);
        }
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Set-Cookie': `sessionId=${sessionId}; Path=/; HttpOnly`
        });
        res.end(JSON.stringify({ success: true, redirect: redirectTo || '/products' }));
      } catch (e) {
        sendJson(400, { error: 'Invalid JSON' });
      }
    });
    return;
  }

  // API: Logout
  if (req.method === 'POST' && pathname === '/api/logout') {
    if (session) {
      sessions.delete(session.sessionId);
    }
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Set-Cookie': 'sessionId=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // --- HTML Pages ---

  // /login page
  if (pathname === '/login' || pathname === '/') {
    const redirectTo = parsedUrl.searchParams.get('redirect') || '';
    sendHtml(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Login - E-Commerce App</title>
  <style>
    body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f4f6f8; }
    .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 320px; }
    h2 { margin-top: 0; }
    .form-group { margin-bottom: 1rem; }
    label { display: block; margin-bottom: 0.25rem; font-size: 0.9rem; }
    input { width: 100%; box-sizing: border-box; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; }
    button { width: 100%; padding: 0.6rem; background: #0066cc; color: white; border: none; border-radius: 4px; font-size: 1rem; cursor: pointer; }
    button:hover { background: #0052a3; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Login</h2>
    <form id="login-form">
      <input type="hidden" id="redirect-input" value="${redirectTo}" />
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" data-testid="login-email" required placeholder="user@example.com" />
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" data-testid="login-password" required placeholder="Password" />
      </div>
      <button type="submit" data-testid="login-submit">Login</button>
    </form>
  </div>
  <script>
    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const redirectTo = document.getElementById('redirect-input').value;
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, redirect: redirectTo })
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = data.redirect;
      }
    });
  </script>
</body>
</html>
    `);
    return;
  }

  // /products page
  if (pathname === '/products') {
    sendHtml(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Products - E-Commerce App</title>
  <style>
    body { font-family: sans-serif; margin: 0; padding: 1.5rem; background: #fafafa; }
    header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 1rem; margin-bottom: 1.5rem; }
    .product-list { display: flex; gap: 1.5rem; flex-wrap: wrap; }
    .product-card { background: white; border: 1px solid #ddd; border-radius: 6px; padding: 1rem; width: 200px; text-align: center; }
    button { padding: 0.5rem 1rem; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; }
    .cart-btn { background: #0066cc; text-decoration: none; padding: 0.5rem 1rem; color: white; border-radius: 4px; }
    .logout-btn { background: #dc3545; }
  </style>
</head>
<body>
  <header>
    <h1>Product Catalog</h1>
    <div>
      <a href="/cart" data-testid="cart-link" class="cart-btn">View Cart</a>
      <button data-testid="logout-button" class="logout-btn" onclick="logout()">Logout</button>
    </div>
  </header>
  <div class="product-list">
    <div class="product-card" data-testid="product-item-1">
      <h3>Laptop</h3>
      <p>$999</p>
      <button data-testid="add-to-cart-1" onclick="addToCart('1')">Add to Cart</button>
    </div>
    <div class="product-card" data-testid="product-item-2">
      <h3>Headphones</h3>
      <p>$199</p>
      <button data-testid="add-to-cart-2" onclick="addToCart('2')">Add to Cart</button>
    </div>
    <div class="product-card" data-testid="product-item-3">
      <h3>Keyboard</h3>
      <p>$89</p>
      <button data-testid="add-to-cart-3" onclick="addToCart('3')">Add to Cart</button>
    </div>
  </div>
  <script>
    async function addToCart(productId) {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });
    }
    async function logout() {
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = '/login';
    }
  </script>
</body>
</html>
    `);
    return;
  }

  // /cart page
  if (pathname === '/cart') {
    const userCart = session ? (userCarts.get(session.email) || []) : [];
    const hasItems = userCart.length > 0;

    let itemsHtml = '';
    userCart.forEach(id => {
      itemsHtml += `<div class="cart-item" data-testid="cart-item-${id}">Product ${id} in Cart</div>`;
    });

    sendHtml(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Your Cart - E-Commerce App</title>
  <style>
    body { font-family: sans-serif; margin: 0; padding: 1.5rem; background: #fafafa; }
    .cart-container { max-width: 600px; margin: 0 auto; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .cart-item { padding: 0.75rem; border-bottom: 1px solid #eee; margin-bottom: 0.5rem; }
    .error-msg { color: #dc3545; background: #f8d7da; border: 1px solid #f5c6cb; padding: 0.75rem; border-radius: 4px; margin-top: 1rem; }
    button { padding: 0.6rem 1.2rem; background: #0066cc; color: white; border: none; border-radius: 4px; font-size: 1rem; cursor: pointer; }
  </style>
</head>
<body>
  <div class="cart-container">
    <h2>Shopping Cart</h2>
    <div id="cart-items-container">
      ${itemsHtml}
    </div>
    <div id="empty-msg" data-testid="cart-empty-message" class="error-msg" style="${hasItems ? 'display: none;' : ''}">
      Your cart is empty. Please add items before checking out.
    </div>
    <div style="margin-top: 1.5rem;">
      <button data-testid="checkout-button" onclick="handleCheckout()">Proceed to Checkout</button>
    </div>
  </div>
  <script>
    const hasItems = ${hasItems};
    function handleCheckout() {
      if (!hasItems) {
        document.getElementById('empty-msg').style.display = 'block';
        return;
      }
      window.location.href = '/checkout';
    }
  </script>
</body>
</html>
    `);
    return;
  }

  // /checkout page (Protected!)
  if (pathname === '/checkout') {
    if (!session) {
      // Protected route: Redirect to login with redirect back to /cart
      return redirect('/login?redirect=/cart');
    }

    sendHtml(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Checkout - E-Commerce App</title>
  <style>
    body { font-family: sans-serif; margin: 0; padding: 2rem; background: #f4f6f8; display: flex; justify-content: center; }
    .checkout-card { background: white; padding: 2rem; border-radius: 8px; width: 400px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .form-group { margin-bottom: 1rem; }
    label { display: block; margin-bottom: 0.25rem; font-size: 0.9rem; }
    input { width: 100%; box-sizing: border-box; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; }
    button { width: 100%; padding: 0.75rem; background: #28a745; color: white; border: none; border-radius: 4px; font-size: 1rem; cursor: pointer; }
  </style>
</head>
<body>
  <div class="checkout-card">
    <h2>Checkout</h2>
    <form id="checkout-form">
      <div class="form-group">
        <label for="shipping">Shipping Address</label>
        <input type="text" id="shipping" data-testid="shipping-address" required placeholder="123 Main St, Springfield" />
      </div>
      <div class="form-group">
        <label for="payment">Payment Info</label>
        <input type="text" id="payment" data-testid="payment-info" required placeholder="4111-XXXX-XXXX-1111" />
      </div>
      <button type="submit" data-testid="confirm-purchase-button">Confirm Purchase</button>
    </form>
  </div>
  <script>
    document.getElementById('checkout-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await fetch('/api/cart/clear', { method: 'POST' });
      window.location.href = '/confirmation';
    });
  </script>
</body>
</html>
    `);
    return;
  }

  // /confirmation page
  if (pathname === '/confirmation') {
    sendHtml(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Order Confirmation - E-Commerce App</title>
  <style>
    body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f4f6f8; }
    .card { background: white; padding: 2.5rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
    .success-msg { color: #28a745; font-size: 1.25rem; font-weight: bold; margin-bottom: 1rem; }
    a { color: #0066cc; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Order Placed!</h2>
    <div class="success-msg" data-testid="order-confirmation-message">
      Thank you for your purchase! Your order has been placed successfully.
    </div>
    <a href="/products">Continue Shopping</a>
  </div>
</body>
</html>
    `);
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`Mock E-Commerce Server listening on http://localhost:${PORT}`);
});
