(() => {
  'use strict'

  const products = [
    { id: 'sporting-rifle', name: 'Sporting rifle', category: 'Firearms', kind: 'regulated', maker: 'Ask our team', description: 'A sporting firearm listing placeholder. Contact our licensed-dealer team for current specifications, availability, and the lawful transfer process.', image: 'photo-1472396961693-142e6e269027', alt: 'South African sporting landscape, catalogue image placeholder', stock: 'Enquiry only', featured: true, specs: [['Category', 'Sporting rifle'], ['Manufacturer', 'Confirm with dealer'], ['Availability', 'Confirm with dealer']] },
    { id: 'sporting-shotgun', name: 'Sporting shotgun', category: 'Firearms', kind: 'regulated', maker: 'Ask our team', description: 'A sporting firearm listing placeholder. Final selection, eligibility, licensing, stock, and transfer arrangements must be confirmed directly with our licensed dealer.', image: 'photo-1500530855697-b586d89ba3ee', alt: 'Open landscape, catalogue image placeholder', stock: 'Enquiry only', featured: true, specs: [['Category', 'Sporting shotgun'], ['Manufacturer', 'Confirm with dealer'], ['Availability', 'Confirm with dealer']] },
    { id: 'sporting-handgun', name: 'Sporting handgun', category: 'Firearms', kind: 'regulated', maker: 'Ask our team', description: 'A sporting firearm listing placeholder. We do not accept online orders for firearms; all enquiries are reviewed by a licensed dealer before any next steps.', image: 'photo-1470770841072-f978cf4d019e', alt: 'Mountain landscape, catalogue image placeholder', stock: 'Enquiry only', featured: false, specs: [['Category', 'Sporting handgun'], ['Manufacturer', 'Confirm with dealer'], ['Availability', 'Confirm with dealer']] },
    { id: 'secure-storage', name: 'Secure storage cabinet', category: 'Storage', kind: 'accessory', maker: 'Field & Foundry', description: 'A lockable steel storage cabinet for responsible, secure storage. Confirm dimensions and fit with our team before ordering.', image: 'photo-1517649763962-0c623066013b', alt: 'Secure storage product placeholder', stock: 'Availability to confirm', price: 6499, featured: true, specs: [['Category', 'Secure storage'], ['Manufacturer', 'Field & Foundry'], ['Availability', 'Confirm before order']] },
    { id: 'hearing-protection', name: 'Range hearing protection', category: 'Safety', kind: 'accessory', maker: 'Field & Foundry', description: 'Reusable hearing protection for range and workshop use. Always follow the product instructions and range safety rules.', image: 'photo-1505740420928-5e560c06d30e', alt: 'Hearing protection product placeholder', stock: 'Availability to confirm', price: 899, featured: true, specs: [['Category', 'Safety equipment'], ['Manufacturer', 'Field & Foundry'], ['Availability', 'Confirm before order']] },
    { id: 'protective-case', name: 'Protective equipment case', category: 'Accessories', kind: 'accessory', maker: 'Field & Foundry', description: 'A protective carry case for lawful sporting equipment. Check size and transport requirements with the retailer before purchase.', image: 'photo-1584917865442-de89df76afd3', alt: 'Protective case product placeholder', stock: 'Availability to confirm', price: 1299, featured: false, specs: [['Category', 'Equipment case'], ['Manufacturer', 'Field & Foundry'], ['Availability', 'Confirm before order']] },
    { id: 'eye-protection', name: 'Impact-rated eye protection', category: 'Safety', kind: 'accessory', maker: 'Field & Foundry', description: 'Protective eyewear for range use. Confirm the rating is suitable for your activity and follow the manufacturer instructions.', image: 'photo-1511499767150-a48a237f0083', alt: 'Protective eyewear product placeholder', stock: 'Availability to confirm', price: 549, featured: false, specs: [['Category', 'Safety equipment'], ['Manufacturer', 'Field & Foundry'], ['Availability', 'Confirm before order']] },
    { id: 'safe-lock', name: 'Approved storage lock', category: 'Storage', kind: 'accessory', maker: 'Field & Foundry', description: 'A storage accessory for responsible ownership. Ask the dealer to confirm suitability for your storage setup and current legal requirements.', image: 'photo-1558008258-3256797b43f3', alt: 'Secure storage accessory placeholder', stock: 'Availability to confirm', price: 399, featured: false, specs: [['Category', 'Storage accessory'], ['Manufacturer', 'Field & Foundry'], ['Availability', 'Confirm before order']] },
  ]
  const money = value => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(value)
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
  const image = (id, width = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`
  const page = document.body.dataset.page
  const main = document.getElementById('page-content')
  const header = document.getElementById('site-header')
  const footer = document.getElementById('site-footer')
  const notice = document.getElementById('site-notice')
  const getCart = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cm-cart') || '[]')
      if (!Array.isArray(cart)) throw new TypeError('Saved cart must be an array.')
      return cart.filter(item => item && typeof item.id === 'string' && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 10 && products.some(product => product.id === item.id && product.kind === 'accessory'))
    } catch (error) {
      console.warn('Could not read the saved cart.', error)
      return []
    }
  }
  const getWishlist = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('cm-wishlist') || '[]')
      return Array.isArray(saved) ? saved.filter(id => products.some(product => product.id === id)) : []
    } catch (error) {
      console.warn('Could not read the saved wishlist.', error)
      return []
    }
  }
  const cartCount = () => getCart().reduce((total, item) => total + item.quantity, 0)
  const subtotal = cart => cart.reduce((total, item) => total + products.find(product => product.id === item.id).price * item.quantity, 0)
  function toast(message) {
    notice.textContent = message
    notice.hidden = false
    window.setTimeout(() => { notice.hidden = true }, 4000)
  }
  const eyebrow = text => `<p class="eyebrow">${text}</p>`
  const btnLink = (href, text, light = false) => `<a class="button${light ? ' button-light' : ''}" href="${href}">${text} <span aria-hidden="true">↗</span></a>`
  const card = product => `<article class="product-card"><a class="product-photo" href="product.html?id=${encodeURIComponent(product.id)}"><img src="${image(product.image, 680)}" alt="${escapeHtml(product.alt)}" loading="lazy"><span class="product-type">${product.kind === 'regulated' ? 'ENQUIRY ONLY' : escapeHtml(product.category.toUpperCase())}</span></a><div class="product-info"><div><p class="product-category">${escapeHtml(product.category)} · ${escapeHtml(product.maker)}</p><h3><a href="product.html?id=${encodeURIComponent(product.id)}">${escapeHtml(product.name)}</a></h3><p class="product-stock">${escapeHtml(product.stock)}</p></div>${product.kind === 'accessory' ? `<strong>${money(product.price)}</strong>` : '<strong class="enquiry-price">Ask us</strong>'}</div><div class="card-actions"><a href="product.html?id=${encodeURIComponent(product.id)}" class="text-link">${product.kind === 'regulated' ? 'Product enquiry' : 'View details'} <span aria-hidden="true">→</span></a><button type="button" class="wish-button" data-wish="${product.id}" aria-pressed="${getWishlist().includes(product.id)}" aria-label="Save ${escapeHtml(product.name)}">♡</button></div></article>`
  const productGrid = items => `<div class="product-grid">${items.map(card).join('')}</div>`

  function renderHeader() {
    const links = [['home', 'Home', 'index.html'], ['shop', 'Shop', 'shop.html'], ['about', 'About', 'about.html'], ['contact', 'Contact', 'contact.html']]
    header.innerHTML = `<div class="topline">SOUTH AFRICA · RESPONSIBLE OWNERSHIP · DEALER ENQUIRIES ONLY</div><header class="site-header"><a class="wordmark" href="index.html" aria-label="Cape Meridian Arms home"><span>CM<span class="brand-mark">/</span></span><small>CAPE MERIDIAN ARMS</small></a><button class="menu-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false">☰</button><nav class="main-nav" aria-label="Main navigation">${links.map(([key, label, href]) => `<a href="${href}"${page === key ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav><div class="header-actions"><a href="account.html" aria-label="Account">ACCOUNT</a><a href="cart.html" aria-label="Cart, ${cartCount()} items">BAG <span class="bag-count">${cartCount()}</span></a></div></header>`
    header.querySelector('.menu-toggle').addEventListener('click', event => {
      const expanded = event.currentTarget.getAttribute('aria-expanded') === 'true'
      event.currentTarget.setAttribute('aria-expanded', String(!expanded))
      header.querySelector('.main-nav').classList.toggle('nav-open', !expanded)
    })
  }
  function renderFooter() {
    footer.innerHTML = `<footer class="site-footer"><div class="footer-main"><div><a class="wordmark footer-mark" href="index.html"><span>CM<span class="brand-mark">/</span></span><small>CAPE MERIDIAN ARMS</small></a><p>Responsible sporting goods.<br>Dealer guidance, every step.</p></div><div><h3>EXPLORE</h3><a href="shop.html">Catalogue</a><a href="about.html">About us</a><a href="contact.html">Contact &amp; FAQ</a><a href="account.html">Your account</a></div><div><h3>IMPORTANT</h3><a href="about.html#legal">Legal &amp; licensing</a><a href="contact.html#faq">Frequently asked questions</a><a href="cart.html">Accessories bag</a><a href="admin.html">Staff portal</a></div><div><h3>CONTACT</h3><p>Business details to be supplied by the licensed retailer.</p><a href="mailto:hello@capemeridian.example">hello@capemeridian.example</a><p>South Africa · By appointment</p></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} CAPE MERIDIAN ARMS · DEMONSTRATION STOREFRONT</span><span>AGE DECLARATION IS NOT LICENCE OR ID VERIFICATION.</span></div></footer>`
  }
  function renderHome() {
    main.innerHTML = `<section class="hero"><div class="hero-copy">${eyebrow('CAPE TOWN · SOUTH AFRICA')}<h1>Equipped with<br><em>responsibility.</em></h1><p>A considered sporting and safety catalogue, supported by a licensed-dealer enquiry process. Every regulated product requires independent eligibility and licence checks.</p><div class="hero-actions">${btnLink('shop.html', 'Explore catalogue', true)}<a class="text-link hero-link" href="about.html">Our standards <span>→</span></a></div><p class="hero-legal">21+ only · Dealer verification required · No firearm checkout</p></div><div class="hero-image" role="img" aria-label="Mountain landscape in the Western Cape"></div></section><section class="trust-strip"><span>01 / RESPONSIBLE OWNERSHIP</span><span>02 / LICENSED-DEALER REVIEW</span><span>03 / SECURE STORAGE FIRST</span></section><section class="section-shell"><div class="section-heading">${eyebrow('CURATED CATALOGUE')}<h2>Explore the collection<span>.</span></h2><a href="shop.html" class="text-link">View all products →</a></div>${productGrid(products.filter(item => item.featured))}</section><section class="section-shell latest-section"><div class="section-heading">${eyebrow('RECENTLY ADDED')}<h2>New to the catalogue<span>.</span></h2></div>${productGrid(products.slice(-4).reverse())}</section><section class="brand-strip"><p class="eyebrow">MANUFACTURERS &amp; BRANDS</p><p>Supplier and manufacturer names are confirmed listing by listing. Verified brand showcase to be supplied by the licensed retailer.</p><a href="contact.html" class="text-link">Ask about a manufacturer →</a></section><section class="category-band"><div><span class="category-number">01</span><h2>Sporting<br>firearms</h2><p>Enquiry-led listings. Availability and any lawful next step are confirmed by our licensed-dealer team.</p><a href="shop.html?category=Firearms" class="text-link">Browse enquiries →</a></div><div><span class="category-number">02</span><h2>Safety &amp;<br>storage</h2><p>Practical lawful accessories to support safer handling, transport, and secure storage.</p><a href="shop.html?category=Safety" class="text-link">Shop accessories →</a></div><div class="category-art" role="img" aria-label="Western Cape mountain landscape"></div></section><section class="standards-band"><div>${eyebrow('THE STANDARD IS SAFETY')}<h2>No shortcuts.<br>Just responsible ownership.</h2><p>Firearm listings are for enquiry only. We do not take firearm orders or payments online. A licensed dealer must independently verify age, identity, eligibility, licence status, stock, and applicable transfer requirements before any transaction proceeds.</p>${btnLink('about.html', 'Our approach')}</div></section><section class="section-shell"><div class="support-panel"><div>${eyebrow('HERE WHEN YOU NEED US')}<h2>Clear answers.<br>Dealer guidance.</h2><p>Ask about product availability, licensing steps, secure storage, or lawful accessory orders.</p><a href="contact.html" class="text-link">Contact our team →</a></div><form class="newsletter-form"><h3>NOTES FROM THE SHOP</h3><p>Occasional updates on safety, service, and catalogue additions.</p><label for="newsletter-email">Email address</label><input id="newsletter-email" type="email" name="email" autocomplete="email" required><button class="button" type="submit">Subscribe →</button><small>Demo form: subscriptions are not transmitted or stored.</small></form></div></section>`
  }
  function renderShop() {
    const params = new URLSearchParams(location.search)
    const categories = ['All products', 'Firearms', 'Safety', 'Storage', 'Accessories']
    const initial = categories.includes(params.get('category')) ? params.get('category') : 'All products'
    main.innerHTML = `<section class="page-intro">${eyebrow('THE CATALOGUE')}<h1>Considered equipment<span>.</span></h1><p>Regulated items are enquiry only. Accessories are listed separately and remain subject to availability and applicable law.</p></section><section class="shop-section"><div class="shop-controls"><label class="search-box">Search <input type="search" id="shop-search" value="${escapeHtml(params.get('search') || '')}" placeholder="Search catalogue"></label><label>Sort by <select id="shop-sort"><option value="newest">Newest</option><option value="name">Name</option><option value="price">Price: low to high</option></select></label></div><div class="filter-row" aria-label="Filter catalogue">${categories.map(category => `<button class="filter-chip${category === initial ? ' selected' : ''}" type="button" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join('')}</div><p class="result-count" aria-live="polite"></p><div id="shop-products"></div><button class="button load-more" type="button" hidden>Load more</button></section>`
    let category = initial
    let visible = 6
    const draw = () => {
      const search = main.querySelector('#shop-search').value.toLowerCase().trim()
      const sort = main.querySelector('#shop-sort').value
      let matches = products.filter(item => (category === 'All products' || item.category === category) && `${item.name} ${item.category} ${item.description}`.toLowerCase().includes(search))
      if (sort === 'name') matches.sort((a, b) => a.name.localeCompare(b.name))
      if (sort === 'price') matches.sort((a, b) => (a.price || Infinity) - (b.price || Infinity))
      if (sort === 'newest') matches = [...matches].sort((a, b) => Number(b.featured) - Number(a.featured))
      main.querySelector('.result-count').textContent = `${matches.length} listing${matches.length === 1 ? '' : 's'}`
      main.querySelector('#shop-products').innerHTML = matches.length ? productGrid(matches.slice(0, visible)) : '<p class="empty-state">No listings match those filters.</p>'
      const more = main.querySelector('.load-more')
      more.hidden = visible >= matches.length
      wireWishlist(main)
    }
    main.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => {
      category = button.dataset.category
      visible = 6
      main.querySelectorAll('[data-category]').forEach(item => item.classList.toggle('selected', item === button))
      draw()
    }))
    main.querySelector('#shop-search').addEventListener('input', () => { visible = 6; draw() })
    main.querySelector('#shop-sort').addEventListener('change', draw)
    main.querySelector('.load-more').addEventListener('click', () => { visible += 6; draw() })
    draw()
  }
  function wireWishlist(root = main) {
    if (root.dataset.wishlistWired) return
    root.dataset.wishlistWired = 'true'
    root.addEventListener('click', event => {
      const button = event.target.closest('[data-wish]')
      if (!button || !root.contains(button)) return
      const list = getWishlist()
      const id = button.dataset.wish
      const next = list.includes(id) ? list.filter(item => item !== id) : [...list, id]
      try { localStorage.setItem('cm-wishlist', JSON.stringify(next)) } catch (error) {
        console.error('Could not save wishlist.', error)
        toast('Wishlist could not be saved in this browser.')
        return
      }
      button.setAttribute('aria-pressed', String(next.includes(id)))
      toast(next.includes(id) ? 'Saved to your wishlist.' : 'Removed from your wishlist.')
    })
  }
  function renderProduct() {
    const product = products.find(item => item.id === new URLSearchParams(location.search).get('id'))
    if (!product) { main.innerHTML = `<section class="page-intro"><h1>Listing unavailable<span>.</span></h1><a class="text-link" href="shop.html">Return to catalogue →</a></section>`; return }
    main.innerHTML = `<div class="breadcrumbs"><a href="index.html">Home</a> / <a href="shop.html">Catalogue</a> / ${escapeHtml(product.name)}</div><section class="product-detail"><div><div class="detail-image"><img id="main-product-image" src="${image(product.image, 1200)}" alt="${escapeHtml(product.alt)}"></div><div class="gallery-thumbnails"><button type="button" aria-label="Show catalogue image" data-image="${image(product.image, 1200)}"><img src="${image(product.image, 180)}" alt=""></button><button type="button" aria-label="Show alternate catalogue image" data-image="${image('photo-1470770841072-f978cf4d019e', 1200)}"><img src="${image('photo-1470770841072-f978cf4d019e', 180)}" alt=""></button></div></div><div class="product-detail-info">${eyebrow(`${escapeHtml(product.category)} · ${escapeHtml(product.kind === 'regulated' ? 'ENQUIRY ONLY' : 'LAWFUL ACCESSORY')}`)}<h1>${escapeHtml(product.name)}<span>.</span></h1><p class="maker">${escapeHtml(product.maker)}</p><p class="detail-price">${product.kind === 'accessory' ? money(product.price) : 'Price and availability by enquiry'}</p><p>${escapeHtml(product.description)}</p><p class="availability">${escapeHtml(product.stock)}</p><dl class="spec-list">${product.specs.map(([key, value]) => `<div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl>${product.kind === 'regulated' ? `<div class="legal-notice"><strong>Dealer verification required</strong><p>For people aged 21 and over only. An enquiry is not an offer, reservation, sale, or licence approval. A licensed dealer must independently confirm age, identity, eligibility, required licences, stock, and every applicable legal transfer step. No firearm purchase or payment is available through this website.</p></div><form class="enquiry-form"><h2>Ask the dealer</h2><label>Your name<input name="name" autocomplete="name" required maxlength="100"></label><label>Email<input type="email" name="email" autocomplete="email" required maxlength="254"></label><label>Telephone (optional)<input type="tel" name="phone" autocomplete="tel" maxlength="30"></label><label class="checkbox-label"><input type="checkbox" name="age" required> I am 21 years of age or older.</label><label class="checkbox-label"><input type="checkbox" name="understanding" required> I understand that this enquiry does not complete a firearm transaction and that a licensed dealer must conduct all required checks.</label><button class="button" type="submit">Prepare enquiry</button><p class="form-note">Demonstration only: this form does not send or retain your information.</p><p class="form-result" aria-live="polite"></p></form>` : `<div class="accessory-buy"><label>Quantity <input type="number" min="1" max="10" value="1" id="quantity"></label><button type="button" class="button" id="add-to-cart">Add lawful accessory to bag</button><p class="form-note">Availability, delivery, and legal requirements are confirmed before an order is accepted. No payment is taken here.</p></div>`}</div></section><section class="section-shell related-products"><div class="section-heading">${eyebrow('MORE FROM THE CATALOGUE')}<h2>Related listings<span>.</span></h2></div>${productGrid(products.filter(item => item.id !== product.id && item.category === product.category).slice(0, 3))}</section>`
    main.querySelectorAll('[data-image]').forEach(button => button.addEventListener('click', () => { main.querySelector('#main-product-image').src = button.dataset.image }))
    const form = main.querySelector('.enquiry-form')
    if (form) form.addEventListener('submit', event => {
      event.preventDefault()
      form.querySelector('.form-result').textContent = 'Your browser validated the demo form. No information was transmitted; contact the licensed retailer directly to make a real enquiry.'
      form.reset()
    })
    const add = main.querySelector('#add-to-cart')
    if (add) add.addEventListener('click', () => {
      const quantity = Number(main.querySelector('#quantity').value)
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) { toast('Choose a quantity from 1 to 10.'); return }
      const cart = getCart()
      const existing = cart.find(item => item.id === product.id)
      if (existing) existing.quantity = Math.min(10, existing.quantity + quantity)
      else cart.push({ id: product.id, quantity })
      try { localStorage.setItem('cm-cart', JSON.stringify(cart)) } catch (error) {
        console.error('Could not save cart.', error)
        toast('Your bag could not be saved in this browser.')
        return
      }
      renderHeader()
      toast('Accessory added. No order or payment has been made.')
    })
    wireWishlist()
  }
  function renderCart() {
    const cart = getCart()
    if (!cart.length) { main.innerHTML = `<section class="page-intro"><h1>Your bag<span>.</span></h1><p>Your bag is empty. Regulated products cannot be added to the bag.</p><a class="button" href="shop.html">Browse lawful accessories →</a></section>`; return }
    main.innerHTML = `<section class="page-intro">${eyebrow('LAWFUL ACCESSORIES ONLY')}<h1>Your bag<span>.</span></h1></section><section class="cart-layout"><div>${cart.map(item => { const product = products.find(entry => entry.id === item.id); return `<article class="cart-item"><img src="${image(product.image, 180)}" alt="${escapeHtml(product.alt)}"><div><h2>${escapeHtml(product.name)}</h2><p>${money(product.price)} each</p><label>Quantity <input type="number" min="1" max="10" value="${item.quantity}" data-quantity="${item.id}"></label><button class="text-link remove-item" type="button" data-remove="${item.id}">Remove</button></div><strong>${money(product.price * item.quantity)}</strong></article>` }).join('')}</div><aside class="order-summary"><h2>Summary</h2><p>Subtotal <strong>${money(subtotal(cart))}</strong></p><p>Shipping, availability, and any legal requirements are confirmed by the retailer before an order is accepted.</p><p class="summary-total">Estimated subtotal <strong>${money(subtotal(cart))}</strong></p><a class="button" href="checkout.html">Continue to order enquiry →</a><small>No payment is taken online.</small></aside></section>`
    main.querySelectorAll('[data-quantity]').forEach(input => input.addEventListener('change', () => {
      const quantity = Number(input.value)
      const next = getCart().map(item => item.id === input.dataset.quantity ? { ...item, quantity: Number.isInteger(quantity) ? Math.max(1, Math.min(10, quantity)) : 1 } : item)
      localStorage.setItem('cm-cart', JSON.stringify(next))
      renderHeader()
      renderCart()
    }))
    main.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => {
      localStorage.setItem('cm-cart', JSON.stringify(getCart().filter(item => item.id !== button.dataset.remove)))
      renderHeader()
      renderCart()
    }))
  }
  function renderCheckout() {
    const cart = getCart()
    main.innerHTML = cart.length ? `<section class="page-intro">${eyebrow('ACCESSORY ORDER ENQUIRY')}<h1>Review your request<span>.</span></h1><p>This demonstration cannot submit orders or payments. The retailer must confirm stock, shipping, and compliance before accepting any order.</p></section><section class="order-summary checkout-summary"><h2>Accessory summary</h2>${cart.map(item => { const product = products.find(entry => entry.id === item.id); return `<p>${escapeHtml(product.name)} × ${item.quantity}<strong>${money(product.price * item.quantity)}</strong></p>` }).join('')}<p class="summary-total">Subtotal<strong>${money(subtotal(cart))}</strong></p><a class="button" href="contact.html">Contact retailer about availability →</a><a class="text-link" href="cart.html">Return to bag</a></section>` : `<section class="page-intro"><h1>No items to review<span>.</span></h1><a class="button" href="shop.html">Browse accessories →</a></section>`
  }
  function renderAbout() {
    main.innerHTML = `<section class="page-intro about-intro">${eyebrow('ABOUT CAPE MERIDIAN ARMS')}<h1>Good service starts<br>with responsibility<span>.</span></h1><p>We are a demonstration storefront for a South African licensed retailer. Replace this copy with the retailer's verified company history, licence details, and team information before launch.</p></section><section class="values-grid"><article><span>01</span><h2>Compliance first</h2><p>Regulated-product enquiries are handled by licensed staff. No listing or online age declaration replaces an independent legal check.</p></article><article><span>02</span><h2>Responsible ownership</h2><p>We promote safe handling, secure storage, and compliance with current South African law and applicable regulations.</p></article><article><span>03</span><h2>Clear service</h2><p>We aim to explain availability and process plainly. Staff verify each customer's situation before any regulated transaction proceeds.</p></article></section><section class="legal-panel" id="legal"><h2>Legal and licensing notice</h2><p>This website is a catalogue prototype, not legal advice and not a licensed dealer verification system. Firearm enquiries are restricted to people aged 21 or older for this storefront, but age declarations are not age or identity verification. No firearm order, reservation, transfer, or payment can be completed here. A licensed South African dealer must confirm the applicant's eligibility, required competency and licences, and all applicable legal requirements independently. Confirm current requirements with the dealer and relevant South African authorities.</p></section>`
  }
  function renderContact() {
    main.innerHTML = `<section class="page-intro">${eyebrow('CUSTOMER SUPPORT')}<h1>Talk with our team<span>.</span></h1><p>Replace demonstration details with the licensed retailer's verified contact information and operating hours before launch.</p></section><section class="contact-layout"><div class="contact-details"><h2>Contact details</h2><p><strong>Telephone</strong><br><a href="tel:+27215550100">+27 21 555 0100 (demo)</a></p><p><strong>Email</strong><br><a href="mailto:hello@capemeridian.example">hello@capemeridian.example</a></p><p><strong>Address</strong><br>Retailer address to be confirmed<br>Western Cape, South Africa</p><p><strong>Hours</strong><br>By appointment · Verify hours before visiting</p><div class="map-placeholder">MAP PLACEHOLDER<br><small>Add the verified business address and map embed before launch.</small></div></div><form class="contact-form"><h2>Send a message</h2><label>Name<input name="name" autocomplete="name" maxlength="100" required></label><label>Email<input type="email" name="email" autocomplete="email" maxlength="254" required></label><label>Topic<select name="topic"><option>General support</option><option>Accessory availability</option><option>Firearm product enquiry</option><option>Licensing process question</option></select></label><label>Message<textarea name="message" rows="5" maxlength="2000" required></textarea></label><button class="button" type="submit">Prepare message →</button><p class="form-note">Demo form only. Do not include licence, ID, or other sensitive documents. No information is transmitted.</p><p class="form-result" aria-live="polite"></p></form></section><section class="faq-section" id="faq"><h2>Frequently asked questions<span>.</span></h2><details><summary>Can I buy a firearm directly on this website?</summary><p>No. Firearms are enquiry only. A licensed dealer must independently verify all requirements before any transaction.</p></details><details><summary>Who may make a firearm enquiry?</summary><p>This prototype limits firearm enquiries to adults aged 21 and older. This declaration is not age verification or proof of legal eligibility.</p></details><details><summary>Can I pay for accessories online?</summary><p>No payment service is connected. Accessory bag and summary features are a demonstration only; the retailer must confirm stock and lawful fulfilment.</p></details><details><summary>What documents or licences are required?</summary><p>Requirements depend on the person and item. Contact a licensed South African dealer or relevant authority for current guidance. Do not send identity or licence documents through this demo site.</p></details></section>`
    main.querySelector('.contact-form').addEventListener('submit', event => {
      event.preventDefault()
      main.querySelector('.form-result').textContent = 'Your browser validated the demo form. No information was sent; please contact the retailer using verified details.'
      event.currentTarget.reset()
    })
  }
  function renderAccount() {
    main.innerHTML = `<section class="page-intro">${eyebrow('CUSTOMER ACCOUNT')}<h1>Your account<span>.</span></h1><p>Secure registration, login, profile, and enquiry history require a server-side account service. This static prototype does not collect credentials or personal information.</p></section><section class="account-grid"><form class="account-form"><h2>Sign in</h2><label>Email<input type="email" autocomplete="email" required></label><label>Password<input type="password" autocomplete="current-password" required></label><button class="button" type="submit">Sign in</button></form><form class="account-form"><h2>Create account</h2><label>Name<input autocomplete="name" required></label><label>Email<input type="email" autocomplete="email" required></label><label>Password<input type="password" autocomplete="new-password" minlength="12" required></label><button class="button" type="submit">Register</button></form></section><p class="backend-warning">Authentication, account profile, and enquiry/order history are not available until a secure backend is configured. Do not enter real credentials here.</p>`
    main.querySelectorAll('.account-form').forEach(form => form.addEventListener('submit', event => { event.preventDefault(); toast('Sign-in and registration are not connected. Do not enter real credentials.') }))
  }
  function renderAdmin() {
    main.innerHTML = `<section class="restricted-panel">${eyebrow('STAFF ONLY')}<h1>Admin portal<span>.</span></h1><h2>Dashboard unavailable in this static demonstration.</h2><p>A secure staff dashboard must be backed by server-side authentication, role-based authorization, protected image uploads, validated inventory operations, enquiry handling, and durable audit records. A browser-only password check would not protect administrative actions.</p><a class="button" href="index.html">Return to storefront →</a></section>`
  }
  function renderAgeGate() {
    try {
      if (sessionStorage.getItem('cm-age-confirmed') === 'yes') return
    } catch (error) {
      console.warn('Could not read the age-declaration session state.', error)
    }
    const gate = document.createElement('div')
    gate.className = 'age-gate'
    gate.setAttribute('role', 'dialog')
    gate.setAttribute('aria-modal', 'true')
    gate.setAttribute('aria-labelledby', 'age-title')
    gate.innerHTML = `<div class="age-card"><span class="age-emblem">CM/</span><p class="eyebrow">SOUTH AFRICA · AGE-RESTRICTED ENQUIRIES</p><h2 id="age-title">Before you enter</h2><p>This demonstration storefront is intended for people aged 21 and older. Confirming here is a self-declaration only; it does not verify your age, identity, licence, or eligibility.</p><button class="button" type="button" data-age-yes>I am 21 or older — continue</button><button class="text-link" type="button" data-age-no>I am under 21</button><p class="form-note" data-age-message aria-live="polite"></p></div>`
    document.body.append(gate)
    gate.querySelector('[data-age-yes]').addEventListener('click', () => {
      try { sessionStorage.setItem('cm-age-confirmed', 'yes') } catch (error) { console.warn('Could not save the age-declaration session state.', error) }
      gate.remove()
    })
    gate.querySelector('[data-age-no]').addEventListener('click', () => { gate.querySelector('[data-age-message]').textContent = 'Access is not available to anyone under 21. Please leave this site.'; gate.querySelector('[data-age-yes]').disabled = true })
  }
  renderHeader()
  renderFooter()
  const renderers = { home: renderHome, shop: renderShop, product: renderProduct, cart: renderCart, checkout: renderCheckout, about: renderAbout, contact: renderContact, account: renderAccount, admin: renderAdmin }
  ;(renderers[page] || renderHome)()
  renderAgeGate()
  wireWishlist()
  document.querySelectorAll('.newsletter-form').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault()
    toast('Newsletter signup is not connected; no information was transmitted.')
    form.reset()
  }))
})()
