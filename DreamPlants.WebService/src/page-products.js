import CategoryTree from './components/category-tree/category-tree';
import PageHTML from './page-products.html';
import * as bootstrap from 'bootstrap';

export default class PageProducts {
	//--------------------------------------------------
	// Private Variables
	//--------------------------------------------------

	#args = null;
	#productList = null;
	#categoriesList = null;
	#categorieTree = null;
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
		const tableProducts = args.target.querySelector('#tableProducts>tbody');
		const tableCategorieTree = args.target.querySelector(
			'#tableCategorieTree'
		);
		const clearCatFilter = args.target.querySelector('#clearCatFilter');

		// Toastie
		const toastLiveExample = document.getElementById('liveToast');
		const toastTitle = document.getElementById('toastTitle');
		const toastBody = document.getElementById('toastBody');

		//--------------------------------------------------
		// Init
		//--------------------------------------------------
		this.#categorieTree = new CategoryTree({
			target: tableCategorieTree,
			app: args.app,
			checkbox: false,
			click: () => {
				// this.#currentPage = 1; // check if you need this for filter of 2 cat / subcat
				this.#readData();
			},
		});
		args.app.apiGet(
			(r) => {
				this.#categorieTree.categoriesList = r.categoriesList;
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

		tableProducts.addEventListener('click', (e) => {
			let btn = null;

			if (e.target.nodeName == 'BUTTON') {
				btn = e.target;
			} else if (
				e.target.nodeName == 'I' &&
				e.target.parentElement.nodeName == 'BUTTON'
			)
				btn = e.target.parentElement;
			if (btn) {
				if (btn.dataset.aktion == 'del') {
					const a = this.#productList.filter(
						(o) => o.stockUid == btn.dataset.id
					)[0];
					if (confirm('Are you sure you wish to delete?')) {
						args.app.apiDeleteSomething(
							(r) => {
								toastTitle.innerText = 'Product Detail:';
								toastBody.innerText = r.message;
								const toastBootstrap =
									bootstrap.Toast.getOrCreateInstance(
										toastLiveExample
									);
								toastBootstrap.show();
								this.#readData();
							},
							(err) => {
								toastTitle.innerText = 'Product Detail:';
								toastBody.innerText = err.message;
								const toastBootstrap =
									bootstrap.Toast.getOrCreateInstance(
										toastLiveExample
									);
								toastBootstrap.show();
							},
							'Products/DeleteProduct/' + btn.dataset.id
						);
					}
				}
			} else {
				window.open(
					'#product-detail?stockUid=' +
						e.target.parentElement.dataset.stockUid,
					'_self'
				);
			}
		});
	}
	//--------------------------------------------------
	// Private Methods
	//--------------------------------------------------

	#readData() {
		const tableProducts = this.#args.target.querySelector(
			'#tableProducts>tbody'
		);
		const selectedCats = this.#categorieTree.selectedCat;
		const selectedSubcats = this.#categorieTree.selectedSubCat;
		const catParam = selectedCats.join(',');
		const subcatParam = selectedSubcats.join(',');
		const query = `/page/product&categorieslist/Paginated?page=${
			this.#currentPage
		}&pageSize=9&catIds=${catParam}&subcatIds=${subcatParam}`;

		this.#args.app.apiGet(
			(r) => {
				this.#productList = r.items;
				this.#totalPages = Math.ceil(r.totalCount / r.pageSize);
				tableProducts.innerHTML = this.#createTableTow();
				this.#renderPagination();
			},
			(ex) => {
				alert(ex.message || ex);
			},
			query
		);
	}

	#createTableTow() {
		let html = '';
		for (const product of this.#productList) {
			if (product.stocks.length === 1) {
				// Products with with 1 stock
				const stock = product.stocks[0];
				const quantityClass =
					stock.quantity === 0
						? 'popover-error'
						: stock.quantity < 10
						? 'popover-warning'
						: '';
				html += `
						<tr data-stock-uid="${stock.stockUid}" >
							<td class="text-center">
							<button type="button" class="btn btn-outline-secondary" data-aktion="del" data-id="${stock.stockUid}"><i class="bi-trash"></i></button>
							</td>
							<td class="element-clickable pt-3 text-center">${stock.stockUid}</td>
							<td class="element-clickable pt-3 text-center">${product.name}</td>
							<td class="element-clickable pt-3 text-center">${stock.variantSize}</td>
							<td class="element-clickable pt-3 text-center">${stock.price} €</td>
							<td class="element-clickable pt-3 text-center ${quantityClass}">${stock.quantity}</td>
							<td class="element-clickable pt-3 text-center">${product.categoryName}</td>
							<td class="element-clickable pt-3 text-center">${product.subcategoryName}</td>

						</tr>
						`;
			} else if (product.stocks.length > 1) {
				// Products with more then 1 stock.. for future remember other variantes not just size.

				for (const stocks of product.stocks) {
					const quantityClass =
						stocks.quantity === 0
							? 'popover-error'
							: stocks.quantity < 10
							? 'popover-warning'
							: '';
					html += `
							<tr data-stock-uid="${stocks.stockUid}">
								<td class="text-center">
								<button type="button" class="btn btn-outline-secondary" data-aktion="del" data-id="${stocks.stockUid}"><i class="bi-trash"></i></button>
								</td>
								<td class="element-clickable pt-3 text-center">${stocks.stockUid}</td>
								<td class="element-clickable pt-3 text-center">${product.name}</td>
								<td class="element-clickable pt-3 text-center">${stocks.variantSize}</td>
								<td class="element-clickable pt-3 text-center">${stocks.price} €</td>
								<td class="element-clickable pt-3 text-center ${quantityClass}">${stocks.quantity}</td>
								<td class="element-clickable pt-3 text-center">${product.categoryName}</td>
								<td class="element-clickable pt-3 text-center">${product.subcategoryName}</td>
							</tr>
							`;
				}
			}
		}
		return html;
	} // createTableTow

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
} // Class
