import CategoryTree from './components/category-tree/category-tree';
import PageHTML from './page-product-detail.html';
import * as bootstrap from 'bootstrap';

export default class PageProductDetail {
	//--------------------------------------------------
	// Private Variables
	//--------------------------------------------------
	#args = null;
	#product = null;
	#stockUid = null;

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
	#existingFiles = []; //  DB

	#categorieTree = null;
	#mobileTree = null;

	//--------------------------------------------------
	// Constructor
	//--------------------------------------------------
	constructor(args) {
		this.#args = args;
		args.target.innerHTML = PageHTML;

		//7 stock
		this.#stockUid =
			this.#args.stockUid ||
			new URLSearchParams(window.location.search).get('stockUid');
		//--------------------------------------------------
		// Constants
		//--------------------------------------------------
		const product = null;
		this.#product = product;

		// TreeView container
		const tableCategorieTree = args.target.querySelector(
			'#tableCategorieTree'
		);
		const mobileCategorieTree = document.querySelector(
			'#mobileCategorieTree'
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
		if (this.#product == null) this.#textNumber.value = random8Digit;

		//--------------------------------------------------
		// TreeView init with single select

		this.#categorieTree = new CategoryTree({
			target: tableCategorieTree,
			app: args.app,
			checkbox: true,
			singleSelect: true,

			click: () => {
				// Sync to mobile
				this.#mobileTree.selectedCat = [
					...this.#categorieTree.selectedCat,
				];
				this.#mobileTree.selectedSubCat = [
					...this.#categorieTree.selectedSubCat,
				];
			},
		});

		this.#mobileTree = new CategoryTree({
			target: mobileCategorieTree,
			app: args.app,
			checkbox: true,
			singleSelect: true,
			click: () => {
				// Use spread to copy the selectedCat array values from mobileTree
				// into a new array, avoiding shared reference - find more documentation
				this.#categorieTree.selectedCat = [
					...this.#mobileTree.selectedCat,
				];
				this.#categorieTree.selectedSubCat = [
					...this.#mobileTree.selectedSubCat,
				];
			},
		});

		// First load categories and product
		args.app.apiGet(
			(r) => {
				// Pass category list to the treeview.
				this.#categorieTree.categoriesList = r.categoriesList;
				this.#mobileTree.categoriesList = r.categoriesList;

				if (args.stockUid) {
					args.app.apiGet(
						(successCallback) => {
							this.#product = successCallback.product;

							// Select the product's subcategory
							const subId = successCallback.product.subcategoryId;
							const catId = successCallback.product.categoryId;

							this.#categorieTree.selectedSubCat = [subId];
							this.#categorieTree.selectedCat = [catId];
							this.#mobileTree.selectedSubCat = [subId];
							this.#mobileTree.selectedCat = [catId];

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
		textPrice.addEventListener('input', (e) => {
			const val = e.target.value
				.replace(',', '.') // convert comma to dot
				.replace(/[^0-9.]/g, '') // remove non-numeric and non-dot
				.replace(/(\..*?)\..*/g, '$1'); // allow only one dot check later if you doin 1.000,29 stuff https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions/Cheatsheet
			e.target.value = val;
		});

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
			if (!this.#validateProductFields()) return;

			// CREATE NEW PRODUCT
			if ((!this.#product && !this.#args.stockUid) || !this.#stockUid) {
				args.app.apiNewSomethingPOST(
					(r) => {
						if (r.success) {
							toastTitle.innerText = 'Product Detail:';
							toastBody.innerText = r.message;
							const toastBootstrap =
								bootstrap.Toast.getOrCreateInstance(
									toastLiveExample
								);
							toastBootstrap.show();
							this.#stockUid = r.stockUid;
							accordionItem2.classList.remove('d-none');

							setTimeout(() => {
								if (r.stockUid) {
									window.location.hash = `product-detail?stockUid=${r.stockUid}`;
								}
							}, 2500);
						} else {
							toastTitle.innerText = 'Validation Error';
							toastBody.innerText = r.message;
							bootstrap.Toast.getOrCreateInstance(
								toastLiveExample
							).show();
						}
					},
					(err) => {
						toastTitle.innerText = 'Product Detail:';
						toastBody.innerText =
							err.message || 'Failed to save product.';
						bootstrap.Toast.getOrCreateInstance(
							toastLiveExample
						).show();
					},
					'Products/AddProduct',
					payload
				);
			}
			// EDIT EXISTING PRODUCT
			else if (this.#args.stockUid || this.#stockUid) {
				args.app.apiNewSomethingPOST(
					(r) => {
						toastTitle.innerText = 'Product Detail:';
						toastBody.innerText = r.message;
						bootstrap.Toast.getOrCreateInstance(
							toastLiveExample
						).show();
					},
					(err) => {
						toastTitle.innerText = 'Product Detail:';
						toastBody.innerText =
							err.message || 'Failed to update product.';
						bootstrap.Toast.getOrCreateInstance(
							toastLiveExample
						).show();
					},
					'Products/UpdateProduct/' + this.#stockUid,
					payload
				);
			}
		});

		// Handle add stock
		buttonAddStock.addEventListener('click', () => {
			const amount = parseInt(
				prompt('Enter amount to ADD to stock:'),
				10
			);
			if (isNaN(amount) || amount <= 0) return alert('Invalid amount.');
			this.#adjustStock('positiv', amount);
		});

		// Handle remove stock
		buttonRemoveStock.addEventListener('click', () => {
			const amount = parseInt(
				prompt('Enter amount to SUBTRACT from stock:'),
				10
			);
			if (isNaN(amount) || amount <= 0) return alert('Invalid amount.');
			this.#adjustStock('negativ', amount);
		});

		// Handlke delete image
		// File delete (for existing DB files)
		this.#containerFiles.addEventListener('click', (e) => {
			const btn = e.target.closest('.btn-delete-file');
			if (!btn) return;

			const tempId = btn.dataset.tempId;
			if (tempId) {
				this.#uploadedFiles = this.#uploadedFiles.filter(
					(_, i) => `temp-${i}` !== tempId
				);
				const fileCard = btn.closest(`[data-temp-id-card="${tempId}"]`);
				if (fileCard) fileCard.remove();
				return;
			}

			//  Existing DB file
			const fileId = btn.dataset.fileId;
			if (fileId && confirm('Delete this image?')) {
				this.#existingFiles = this.#existingFiles.filter(
					(f) => f.fileId != fileId
				);
				this.#args.app.apiDeleteSomething(
					(r) => {
						// THIS IS WHAT YOU NEED TO FIX  !! CHECK BAK LATER !!
						const fileCard = btn.closest(
							`[data-file-id="${fileId}"]`
						);
						if (fileCard) fileCard.remove();

						toastTitle.innerText = 'Product Detail:';
						toastBody.innerText = r.message;
						bootstrap.Toast.getOrCreateInstance(
							toastLiveExample
						).show();
					},
					(err) => {
						toastTitle.innerText = 'Product Detail:';
						toastBody.innerText = err.message;
						bootstrap.Toast.getOrCreateInstance(
							toastLiveExample
						).show();
					},
					`Products/DeleteFile/${fileId}`
				);
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
			this.#containerFiles.innerHTML = ''; // clear before inserting
			this.#existingFiles = [...this.#product.files]; //fucking ...

			this.#product.files.forEach((file) => {
				const base64 = `data:${file.fileType};base64,${file.fileData}`;
				const html = `
			<div class="col-12 col-sm-6 col-md-4 col-xl-3" data-temp-id-card="${file.fileId}">
				<div class="card text-center h-100">
					<img src="${base64}" class="card-img-top" alt="${file.fileName}" />
					<div class="card-body">
						<p class="card-text">${file.fileName}</p>
						<button class="btn btn-sm btn-danger btn-delete-file" data-file-id="${file.fileId}">
							Delete
						</button>
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

					quantity: this.#product?.stocks?.[0]?.quantity ?? 0, // DEV
					note: this.#textNote.value,
				},
			],
			files: [
				...this.#existingFiles, //From DB
				...fileDTOs, // newly uploaded
			],
		};
	}

	#handleFiles(fileList) {
		this.#uploadedFiles.push(...fileList); // ✅ Append instead of replace

		const currentCount =
			this.#containerFiles.querySelectorAll('[data-temp-id]').length;

		Array.from(fileList).forEach((file, index) => {
			if (!file.type.startsWith('image/')) return;

			const reader = new FileReader();
			reader.onload = (e) => {
				const tempId = `temp-${currentCount + index}`; // Make sure IDs stay unique
				const html = `
				<div class="col-12 col-sm-6 col-md-4 col-xl-3" data-temp-id-card="${tempId}">
					<div class="card text-center h-100">
						<img src="${e.target.result}" class="card-img-top" alt="${file.name}" />
						<div class="card-body">
							<p class="card-text">${file.name}</p>
							<button class="btn btn-sm btn-danger btn-delete-file" data-temp-id="${tempId}">
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

	#validateProductFields() {
		const name = this.#textName.value.trim();
		const variantSize = this.#textVariantSize.value.trim();
		const variantColor = this.#textVariantColor.value.trim();
		const priceString = this.#textPrice.value.trim();
		const priceIntCheck = parseFloat(priceString);

		function showErrorPopover(inputElement, message) {
			const existing = bootstrap.Popover.getInstance(inputElement);
			if (existing) existing.dispose();

			const popover = new bootstrap.Popover(inputElement, {
				content: message,
				trigger: 'manual',
				placement: 'top',
				customClass: 'popover-error',
			});

			popover.show();

			setTimeout(() => {
				popover.hide();
			}, 3000);
		}

		const fields = [this.#textName, this.#textVariantSize, this.#textPrice];
		let valid = true;

		fields.forEach((element) => {
			if (element == this.#textName && !name) {
				showErrorPopover(this.#textName, 'Product name is required.');
				valid = false;
			}
			if (
				element == this.#textVariantSize &&
				!variantSize &&
				!variantColor
			) {
				showErrorPopover(
					this.#textVariantColor,
					'Product Variant (Size or Color) is required.'
				);
				valid = false;
			}

			if (element == this.#textPrice) {
				if (!priceString) {
					showErrorPopover(
						this.#textPrice,
						'Product price is required.'
					);
					valid = false;
				} else if (isNaN(priceIntCheck) || priceIntCheck <= 0) {
					showErrorPopover(
						this.#textPrice,
						'Price must be a valid positive number.'
					);
					valid = false;
				}
			}
		});
		return valid;
	}

	#adjustStock(adjustType, amount) {
		const stockUid = this.#product?.stocks[0]?.stockUid;
		if (!stockUid) return alert('Stock UID missing.');

		this.#args.app.apiNewSomethingPOST(
			(r) => {
				const toast = bootstrap.Toast.getOrCreateInstance(
					document.getElementById('liveToast')
				);
				document.getElementById('toastTitle').innerText =
					'Stock Update';
				document.getElementById('toastBody').innerText = r.message;
				toast.show();

				if (r.success) {
					this.#infoCurrentAmmount.innerText = r.newQuantity ?? '0';
					this.#product.stocks[0].quantity = r.newQuantity;
				}
			},
			(err) => {
				alert('Stock update failed.');
				console.error(err);
			},
			`Products/AdjustStock/${adjustType}`,
			{ stockUid, amount }
		);
	}
} // Class
