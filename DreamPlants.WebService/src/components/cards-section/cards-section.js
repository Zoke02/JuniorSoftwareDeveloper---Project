import ComponentHTML from './cards-section.html';

export default class CardsSection {
	#args = null;
	#products = [];

	constructor(args) {
		this.#args = args;
		args.target.innerHTML = ComponentHTML;

		// INIT
		this.#fetchLatestProducts('cardsNewAdditions', 'newest');
		this.#fetchLatestProducts('cardsBestSellers', 'asc');

		// EVENTS
		document.addEventListener('click', (e) => {
			if (e.target.classList.contains('addToCart')) {
				const stockUid = e.target.dataset.stockUid;
				if (!stockUid) return;

				// Load existing cart or start new
				const existing = JSON.parse(
					localStorage.getItem('shopcart') || '[]'
				);

				// Prevent duplicates
				if (!existing.includes(stockUid)) {
					existing.push(stockUid);
					localStorage.setItem('shopcart', JSON.stringify(existing));
					console.log('Added to cart:', stockUid); // DEV
				}
				this.#shopCardsItemNumber();
			}
		});
	}

	async #fetchLatestProducts(containerId, sortBy = 'newest') {
		const container = document.querySelector(`#${containerId}`);
		if (!container) return;

		this.#args.app.apiGet(
			(r) => {
				this.#products = r.items || [];
				container.innerHTML = '';
				this.#products.forEach((product) => {
					const card = this.#createProductCard(product);
					container.appendChild(card);
				});
			},
			(err) => {
				console.error('Failed to fetch products:', err);
			},
			`/page/product&categorieslist/Paginated?page=1&pageSize=4&sortBy=${sortBy}`
		);
	}

	#createProductCard(product) {
		const stock = product.stocks[0];
		const file = product.files?.[0];
		const imageUrl = file
			? `data:${file.fileType};base64,${file.fileBase64}`
			: './../../src/images/Artikel - Fotos/01 - Alocasia - Flying Squid.webp'; // fallback if no file

		const div = document.createElement('div');
		div.className = 'col-12 col-sm-6 col-md-4 col-xl-3';

		div.innerHTML = `
		<div class="card text-center text-decoration-none h-100">
			<img src="${imageUrl}" class="card-img-top" alt="${product.name}" />
			<div class="card-body">
				<p class="card-text">${product.name}</p>
				<p class="card-text">${stock.price.toFixed(2)} €</p>
				<i class="bi bi-cart-plus cursor-pointer addToCart" data-stock-uid="${
					stock.stockUid
				}">
					Add to cart
				</i>
			</div>
		</div>
	`;
		return div;
	}

	#shopCardsItemNumber() {
		const shopCardsItemNumber = document.querySelector(
			'#shopCardsItemNumber'
		);
		shopCardsItemNumber.innerHTML = '';

		const cartRaw = localStorage.getItem('shopcart');
		const cartItems = cartRaw ? JSON.parse(cartRaw) : []; // parse to 1 item each

		const itemCount = cartItems.length;

		if (itemCount > 0) {
			shopCardsItemNumber.innerHTML = itemCount;
		} else {
			shopCardsItemNumber.innerHTML = '';
		}
		console.log('Shopcart contains', itemCount, 'item(s)');
	}
}
