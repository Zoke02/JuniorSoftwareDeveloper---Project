import PageHTML from './page-shopcart.html';

export default class PageShopCart {
	#args = null;
	#cart = [];
	#shopCartItemsTarget = null;
	#shopCardItemCount = null;
	#shopcartItemsPrice = null;
	#shopcartShippingPriceInDB = 15;
	#shopcartTaxesPriceInDB = 1.19;
	#shopcartTotalPrice = null;
	#quantities = {};

	constructor(args) {
		this.#args = args;
		args.target.innerHTML = PageHTML;

		this.#shopCartItemsTarget = document.querySelector(
			'#shopCartItemsTarget'
		);
		this.#shopCardItemCount = document.getElementById('shopCardItemCount');
		this.#shopcartItemsPrice =
			document.getElementById('shopcartItemsPrice');
		this.#shopcartTotalPrice =
			document.getElementById('shopcartTotalPrice');

		const stored = localStorage.getItem('shopcart');
		if (stored) {
			try {
				this.#cart = JSON.parse(stored);
			} catch (e) {
				console.warn('Invalid cart data');
			}
		}

		if (this.#cart.length > 0) {
			this.#fetchCartItems(this.#cart);
		} else {
			this.#shopCartItemsTarget.innerHTML = '<p>Your cart is empty.</p>';
			this.#shopCardItemCount.innerHTML = '0 items';
		}
	}

	#fetchCartItems(stockUids) {
		const query = `/page/product&categorieslist/Paginated?stockUids=${stockUids.join(
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
		let itemCount = 0;
		let totalPrice = 0;

		for (const item of items) {
			const file = item.files?.[0];
			const stock = item.stocks?.[0];
			if (!stock) continue;

			const quantity = this.#quantities[stock.stockUid] ?? 1;
			this.#quantities[stock.stockUid] = quantity;

			const imageSrc = file
				? `data:image/${file.fileType};base64,${file.fileBase64}`
				: './../../src/images/Logo (DarkMode).svg';

			itemCount += 1;
			totalPrice += stock.price * quantity;

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
				<div class="col-md-3 col-lg-3 col-xl-2 d-flex">
					<button class="btn p-1" onclick="this.nextElementSibling.stepDown();  this.nextElementSibling.dispatchEvent(new Event('change'))"> 
						<i class="bi bi-dash"></i>
					</button>
					<input
						class="form-control form-control-sm cart-qty"
						data-uid="${stock.stockUid}"
						min="1"
						name="quantity"
						value="${quantity}"
						type="number"
						style="min-width: 50px"
					/>
					<button class="btn p-1" onclick="this.previousElementSibling.stepUp();  this.previousElementSibling.dispatchEvent(new Event('change'))">
						<i class="bi bi-plus-lg"></i>
					</button>
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
		this.#shopcartItemsPrice.innerHTML = '€ ' + totalPrice.toFixed(2);
		this.#shopCardItemCount.innerHTML = itemCount ? itemCount : '0 items';

		let finalPrice =
			(totalPrice + this.#shopcartShippingPriceInDB) *
			this.#shopcartTaxesPriceInDB;
		this.#shopcartTotalPrice.innerHTML = '€ ' + finalPrice.toFixed(2);

		this.#setupRemoveHandlers();

		document.querySelectorAll('.cart-qty').forEach((input) => {
			input.addEventListener('change', () => {
				const uid = input.dataset.uid;
				const qty = Math.max(1, parseInt(input.value) || 1); // prevent 0 or NaN
				this.#quantities[uid] = qty;
				this.#recalculateTotals(items);
			});
		});
	}

	#setupRemoveHandlers() {
		document.querySelectorAll('.remove-item').forEach((btn) => {
			btn.addEventListener('click', () => {
				const uid = btn.getAttribute('data-uid');
				this.#removeFromCart(uid);
				this.#shopCardsItemNumber();
			});
		});
	}

	#removeFromCart(uid) {
		this.#cart = this.#cart.filter((id) => id !== uid);
		localStorage.setItem('shopcart', JSON.stringify(this.#cart));

		if (this.#cart.length > 0) {
			this.#fetchCartItems(this.#cart);
		} else {
			this.#shopCartItemsTarget.innerHTML = '<p>Your cart is empty.</p>';
			this.#shopCardItemCount.innerHTML = '0 items';
			this.#shopcartItemsPrice.innerHTML = '0.00';
			this.#shopcartTotalPrice.innerHTML = '';
			this.#shopCardsItemNumber();
		}
	}

	#shopCardsItemNumber() {
		const shopCardsItemNumber = document.querySelector(
			'#shopCardsItemNumber'
		);
		const cartRaw = localStorage.getItem('shopcart');
		const cartItems = cartRaw ? JSON.parse(cartRaw) : [];

		shopCardsItemNumber.innerHTML =
			cartItems.length > 0 ? cartItems.length : '';
		console.log('Shopcart contains', cartItems.length, 'item(s)');
	}

	#recalculateTotals(items) {
		let itemTotal = 0;

		for (const item of items) {
			const stock = item.stocks?.[0];
			if (!stock) continue;

			const qty = this.#quantities[stock.stockUid] ?? 1;
			itemTotal += stock.price * qty;
		}

		const finalTotal =
			(itemTotal + this.#shopcartShippingPriceInDB) *
			this.#shopcartTaxesPriceInDB;

		this.#shopcartItemsPrice.innerHTML = '€ ' + itemTotal.toFixed(2);
		this.#shopcartTotalPrice.innerHTML = '€ ' + finalTotal.toFixed(2);
	}
}
