import PageHTML from './page-individual-product.html';
import PlantCareSection from './components/plant-care-section/plant-care-section';
import * as bootstrap from 'bootstrap';

export default class PageIndividualProduct {
	#args = null;

	constructor(args) {
		this.#args = args;
		args.target.innerHTML = PageHTML;

		const plantCareSection = args.target.querySelector('#plantCareSection');
		this.#fetchProductDetails(args.stockUid);
		// END LOAD
		new PlantCareSection({
			target: plantCareSection,
			app: args.app,
		});

		args.target.addEventListener('click', (e) => {
			const btn = e.target.closest('#buttonAddToCart');
			if (!btn) return;

			const stockUid = btn.dataset.stockUid;
			if (!stockUid) return;

			const cart = JSON.parse(localStorage.getItem('shopcart') || '{}');

			if (!cart.hasOwnProperty(stockUid)) {
				cart[stockUid] = (cart[stockUid] || 0) + 1;
				localStorage.setItem('shopcart', JSON.stringify(cart));
				console.log(`Added ${stockUid} to cart with quantity 1`);
			}
			this.#updateShopCartTotalQuantity('shopCardsItemNumber');
		});
	}

	#renderProductDetail(res) {
		const product = res?.product;
		if (!product) return;

		const stock = product.stocks?.[0];
		const file = product.files?.[0];

		const imageUrl = file
			? `data:${file.fileType};base64,${file.fileData}`
			: './images/Logo (DarkMode).svg';

		// Fill elements by ID
		document.getElementById('productImage').src = imageUrl;
		document.getElementById('productImage').alt = product.name;
		document.getElementById('productName').innerText = product.name;
		document.getElementById('productCategory').innerText =
			product.categoryName || 'Unknown Category';
		document.getElementById('productPrice').innerText =
			stock?.price != null ? `€${stock.price.toFixed(2)}` : '€0.00';
		document.getElementById('productSize').innerText =
			stock?.variantSize || 'N/A';
		document.getElementById('productVariantText').innerText =
			stock?.variantText || '';
		const buttonContainer = document.getElementById(
			'buttonAddToCartWrapper'
		);

		let buttonHtml = '';

		if (stock.quantity === 0) {
			buttonHtml = `
		<button class="btn btn-outline-secondary" disabled>
			<i class="bi bi-cart-x me-2"></i>Add to cart
		</button>
		<p class="my-2 text-danger"><i class="bi bi-exclamation-triangle me-2"></i>Out of Stock</p>
	`;
		} else if (stock.quantity < 6) {
			buttonHtml = `
		<button class="btn btn-primary" data-stock-uid="${stock.stockUid}" id="buttonAddToCart">
			<i class="bi bi-cart-plus me-2"></i>Add to cart
		</button>
		<p class="my-2 text-warning"><i class="bi bi-exclamation-square me-2"></i>Limited Stock</p>
	`;
		} else {
			buttonHtml = `
		<button class="btn btn-primary" data-stock-uid="${stock.stockUid}" id="buttonAddToCart">
			<i class="bi bi-cart-plus me-2"></i>Add to cart
		</button>`;
		}

		buttonContainer.innerHTML = buttonHtml;
	}

	#fetchProductDetails(stockUid) {
		this.#args.app.apiGet(
			(res) => {
				this.#renderProductDetail(res);
				console.log('Product details:', res);
			},
			(err) => {
				console.error('Error fetching product:', err.message || err);
			},
			`/Products/${stockUid}`
		);
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
