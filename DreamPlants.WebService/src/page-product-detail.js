import CategoryTree from './components/category-tree/category-tree';
import PageHTML from './page-product-detail.html';
import * as bootstrap from 'bootstrap';

export default class PageProductDetail {
	//--------------------------------------------------
	// Private Variables
	//--------------------------------------------------
	#args = null;
	#categorieTree = null;
	#product = null;

	// Prefill items
	#textNumber = null;
	#textName = null;
	#textVariantSize = null;
	#textVariantColor = null;
	#textPrice = null;
	#infoCurrentAmmount = null;
	#textNote = null;
	#textVariantText = null;
	#containerFiles = null;

	#uploadedFiles = [];

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
		this.#textNumber = textNumber;
		const textName = args.target.querySelector('#textName');
		this.#textName = textName;
		const textVariantSize = args.target.querySelector('#textVariantSize');
		this.#textVariantSize = textVariantSize;
		const textVariantColor = args.target.querySelector('#textVariantColor');
		this.#textVariantColor = textVariantColor;
		const textPrice = args.target.querySelector('#textPrice');
		this.#textPrice = textPrice;
		const textNote = args.target.querySelector('#textNote');
		this.#textNote = textNote;
		const textVariantText = args.target.querySelector('#textVariantText');
		this.#textVariantText = textVariantText;

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
		this.#infoCurrentAmmount = infoCurrentAmmount;

		// Save
		const buttonSave = args.target.querySelector('#buttonSave');

		// Toastie
		const toastLiveExample = document.getElementById('liveToast');
		const toastTitle = document.getElementById('toastTitle');
		const toastBody = document.getElementById('toastBody');

		// File inputs (unused but declared)
		const rowFile = args.target.querySelector('#rowFile');
		const inputFile = args.target.querySelector('#inputFile');
		const containerFiles = args.target.querySelector('#containerFiles');
		this.#containerFiles = containerFiles;
		//--------------------------------------------------
		// Init
		const random8Digit = Math.floor(10000000 + Math.random() * 90000000);
		console.log(random8Digit);
		if (this.#product == null) this.#textNumber.value = random8Digit;
		//--------------------------------------------------
		// TreeView init with single select
		this.#categorieTree = new CategoryTree({
			target: tableCategorieTree,
			app: args.app,
			checkbox: true,
			singleSelect: true,
		});

		// First load categories and product
		args.app.apiGet(
			(r) => {
				// Pass category list to the treeview.
				this.#categorieTree.categoriesList = r.categoriesList;

				if (args.stockUid) {
					args.app.apiGet(
						(successCallback) => {
							this.#product = successCallback.product;
							console.log(this.#product);

							// Select the product's subcategory
							const subId = successCallback.product.subcategoryId;
							const catId = successCallback.product.categoryId;

							this.#categorieTree.selectedSubCat = [subId];
							this.#categorieTree.selectedCat = [catId];

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
							this.#refreshFields();
						},
						(ex) => alert(ex),
						'/Products/' + args.stockUid
					);
				} else {
					accordionItem2.classList.add('d-none');
				}
			},
			(ex) => alert(ex),
			'/page/product&categorieslist'
		);

		//--------------------------------------------------
		// Events
		//--------------------------------------------------

		// Trigger file picker on click
		rowFile.addEventListener('click', () => inputFile.click());

		// Handle file selection via input
		inputFile.addEventListener('change', () => {
			this.#handleFiles(inputFile.files);
		});

		// Handle drag/drop
		rowFile.addEventListener('dragover', (e) => {
			e.preventDefault();
			rowFile.classList.add('drag-over');
		});
		rowFile.addEventListener('dragleave', () =>
			rowFile.classList.remove('drag-over')
		);
		rowFile.addEventListener('drop', (e) => {
			e.preventDefault();
			rowFile.classList.remove('drag-over');
			this.#handleFiles(e.dataTransfer.files);
		});

		// DEV

		buttonSave.addEventListener('click', async () => {
			const payload = await this.#prepareProductPayload();
			console.log(payload);
			console.log('SAVE CLICK');

			if (this.#product == null) {
				console.log('API CALLED');
				args.app.apiNewSomethingPOST(
					(r) => {
						toastTitle.innerText = 'Product Detail:';
						toastBody.innerText = r.message;
						const toastBootstrap =
							bootstrap.Toast.getOrCreateInstance(
								toastLiveExample
							);
						toastBootstrap.show();
					},
					(err) => {
						toastTitle.innerText = 'Product Detail:';
						toastBody.innerText = err;
						const toastBootstrap =
							bootstrap.Toast.getOrCreateInstance(
								toastLiveExample
							);
						toastBootstrap.show();
					},
					'Products/AddProduct',
					payload
				);
			} else if (args.stockUid != null) {
				// then api edit.
			}
		});
	} // Constructor

	#refreshFields() {
		if (this.#product != null) {
			// Fill fields
			this.#textNumber.value = this.#product.stocks[0].stockNumber || '';
			this.#textName.value = this.#product.name || '';
			this.#textVariantSize.value =
				this.#product.stocks[0].variantSize || '';
			this.#textVariantColor.value =
				this.#product.stocks[0].variantColor || '';
			this.#textVariantText.value =
				this.#product.stocks[0].variantText || '';
			this.#infoCurrentAmmount.innerHTML =
				this.#product.stocks[0].quantity ?? '';
			this.#textPrice.value =
				this.#product.stocks[0].price != null
					? parseFloat(this.#product.stocks[0].price).toFixed(2)
					: '';
			this.#textNote.value = this.#product.stocks[0].note || '';
		}
		if (this.#product.files?.length > 0) {
			this.#product.files.forEach((file) => {
				const base64 = `data:${file.fileType};base64,${file.fileData}`;
				const html = `
				<div class="col-12 col-sm-6 col-md-4 col-xl-3">
					<div class="card text-center h-100">
						<img src="${base64}" class="card-img-top" alt="${file.fileName}" />
						<div class="card-body">
							<p class="card-text">${file.fileName}</p>
							<button class="btn btn-sm border" data-file-id="${file.fileId}">
								Delete
							</button>
						</div>
					</div>
				</div>
				`;
				this.#containerFiles.insertAdjacentHTML('beforeend', html);
			});
		}
	}

	async #prepareProductPayload() {
		// you need away for the promise so you dont mingle the files
		const files = this.#uploadedFiles;

		// cant use this.#categorieTree.selectedCat[] because u got more then 1 cat open at a time. check with the subcat id as i cant have more then 1 subid be the same in databank for the correct catid.
		const selectedSubCatId = this.#categorieTree.selectedSubCat[0];

		let categoryId = -1; // Default to -1 if nothing is selected

		if (selectedSubCatId) {
			const input = document.querySelector(
				`#checkbox_${selectedSubCatId}`
			);
			if (input && input.dataset.catId) {
				const parsed = parseInt(input.dataset.catId);
				if (!isNaN(parsed)) {
					categoryId = parsed;
				}
			}
		}

		const fileDTOs = await Promise.all(
			files.map(
				(file) =>
					new Promise((resolve, reject) => {
						const reader = new FileReader();
						reader.onload = () => {
							const base64 = reader.result.split(',')[1];
							resolve({
								fileName: file.name,
								fileType: file.type,
								fileData: base64,
							});
						};
						reader.onerror = reject;
						reader.readAsDataURL(file);
					})
			)
		);
		return {
			name: this.#textName.value,
			subcategoryId: this.#categorieTree.selectedSubCat[0],
			categoryId: categoryId,
			stocks: [
				{
					stockNumber: this.#textNumber.value,
					variantSize: this.#textVariantSize.value,
					variantColor: this.#textVariantColor.value,
					variantText: this.#textVariantText.value,
					price:
						this.#textPrice.value.trim() !== ''
							? parseFloat(this.#textPrice.value)
							: null,

					quantity: 0, // with stock let user fill this later - mebmer to print red on 0
					note: this.#textNote.value,
				},
			],
			files: fileDTOs,
		};
	}

	#handleFiles(fileList) {
		this.#uploadedFiles = Array.from(fileList); // store files

		this.#containerFiles.innerHTML = ''; // clear previews

		this.#uploadedFiles.forEach((file) => {
			if (!file.type.startsWith('image/')) return;

			const reader = new FileReader();
			reader.onload = (e) => {
				const html = `
				<div class="col-12 col-sm-6 col-md-4 col-xl-3">
					<div class="card text-center h-100">
						<img src="${e.target.result}" class="card-img-top" alt="${file.name}" />
						<div class="card-body">
							<p class="card-text">${file.name}</p>
							<button class="btn btn-sm border" data-file-id="${file.fileId}">
								Delete
							</button>
						</div>
					</div>
				</div>
				`;
				this.#containerFiles.insertAdjacentHTML('beforeend', html);
			};

			reader.readAsDataURL(file);
		});
	}
} // Class
