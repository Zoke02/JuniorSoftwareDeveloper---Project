import PageHTML from './page-shopcart.html';

export default class PageShopCart {
	#args = null;
	#cart = [];
	#shopCartItemsTarget = null;
	#shopCardItemCount = null;
	#shopcartItemsPrice = null;
	#shopcartTotalPrice = null;
	#quantities = {};

	constructor(args) {
		this.#args = args;
		args.target.innerHTML = PageHTML;
		// console.log(this.#args.app.user); // DEV

		if (!this.#args.app.user) {
			this.#insertSummaryForGuest('shopCartSummaryTarget');
		} else {
			this.#insertSummaryForUser('shopCartSummaryTarget');
		}

		this.#shopCartItemsTarget = document.querySelector(
			'#shopCartItemsTarget'
		);
		this.#shopCardItemCount = document.getElementById('shopCardItemCount');

		const rawCart = localStorage.getItem('shopcart');
		try {
			const cartObj = JSON.parse(rawCart) || {};
			this.#cart = Object.keys(cartObj); // extract stockUids as array
			this.#quantities = cartObj;
		} catch (e) {
			console.warn('Invalid cart data');
			this.#cart = [];
			this.#quantities = {};
		}

		if (this.#cart.length > 0) {
			this.#fetchCartItems(this.#cart);
		} else {
			this.#shopCartItemsTarget.innerHTML = '<p>Your cart is empty.</p>';
			this.#shopCardItemCount.innerHTML = '0 items';
		}

		// DEV
		this.#updateShopCartTotalQuantity('shopCardItemCount');
		this.#updateShopCartTotalQuantity('shopCardsItemNumber');
	} // COnstructor

	#fetchCartItems() {
		const cartRaw = localStorage.getItem('shopcart');
		if (!cartRaw) {
			console.warn('No items in cart');
			return;
		}

		let stockUidList;
		try {
			const cartObj = JSON.parse(cartRaw);
			stockUidList = Object.keys(cartObj); // Get only stockUids
		} catch (e) {
			console.warn('Invalid cart data');
			return;
		}

		if (stockUidList.length === 0) return;

		const query = `/page/product&categorieslist/Paginated?stockUids=${stockUidList.join(
			','
		)}&pageSize=100`;

		this.#args.app.apiGet(
			(r) => {
				console.log(r.items);
				this.#renderCartItems(r.items);
			},
			(err) => console.error('Failed to fetch cart items', err),
			query
		);
	}

	#renderCartItems(items) {
		this.#shopCartItemsTarget.innerHTML = '';
		let html = '';

		// Load quantities from localStorage
		const storedQuantities = this.#getStoredQuantities();

		for (const item of items) {
			const file = item.files?.[0];
			const stock = item.stocks?.[0];
			if (!stock) continue;

			// Use stored quantity or default to 1
			const quantity = parseInt(storedQuantities[stock.stockUid]) || 1;
			this.#quantities[stock.stockUid] = quantity;

			const imageSrc = file
				? `data:image/${file.fileType};base64,${file.fileBase64}`
				: './../../src/images/Logo (DarkMode).svg';

			const stockMessage =
				stock.quantity === 0
					? '<div class="text-center text-danger small mt-2">Out of stock: DELIVERY DATE DELAY</div>'
					: stock.quantity < 5
					? '<div class="text-center text-warning small mt-2">Limited stock AVAILABLE</div>'
					: '';

			html += `
			<div class="row mb-4 d-flex justify-content-between align-items-center">
				<hr class="my-4" />
				<div class="col-md-2 col-lg-2 col-xl-2">
					<img
						src="${imageSrc}"
						class="img-fluid"
						alt="${item.name}"
						style="border: 1px solid var(--gold)"
					/>
				</div>
				<div class="col-md-3 col-lg-3 col-xl-3">
					<h6 class="text-muted">${item.categoryName || 'Category'}</h6>
					<h6 class="mb-0">${item.name}</h6>
				</div>
				<div class="col" >
					<div class="col-md-3 col-lg-3 col-xl-2 d-flex">
						<button class="btn p-1" onclick="this.nextElementSibling.stepDown();  this.nextElementSibling.dispatchEvent(new Event('change'))"> 
							<i class="bi bi-dash"></i>
						</button>
						<input
							class="form-control form-control-sm cart-qty"
							data-uid="${stock.stockUid}"
							min="1"
							max="10"
							name="quantity"
							value="${quantity}"
							type="number"
							style="min-width: 50px"
						/>
						<button class="btn p-1" onclick="this.previousElementSibling.stepUp();  this.previousElementSibling.dispatchEvent(new Event('change'))">
							<i class="bi bi-plus-lg"></i>
						</button>
					</div>
					${stockMessage}
				</div>
				<div class="col-md-3 col-lg-2 col-xl-2 offset-lg-1">
					<h6 class="mb-0">€ ${stock.price.toFixed(2)}</h6>
				</div>
				<div class="col-md-1 col-lg-1 col-xl-1 text-end">
					<div class="text-muted remove-item" data-uid="${stock.stockUid}">
						<i class="bi bi-x-lg" style="font-size: 1.4rem"></i>
					</div>
				</div>
			</div>
			`;
		}
		this.#shopCartItemsTarget.innerHTML = html;
		this.#setupRemoveHandlers();

		// Update Numbers.

		// NEW!
		document.querySelectorAll('.cart-qty').forEach((input) => {
			input.addEventListener('change', () => {
				const uid = input.dataset.uid;
				const qty = Math.max(1, parseInt(input.value) || 1); // prevent 0 or NaN

				this.#quantities[uid] = qty;

				// localStorage
				const raw = localStorage.getItem('shopcart');
				if (raw) {
					try {
						const parsed = JSON.parse(raw);
						parsed[uid] = qty;
						localStorage.setItem(
							'shopcart',
							JSON.stringify(parsed)
						);
					} catch (e) {
						console.warn('Invalid shopcart JSON');
					}
				}
				this.#updateShopCartTotalQuantity('shopCardItemCount');
				this.#updateShopCartTotalQuantity('shopCardsItemNumber');
			});
		});
	}

	#setupRemoveHandlers() {
		document.querySelectorAll('.remove-item').forEach((btn) => {
			btn.addEventListener('click', () => {
				const uid = btn.getAttribute('data-uid');
				this.#removeFromCart(uid);
			});
		});
	}

	#removeFromCart(uid) {
		delete this.#quantities[uid];
		localStorage.setItem('shopcart', JSON.stringify(this.#quantities));
		this.#cart = Object.keys(this.#quantities);

		if (this.#cart.length > 0) {
			this.#fetchCartItems(this.#cart);
		} else {
			if (this.#shopCartItemsTarget) {
				this.#shopCartItemsTarget.innerHTML =
					'<p>Your cart is empty.</p>';
			}
			if (this.#shopCardItemCount) {
				this.#shopCardItemCount.innerHTML = '0';
			}
			if (this.#shopcartItemsPrice) {
				this.#shopcartItemsPrice.innerHTML = '0.00';
			}
			if (this.#shopcartTotalPrice) {
				this.#shopcartTotalPrice.innerHTML = '0.00';
			}
		}

		// update the count in header/cart icon if applicable
		this.#updateShopCartTotalQuantity('shopCardsItemNumber');
		this.#updateShopCartTotalQuantity('shopCardItemCount');
	}

	// FINISHED
	#updateShopCartTotalQuantity(targetId = null) {
		const raw = localStorage.getItem('shopcart');
		let totalQuantity = 0;

		if (raw) {
			try {
				const quantities = JSON.parse(raw);
				for (const qty of Object.values(quantities)) {
					if (typeof qty === 'number' && qty > 0) {
						totalQuantity += qty;
					}
				}
			} catch (e) {
				console.warn('Invalid shopcart JSON');
			}
		}

		// Optional DOM update
		if (targetId) {
			const el = document.getElementById(targetId);
			if (el) el.innerHTML = totalQuantity > 0 ? totalQuantity : '';
		}

		return totalQuantity;
	}

	#insertSummaryForGuest(target) {
		const inserInto = document.getElementById(target);
		inserInto.innerHTML += `
		<div class="p-5">
			<h3 class="fw-bold mb-1 mt-2 pt-1">
				Summary
			</h3>
			<h5 class="fw-bold mb-1 mt-1 pt-1">
				Prices
			</h5>
			<hr class="my-4" />
			<div
				class="d-flex justify-content-between mb-2"
			>
				<h6 class="text-uppercase">
					Cart Items
				</h6>
				<h5 id="shopcartItemsPrice">0.00</h5>
			</div>
			<div
				class="d-flex justify-content-between mb-2"
			>
				<h6 class="text-uppercase">
					STD Shipping
				</h6>
				<h5 id="shopcartShippingPrice">
					€ 15.00
				</h5>
			</div>
			<div
				class="d-flex justify-content-between mb-4"
			>
				<h6 class="text-uppercase">Taxes</h6>
				<h5 id="shopcartTaxesPrice">+ 19%</h5>
			</div>

			<hr class="my-4" />

			<div
				class="d-flex justify-content-between mb-5"
			>
				<h5 class="text-uppercase">
					Total price
				</h5>
				<h5 id="shopcartTotalPrice"></h5>
			</div>

		<a
			href="#login"
			type="button"
			data-mdb-button-init
			data-mdb-ripple-init
			class="btn btn-dark btn-block btn-lg"
			data-mdb-ripple-color="dark"
		>
			Register
			</a>
			</div>
			`;
	}

	#insertSummaryForUser(target) {
		const inserInto = document.getElementById(target);
		inserInto.innerHTML += `
		<div class="p-5">
				<h3 class="fw-bold mb-1 mt-2 pt-1">
				Summary
			</h3>
			<h5 class="fw-bold mb-1 mt-1 pt-1">
				Prices
			</h5>
			<hr class="my-4" />
			<div
				class="d-flex justify-content-between mb-2"
			>
				<h6 class="text-uppercase">
					Cart Items
				</h6>
				<h5 id="shopcartItemsPrice">0.00</h5>
			</div>
			<div
				class="d-flex justify-content-between mb-2"
			>
				<h6 class="text-uppercase">
					STD Shipping
				</h6>
				<h5 id="shopcartShippingPrice">
					€ 15.00
				</h5>
			</div>
			<div
				class="d-flex justify-content-between mb-4"
			>
				<h6 class="text-uppercase">Taxes</h6>
				<h5 id="shopcartTaxesPrice">+ 19%</h5>
			</div>

			<hr class="my-4" />



		<h5 class="text-uppercase mb-3">
			Delivery Adress
		</h5>

		<div class="mb-4 pb-2">
			<select
				id="shopCartAdresses"
				data-mdb-select-init
				class="w-100 mb-3"
			>
			
			</select>
			<a
				href="#user-profile"
				class="text-decoration-none text-body border p-1"
				>Add new adress</a
			>
		</div>

		<h5 class="text-uppercase mb-3">
			Payment method
		</h5>
		<div class="mb-4 pb-2">
			<select
				id="shopCartCreditCards"
				data-mdb-select-init
				class="w-100 mb-3"
			>
				
			</select>
			<a
				href="#user-profile"
				class="text-decoration-none text-body border p-1"
				>Add new payment</a
			>
		</div>

		<hr class="my-4" />

			<div
				class="d-flex justify-content-between mb-5"
			>
				<h5 class="text-uppercase">
					Total price
				</h5>
				<h5 id="shopcartTotalPrice"></h5>
			</div>

		<button
			type="button"
			data-mdb-button-init
			data-mdb-ripple-init
			class="btn btn-dark btn-block btn-lg"
			data-mdb-ripple-color="dark"
		>
			Place Order
		</button>
	</div>
		`;
		this.#loadUserAddresses('shopCartAdresses');
		this.#loadUserCreditCards('shopCartCreditCards');
	}

	#loadUserAddresses(target) {
		const select = document.getElementById(target);
		if (!select) {
			console.warn('#shopCartAdresses not found in DOM');
			return;
		}

		this.#args.app.apiGet(
			(response) => {
				if (!response.success) {
					console.warn('Address fetch failed:', response.message);
					select.innerHTML = `<option value="">No addresses found</option>`;
					return;
				}

				const addresses = response.addressesDTO;
				if (!addresses || addresses.length === 0) {
					select.innerHTML = `<option value="">No saved addresses</option>`;
					return;
				}
				console.log(addresses);
				let optionsHtml = `<option value="">Select your address</option>`;

				for (const a of addresses) {
					optionsHtml += `
					<option value="${a.addressId}">
						${a.street} ${a.houseNr}${a.door ? '/' + a.door : ''}, ${a.city} (${
						a.postalCode
					})
					</option>
				`;
				}

				select.innerHTML = optionsHtml;
			},
			(err) => {
				console.error('Error loading addresses:', err);
				select.innerHTML = `<option value="">Error loading addresses</option>`;
			},
			'/Address/GetAddresses'
		);
	}

	#loadUserCreditCards(target) {
		const select = document.getElementById(target);
		if (!select) {
			console.warn('#shopCartCreditCards not found in DOM');
			return;
		}

		this.#args.app.apiGet(
			(response) => {
				if (!response.success) {
					console.warn('Card fetch failed:', response.message);
					select.innerHTML = `<option value="">No cards found</option>`;
					return;
				}

				const cards = response.creditCardsDTO;
				if (!cards || cards.length === 0) {
					select.innerHTML = `<option value="">No saved cards</option>`;
					return;
				}

				let optionsHtml = `<option value="">Select a card</option>`;

				for (const c of cards) {
					optionsHtml += `
					<option value="${c.cardId}">
						**** **** **** ${c.cardNumberLastDigits}
					</option>
				`;
				}

				select.innerHTML = optionsHtml;
			},
			(err) => {
				console.error('Error loading credit cards:', err);
				select.innerHTML = `<option value="">Error loading cards</option>`;
			},
			'/CreditCards/GetCards'
		);
	}

	// DEV
	#getStoredQuantities() {
		try {
			return JSON.parse(localStorage.getItem('shopcart')) || {};
		} catch {
			console.warn('Invalid shopcart data');
			return {};
		}
	}
}
