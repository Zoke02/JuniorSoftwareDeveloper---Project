import HTML from './category-tree.html';

export default class CategoryTree {
	//--------------------------------------------------
	// Private Variables
	//--------------------------------------------------
	#args = null;
	#categoriesList = null;
	#selectedCat = [];
	#selectedSubCat = [];
	#singleSelect = false;

	constructor(args) {
		this.#args = args;
		this.#args.target.innerHTML = HTML;
		this.#singleSelect = this.#args.singleSelect || false;

		//--------------------------------------------------
		// Events
		//--------------------------------------------------

		// Up/Down arrow
		this.#args.target.addEventListener('click', (e) => {
			const btn = e.target.closest('a[data-bs-toggle="collapse"]');
			if (btn) {
				const icon = btn.querySelector('i');
				if (icon) {
					icon.classList.toggle('bi-caret-up-square');
					icon.classList.toggle('bi-caret-down-square');
				}
			}
		});

		// Click event on treeview
		this.#args.target.addEventListener('click', (e) => {
			const subcategory = e.target.closest('[data-subcat-id]');
			const category = e.target.closest('[data-id]');

			if (category) {
				const catId = parseInt(category.dataset.id);
				const index = this.#selectedCat.indexOf(catId);

				if (index === -1) {
					this.#selectedCat.push(catId);
				} else {
					this.#selectedCat.splice(index, 1);

					// Remove related subcategories
					const catObj = this.#categoriesList.find(
						(cat) => cat.categoryId === catId
					);
					if (catObj && catObj.subcategories) {
						this.#selectedSubCat = this.#selectedSubCat.filter(
							(id) =>
								!catObj.subcategories.some(
									(sub) => sub.subcategoryId === id
								)
						);
					}
				}
			}

			if (subcategory) {
				const subcatId = parseInt(subcategory.dataset.subcatId);
				const index = this.#selectedSubCat.indexOf(subcatId);

				if (
					subcategory &&
					!e.target.matches('input[type="checkbox"]')
				) {
					const subcatId = parseInt(subcategory.dataset.subcatId);
					const index = this.#selectedSubCat.indexOf(subcatId);

					if (index === -1) {
						if (this.#singleSelect) {
							this.#selectedSubCat = [subcatId];
							const checkboxes =
								this.#args.target.querySelectorAll(
									'input[type="checkbox"]'
								);
							checkboxes.forEach((cb) => {
								cb.checked = cb.id === 'checkbox_' + subcatId;
							});
						} else {
							this.#selectedSubCat.push(subcatId);
							const cb = subcategory.querySelector(
								'input[type="checkbox"]'
							);
							if (cb) cb.checked = true;
						}

						const parentCat = this.#categoriesList.find((cat) =>
							cat.subcategories?.some(
								(sub) => sub.subcategoryId === subcatId
							)
						);
						if (
							parentCat &&
							!this.#selectedCat.includes(parentCat.categoryId)
						) {
							this.#selectedCat.push(parentCat.categoryId);
						}
					} else {
						this.#selectedSubCat.splice(index, 1);
						const cb = subcategory.querySelector(
							'input[type="checkbox"]'
						);
						if (cb) cb.checked = false;
					}
				}
			}

			this.#updateActiveStates();
			if (typeof this.#args.click === 'function') {
				this.#args.click();
			}
		});
	} // Constructor

	//--------------------------------------------------
	// Get/Set Categories
	//--------------------------------------------------

	get categoriesList() {
		return this.#categoriesList;
	}

	set categoriesList(v) {
		this.#categoriesList = v;
		this.#showTree();
	}

	get selectedCat() {
		return this.#selectedCat;
	}

	set selectedCat(value) {
		this.#selectedCat = value;
	}

	get selectedSubCat() {
		return this.#selectedSubCat;
	}

	set selectedSubCat(value) {
		this.#selectedSubCat = value;
		this.#updateActiveStates();
	}

	//--------------------------------------------------
	// Private Methods
	//--------------------------------------------------

	#showTree() {
		const containerCategory =
			this.#args.target.querySelector('#containerCategory');
		containerCategory.innerHTML = this.#createTree();
	}

	#createTree() {
		let html = ``;
		if (this.#categoriesList != null) {
			for (const cat of this.#categoriesList) {
				html += `
					<a
					class="list-group-item list-group-item-action ps-2"
					data-bs-toggle="collapse"
					data-id="${cat.categoryId}"
					href="#multiCollapseCategorie${cat.categoryId}"
					role="button"
					aria-expanded="false"
					aria-controls="multiCollapseCategorie${cat.categoryId}"
					id="${cat.categoryId}"
					><i class="bi bi-caret-up-square pe-2"></i>${cat.categoryName}</a>
					`;
				if (cat.subcategories != null) {
					for (const subcat of cat.subcategories) {
						html += `
						<div class="row ps-3">
							<div
								class="collapse multi-collapse"
								data-subcat-id="${subcat.subcategoryId}"
								id="multiCollapseCategorie${cat.categoryId}"
							>
							${
								this.#args.checkbox
									? `<label class="list-group-item list-group-item-action">
								<input class="form-check-input" 
								type="checkbox" 
								name="checkbox_${subcat.subcategoryId}" 
								id="checkbox_${subcat.subcategoryId}">
								<span>${subcat.subcategoryName}</span>
							</label>`
									: `<div class="list-group-item list-group-item-action"><span>${subcat.subcategoryName}</span></div>`
							}
							</div>
						</div>
						`;
					}
				}
			}
		}
		return html;
	}

	#updateActiveStates() {
		// Categories
		const categoryElements =
			this.#args.target.querySelectorAll('[data-id]');
		categoryElements.forEach((el) => {
			const catId = parseInt(el.dataset.id);
			const listItem = el.querySelector('.list-group-item') || el;
			if (this.#selectedCat.includes(catId)) {
				listItem.classList.add('active');
			} else {
				listItem.classList.remove('active');
			}
		});

		// Subcategories
		const subcatElements =
			this.#args.target.querySelectorAll('[data-subcat-id]');
		subcatElements.forEach((el) => {
			const subcatId = parseInt(el.dataset.subcatId);

			if (this.#args.checkbox) {
				const checkbox = el.querySelector('input[type="checkbox"]');
				if (checkbox) {
					checkbox.checked = this.#selectedSubCat.includes(subcatId);
				}
			} else {
				const listItem = el.querySelector('.list-group-item') || el;
				if (this.#selectedSubCat.includes(subcatId)) {
					listItem.classList.add('active');
				} else {
					listItem.classList.remove('active');
				}
			}
		});
	}
}
