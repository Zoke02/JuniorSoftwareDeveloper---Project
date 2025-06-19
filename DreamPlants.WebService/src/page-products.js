import CategoryTree from './components/category-tree/category-tree';
import PageHTML from './page-products.html';

export default class PageProducts {
	//--------------------------------------------------
	// Private Variables
	//--------------------------------------------------

	#args = null;
	#productList = null;
	#categoriesList = null;
	#categorieTree = null;

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

		//--------------------------------------------------
		// Init
		//--------------------------------------------------
		this.#categorieTree = new CategoryTree({
			target: tableCategorieTree,
			app: args.app,
			checkbox: false,
			click: () => {
				this.#readData();
			},
		});
		this.#readData();

		//--------------------------------------------------
		// Event Listener
		//--------------------------------------------------
		clearCatFilter.addEventListener('click', () => {
			this.#categorieTree.selectedCat = [];
			this.#categorieTree.selectedSubCat = [];
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
					}
				}
			} else {
				window.open(
					'#productdetail?id=' +
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

		if (selectedCats.length === 0 && selectedSubcats.length === 0) {
			this.#args.app.apiGet(
				(r) => {
					this.#productList = r.productsList;
					this.#categoriesList = r.categoriesList;
					this.#categorieTree.categoriesList = r.categoriesList;
					tableProducts.innerHTML = this.#createTableTow();
				},
				(ex) => {
					alert(ex);
				},
				'/page/product&categorieslist'
			);
		} else {
			const catParam = selectedCats.join(',');
			const subcatParam = selectedSubcats.join(',');
			const query = `/page/product&categorieslist/Filter?catIds=${catParam}&subcatIds=${subcatParam}`;
			this.#args.app.apiGet(
				(r) => {
					this.#productList = r;
					tableProducts.innerHTML = this.#createTableTow();
				},
				(ex) => {
					alert(ex);
				},
				query
			);
		}
	}

	#createTableTow() {
		let html = '';
		for (const product of this.#productList) {
			if (product.stocks.length === 1) {
				// Products with with 1 stock
				const stock = product.stocks[0];
				html += `
						<tr data-stock-uid="${stock.stockUid}" >
							<td class="text-center">
							<button type="button" class="btn btn-outline-secondary" data-aktion="del" data-id="${stock.stockUid}"><i class="bi-trash"></i></button>
							</td>
							<td class="element-clickable pt-3 text-center">${stock.stockUid}</td>
							<td class="element-clickable pt-3 text-center">${product.name}</td>
							<td class="element-clickable pt-3 text-center">${stock.variantSize}</td>
							<td class="element-clickable pt-3 text-center">${stock.price} €</td>
							<td class="element-clickable pt-3 text-center">${stock.quantity}</td>
							<td class="element-clickable pt-3 text-center">${product.categoryName}</td>
							<td class="element-clickable pt-3 text-center">${product.subcategoryName}</td>

						</tr>
						`;
			} else if (product.stocks.length > 1) {
				// Products with more then 1 stock.. for future remember other variantes not just size.
				for (const stocks of product.stocks) {
					html += `
							<tr data-stock-uid="${stocks.stockUid}">
								<td class="text-center">
								<button type="button" class="btn btn-outline-secondary" data-aktion="del" data-id="${stocks.stockUid}"><i class="bi-trash"></i></button>
								</td>
								<td class="element-clickable pt-3 text-center">${stocks.stockUid}</td>
								<td class="element-clickable pt-3 text-center">${product.name}</td>
								<td class="element-clickable pt-3 text-center">${stocks.variantSize}</td>
								<td class="element-clickable pt-3 text-center">${stocks.price} €</td>
								<td class="element-clickable pt-3 text-center">${stocks.quantity}</td>
								<td class="element-clickable pt-3 text-center">${product.categoryName}</td>
								<td class="element-clickable pt-3 text-center">${product.subcategoryName}</td>
							</tr>
							`;
				}
			}
		}
		return html;
	} // createTableTow
} // Class
