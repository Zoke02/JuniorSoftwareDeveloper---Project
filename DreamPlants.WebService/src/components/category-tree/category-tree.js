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
		// Event Listeners
		//--------------------------------------------------

		// Toggle caret icon on collapse
		this.#args.target.addEventListener('click', (e) => {
			const toggle = e.target.closest('a[data-bs-toggle="collapse"]');
			if (toggle) {
				const icon = toggle.querySelector('i');
				if (icon) {
					icon.classList.toggle('bi-caret-up-square');
					icon.classList.toggle('bi-caret-down-square');
				}
			}
		});

		// Handle category/subcategory selection
		this.#args.target.addEventListener('click', (e) => {
			const category = e.target.closest('[data-id]');
			const subcategory = e.target.closest('[data-subcat-id]');

			if (category) {
				const catId = parseInt(category.dataset.id);
				const index = this.#selectedCat.indexOf(catId);

				if (index === -1) {
					this.#selectedCat.push(catId);
				} else {
					this.#selectedCat.splice(index, 1);
				}
			}

			if (subcategory && !e.target.matches('input[type="checkbox"]')) {
				const subcatId = parseInt(subcategory.dataset.subcatId);
				const index = this.#selectedSubCat.indexOf(subcatId);

				if (index === -1) {
					if (this.#singleSelect) {
						this.#selectedSubCat = [subcatId];
					} else {
						this.#selectedSubCat.push(subcatId);
					}
				} else {
					this.#selectedSubCat.splice(index, 1);
				}
			}

			this.#updateActiveStates();

			if (typeof this.#args.click === 'function') {
				this.#args.click();
			}
		});
	}

	//--------------------------------------------------
	// Getters / Setters
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
		this.#updateActiveStates();
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
		const container = this.#args.target.querySelector('#containerCategory');
		container.innerHTML = this.#createTree();
		this.#updateActiveStates(); // Update UI after rendering
	}

	#createTree() {
		let html = '';

		if (!this.#categoriesList) return html;

		for (const cat of this.#categoriesList) {
			const catId = cat.categoryId;
			const isExpanded = this.#selectedCat.includes(catId);

			// Category button
			html += `
				<a class="list-group-item list-group-item-action ps-2 ${
					isExpanded ? 'active' : ''
				}"
					data-bs-toggle="collapse"
					data-id="${catId}"
					href="#collapseCat${catId}"
					role="button"
					aria-expanded="${isExpanded}"
					aria-controls="collapseCat${catId}">
					<i class="bi ${
						isExpanded
							? 'bi-caret-down-square'
							: 'bi-caret-up-square'
					} pe-2"></i>
					${cat.categoryName}
				</a>
			`;

			// Subcategory wrapper
			html += `
				<div class="collapse multi-collapse ${
					isExpanded ? 'show' : ''
				}" id="collapseCat${catId}">
			`;

			// Subcategory list
			for (const subcat of cat.subcategories || []) {
				html += `
					<div class="row ps-3" data-subcat-id="${subcat.subcategoryId}">
						${
							this.#args.checkbox
								? `<label class="list-group-item list-group-item-action">
										<input class="form-check-input" type="checkbox"
											id="checkbox_${subcat.subcategoryId}"
											data-cat-id="${cat.categoryId}"
											>
										<span>${subcat.subcategoryName}</span>
									</label>`
								: `<div class="list-group-item list-group-item-action">
										<span>${subcat.subcategoryName}</span>
									</div>`
						}
					</div>
				`;
			}

			html += `</div>`; // close collapse
		}

		return html;
	}

	#updateActiveStates() {
		// Category highlight and expansion
		const categoryEls = this.#args.target.querySelectorAll('[data-id]');
		categoryEls.forEach((el) => {
			const catId = parseInt(el.dataset.id);
			const collapse = this.#args.target.querySelector(
				`#collapseCat${catId}`
			);

			const icon = el.querySelector('i');

			if (this.#selectedCat.includes(catId)) {
				el.classList.add('active');
				if (collapse) collapse.classList.add('show');
				if (icon) {
					icon.classList.remove('bi-caret-up-square');
					icon.classList.add('bi-caret-down-square');
				}
			} else {
				el.classList.remove('active');
				if (collapse) collapse.classList.remove('show');
				if (icon) {
					icon.classList.remove('bi-caret-down-square');
					icon.classList.add('bi-caret-up-square');
				}
			}
		});

		// Subcategory checkbox and highlight
		const subcatEls =
			this.#args.target.querySelectorAll('[data-subcat-id]');
		subcatEls.forEach((el) => {
			const subcatId = parseInt(el.dataset.subcatId);
			const isSelected = this.#selectedSubCat.includes(subcatId);

			if (this.#args.checkbox) {
				const checkbox = el.querySelector('input[type="checkbox"]');
				if (checkbox) checkbox.checked = isSelected;
			} else {
				if (isSelected) {
					el.classList.add('active');
				} else {
					el.classList.remove('active');
				}
			}
		});
	}
}
