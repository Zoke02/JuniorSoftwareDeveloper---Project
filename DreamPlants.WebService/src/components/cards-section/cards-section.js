import ComponentHTML from './cards-section.html';

export default class CardsSection {
	#args = null;
	#products = [];

	constructor(args) {
		this.#args = args;
		args.target.innerHTML = ComponentHTML;

		// INIT
		this.#fetchLatestProducts('cardsNewAdditions', 'newest');
		this.#fetchLatestProducts('cardsBestSellers', 'bestseller');

		// EVENTS
		args.target.addEventListener('click', (e) => {
			if (e.target.classList.contains('addToCart')) {
				const stockUid = e.target.dataset.stockUid;
				if (!stockUid) return;

				// Load existing or start new cart object
				const cart = JSON.parse(
					localStorage.getItem('shopcart') || '{}'
				);

				if (!cart.hasOwnProperty(stockUid)) {
					cart[stockUid] = (cart[stockUid] || 0) + 1;
					localStorage.setItem('shopcart', JSON.stringify(cart));
				}
				this.#updateShopCartTotalQuantity('shopCardsItemNumber');
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
			: './../../src/images/Logo (DarkMode).svg'; // fallback if no file

		// i love tarnary now
		const div = document.createElement('div');
		div.className = 'col-12 col-sm-6 col-md-4 col-xl-3';
		let buttonHtml = '';

		if (stock.quantity === 0) {
			buttonHtml = `
		<button class="btn btn-outline-secondary" disabled>
			<i class="bi bi-cart-x me-2"></i>Add to cart
		</button>
		<p class="mt-2 text-danger"><i class="bi bi-exclamation-triangle me-2"></i>Out of Stock</p>
		`;
		} else if (stock.quantity < 6) {
			buttonHtml = `
		<button class="btn btn-primary addToCart" data-stock-uid="${stock.stockUid}">
			<i class="bi bi-cart-plus me-2"></i>Add to cart
		</button>
		<p class="mt-2 text-warning"><i class="bi bi-exclamation-square me-2"></i>Limited Stock</p>
		`;
		} else {
			buttonHtml = `
		<button class="btn btn-primary addToCart" data-stock-uid="${stock.stockUid}">
			<i class="bi bi-cart-plus me-2"></i>Add to cart
		</button>`;
		}

		div.innerHTML = `
			<div class="card text-center text-decoration-none h-100">
			    <a href="#individual-product?stockUid=${stock.stockUid}">
					<img src="${imageUrl}" class="card-img-top product-card-img" alt="${
			product.name
		}" />
				</a>
				<div class="card-body">
					<p class="card-text">${product.name} - ${product.stocks[0].variantSize}</p>
					<p class="card-text">${stock.price.toFixed(2)} €</p>
					${buttonHtml}
				</div>
			</div>
			`;
		return div;
	}

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
				console.warn('Invalid shopcart JSON' + e);
			}
		}

		// Optional DOM update
		if (targetId) {
			const el = document.getElementById(targetId);
			if (el) el.innerHTML = totalQuantity > 0 ? totalQuantity : '';
		}

		return totalQuantity;
	}
}
