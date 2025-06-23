import HTML from './category-tree.html';

export default class CategoryTree {
	#args = null;
	#categoriesList = null;
	#selectedCat = [];
	#selectedSubCat = [];
	#singleSelect = false;

	constructor(args) {
		this.#args = args;
		this.#args.target.innerHTML = HTML;
		this.#singleSelect = !!this.#args.singleSelect;

		this.#setupEvents();
	}

	get categoriesList() {
		return this.#categoriesList;
	}

	set categoriesList(list) {
		this.#categoriesList = list;
		this.#renderTree();
	}

	get selectedCat() {
		return this.#selectedCat;
	}

	set selectedCat(value) {
		this.#selectedCat = value;
		this.#updateUI();
	}

	get selectedSubCat() {
		return this.#selectedSubCat;
	}

	set selectedSubCat(value) {
		this.#selectedSubCat = value;
		this.#updateUI();
	}

	#setupEvents() {
		this.#args.target.addEventListener('click', (e) => {
			const caretToggle = e.target.closest(
				'a[data-bs-toggle="collapse"]'
			);
			if (caretToggle) {
				const icon = caretToggle.querySelector('i');
				if (icon) {
					icon.classList.toggle('bi-caret-up-square');
					icon.classList.toggle('bi-caret-down-square');
				}
			}

			const catEl = e.target.closest('[data-id]');
			const subcatEl = e.target.closest('[data-subcat-id]');

			if (catEl) {
				const id = parseInt(catEl.dataset.id);
				this.#handleCatClick(id);
			}

			if (subcatEl && !e.target.matches('input[type="checkbox"]')) {
				const id = parseInt(subcatEl.dataset.subcatId);
				this.#handleSubcatClick(id);
			}

			this.#updateUI();

			if (typeof this.#args.click === 'function') {
				this.#args.click();
			}
		});
	}

	#handleCatClick(id) {
		if (!this.#selectedCat.includes(id)) {
			this.#selectedCat.push(id);
		} else {
			this.#selectedCat = this.#selectedCat.filter((x) => x !== id);
		}
	}

	#handleSubcatClick(id) {
		if (this.#singleSelect) {
			this.#selectedSubCat = [id];
		} else {
			if (!this.#selectedSubCat.includes(id)) {
				this.#selectedSubCat.push(id);
			} else {
				this.#selectedSubCat = this.#selectedSubCat.filter(
					(x) => x !== id
				);
			}
		}
	}

	#renderTree() {
		const container = this.#args.target.querySelector('#containerCategory');
		if (!this.#categoriesList) return;

		let html = '';

		for (const cat of this.#categoriesList) {
			const catId = cat.categoryId;
			const expanded = this.#selectedCat.includes(catId);

			html += `
				<a class="list-group-item list-group-item-action ps-2 ${
					expanded ? 'active' : ''
				}"
					data-bs-toggle="collapse"
					data-id="${catId}"
					href="#collapseCat${catId}">
					<i class="bi ${
						expanded ? 'bi-caret-down-square' : 'bi-caret-up-square'
					} pe-2"></i>
					${cat.categoryName}
				</a>
				<div class="collapse multi-collapse ${
					expanded ? 'show' : ''
				}" id="collapseCat${catId}">
			`;

			for (const subcat of cat.subcategories || []) {
				if (this.#args.checkbox) {
					html += `
						<div class="row ps-4 pe-3 " data-subcat-id="${subcat.subcategoryId}">
							<label class="list-group-item list-group-item-action">
								<input class="form-check-input me-2" type="checkbox"
									   id="checkbox_${subcat.subcategoryId}"
									   data-cat-id="${catId}" />
								<span>${subcat.subcategoryName}</span>
							</label>
						</div>
					`;
				} else {
					html += `
						<div class="list-group-item list-group-item-action ps-4"
							 data-subcat-id="${subcat.subcategoryId}">
							<span>${subcat.subcategoryName}</span>
						</div>
					`;
				}
			}

			html += `</div>`;
		}

		container.innerHTML = html;
		this.#updateUI();
	}

	#updateUI() {
		// Category toggle and highlight
		const catEls = this.#args.target.querySelectorAll('[data-id]');
		for (const el of catEls) {
			const id = parseInt(el.dataset.id);
			const isActive = this.#selectedCat.includes(id);
			el.classList.toggle('active', isActive);

			const collapse = this.#args.target.querySelector(
				`#collapseCat${id}`
			);
			if (collapse) collapse.classList.toggle('show', isActive);

			const icon = el.querySelector('i');
			if (icon) {
				icon.classList.toggle('bi-caret-down-square', isActive);
				icon.classList.toggle('bi-caret-up-square', !isActive);
			}
		}

		// Subcategory toggle and checkbox sync
		const subEls = this.#args.target.querySelectorAll('[data-subcat-id]');
		for (const el of subEls) {
			const id = parseInt(el.dataset.subcatId);
			const isSelected = this.#selectedSubCat.includes(id);

			if (this.#args.checkbox) {
				const checkbox = el.querySelector('input[type="checkbox"]');
				if (checkbox) checkbox.checked = isSelected;

				const label = el.querySelector('label');
				if (label) label.classList.toggle('active', isSelected);
			} else {
				el.classList.toggle('active', isSelected);
			}
		}
	}
}
