import PageHTML from './page-all-products.html';
import CategoryTree from './components/category-tree/category-tree';

export default class PageAllProducts {
	//--------------------------------------------------
	// Private Variables
	//--------------------------------------------------

	#args = null;
	#productList = null;
	#categoriesList = null;
	#categorieTree = null;
	#mobileTree = null;
	#currentPage = 1;
	#totalPages = 1;

	//--------------------------------------------------
	// Constructor
	//--------------------------------------------------
	constructor(args) {
		this.#args = args;
		args.target.innerHTML = PageHTML;
		//--------------------------------------------------
		// Constants
		//--------------------------------------------------
		const tableCategorieTree = args.target.querySelector(
			'#tableCategorieTree'
		);
		const clearCatFilter = args.target.querySelector('#clearCatFilter');

		//offCanva
		const mobileCategorieTree = document.querySelector(
			'#mobileCategorieTree'
		);

		//--------------------------------------------------
		// Init
		//--------------------------------------------------
		this.#categorieTree = new CategoryTree({
			target: tableCategorieTree,
			app: args.app,
			checkbox: false,
			click: () => {
				this.#currentPage = 1;
				// Sync to mobile
				this.#mobileTree.selectedCat = [
					...this.#categorieTree.selectedCat,
				];
				this.#mobileTree.selectedSubCat = [
					...this.#categorieTree.selectedSubCat,
				];
				this.#readData();
			},
		});

		this.#mobileTree = new CategoryTree({
			target: mobileCategorieTree,
			app: args.app,
			checkbox: false,
			click: () => {
				this.#currentPage = 1;
				// Use spread to copy the selectedCat array values from mobileTree
				// into a new array, avoiding shared reference - find more documentation
				this.#categorieTree.selectedCat = [
					...this.#mobileTree.selectedCat,
				];
				this.#categorieTree.selectedSubCat = [
					...this.#mobileTree.selectedSubCat,
				];
				this.#readData();
			},
		});

		args.app.apiGet(
			(r) => {
				this.#categorieTree.categoriesList = r.categoriesList;
				this.#mobileTree.categoriesList = r.categoriesList;

				this.#readData(); // load data only after TreeView is ready
			},
			(ex) => alert('Failed to load categories.'),
			'/page/product&categorieslist' // or a separate category-only endpoint
		);

		this.#readData();

		//--------------------------------------------------
		// Event Listener
		//--------------------------------------------------
		clearCatFilter.addEventListener('click', () => {
			this.#categorieTree.selectedCat = [];
			this.#categorieTree.selectedSubCat = [];
			this.#currentPage = 1;
			this.#readData();
		});
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
	//--------------------------------------------------
	// Private Methods
	//--------------------------------------------------
	#readData() {
		const container = this.#args.target.querySelector('#targetAllCards');
		container.innerHTML = ''; // Clear old cards

		const selectedCats = this.#categorieTree.selectedCat;
		const selectedSubcats = this.#categorieTree.selectedSubCat;
		const catParam = selectedCats.join(',');
		const subcatParam = selectedSubcats.join(',');
		const query = `/page/product&categorieslist/Paginated?page=${
			this.#currentPage
		}&pageSize=15&catIds=${catParam}&subcatIds=${subcatParam}`;

		this.#args.app.apiGet(
			(r) => {
				this.#productList = r.items;
				this.#totalPages = Math.ceil(r.totalCount / r.pageSize);

				// Render cards
				container.innerHTML = '';
				for (const product of this.#productList) {
					const card = this.#createProductCard(product);
					container.appendChild(card);
				}

				this.#renderPagination();
			},
			(ex) => {
				alert(ex.message || ex);
			},
			query
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
		div.className =
			'col-12 col-sm-5 col-md-3 col-lg-3 col-xl-3 mb-4 mx-auto';
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
		<button class="btn btn-primary addToCart" data-stock-uid="${stock.stockUid}">
			<i class="bi bi-cart-plus me-2"></i>Add to cart
		</button>
		<p class="my-2 text-warning"><i class="bi bi-exclamation-square me-2"></i>Limited Stock</p>
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
				    <img src="${imageUrl}" class="card-img-top" alt="${product.name}" />
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

	#renderPagination() {
		const paginationContainer =
			this.#args.target.querySelector('#pagination');
		paginationContainer.innerHTML = '';

		const createItem = (label, page, disabled = false, active = false) => {
			const li = document.createElement('li');
			li.className = `page-item ${disabled ? 'disabled' : ''} ${
				active ? 'active' : ''
			}`;

			const a = document.createElement('a');
			a.className = 'page-link text-color';
			a.href = '#';
			a.innerText = label;

			a.addEventListener('click', (e) => {
				e.preventDefault();
				if (!disabled && this.#currentPage !== page) {
					this.#currentPage = page;
					this.#readData();
				}
			});

			li.appendChild(a);
			paginationContainer.appendChild(li);
		};

		// Previous
		createItem('Previous', this.#currentPage - 1, this.#currentPage === 1);

		// Pages
		for (let i = 1; i <= this.#totalPages; i++) {
			createItem(i, i, false, i === this.#currentPage);
		}

		// Next
		createItem(
			'Next',
			this.#currentPage + 1,
			this.#currentPage === this.#totalPages
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
} // Class
