import CategoryTree from './components/category-tree/category-tree';
import PageHTML from './page-product-detail.html';

export default class PageProductDetail {
	//--------------------------------------------------
	// Private Variables
	//--------------------------------------------------
	#args = null;
	#categorieTree = null;
	#product = null;

	//--------------------------------------------------
	// Constructor
	//--------------------------------------------------
	constructor(args) {
		this.#args = args;
		args.target.innerHTML = PageHTML;

		//--------------------------------------------------
		// Constants
		//--------------------------------------------------
		const product = null;
		this.#product = product;

		// TreeView container
		const tableCategorieTree = args.target.querySelector(
			'#tableCategorieTree'
		);

		// Input fields
		const textNumber = args.target.querySelector('#textNumber');
		const textName = args.target.querySelector('#textName');
		const textVariantSize = args.target.querySelector('#textVariantSize');
		const textVariantColor = args.target.querySelector('#textVariantColor');
		const textPrice = args.target.querySelector('#textPrice');

		// Accordion panels
		const accordionItem2 = args.target.querySelector('#accordionItem2');
		const accordionItem3 = args.target.querySelector('#accordionItem3');

		// Stock buttons and info
		const buttonAddStock = args.target.querySelector('#buttonAddStock');
		const buttonRemoveStock =
			args.target.querySelector('#buttonRemoveStock');
		const infoCurrentAmmount = args.target.querySelector(
			'#infoCurrentAmmount'
		);

		// File inputs (unused but declared)
		const rowFile = args.target.querySelector('#rowFile');
		const inputFile = args.target.querySelector('#inputFile');
		const containerFiles = args.target.querySelector('#containerFiles');

		//--------------------------------------------------
		// Init
		//--------------------------------------------------

		// TreeView init with single select
		this.#categorieTree = new CategoryTree({
			target: tableCategorieTree,
			app: args.app,
			checkbox: true,
			singleSelect: true,
		});

		// First load categories
		args.app.apiGet(
			(r) => {
				this.#categorieTree.categoriesList = r.categoriesList;

				// Then load product if we're editing
				if (args.id) {
					args.app.apiGet(
						(p) => {
							this.#product = p;

							// Select the product's subcategory
							const subId = p.subcategoryId;
							this.#categorieTree.selectedSubCat = [subId];

							// Select the parent category for visual sync
							const parentCat = r.categoriesList.find((cat) =>
								cat.subcategories?.some(
									(sub) => sub.subcategoryId === subId
								)
							);
							if (parentCat) {
								this.#categorieTree.selectedCat = [
									parentCat.categoryId,
								];
							}
							console.log(p);
							// Fill fields
							textName.value = p.name;
							textVariantSize.value = p.stocks[0].variantSize;
							textNumber.value = p.stocks[0].stockNumber;
							infoCurrentAmmount.innerHTML = p.stocks[0].quantity;
							textPrice.value = parseFloat(
								p.stocks[0].price
							).toFixed(2);
						},
						(ex) => alert(ex),
						'/Products/' + args.id
					);
				} else {
					accordionItem2.classList.add('d-none');
				}
			},
			(ex) => alert(ex),
			'/page/product&categorieslist'
		);
	} // Constructor
} // Class
