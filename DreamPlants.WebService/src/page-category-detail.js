import PageHTML from './page-category-detail.html';

export default class PageCategoryDetail {
	//--------------------------------------------------
	// Private Variables
	//--------------------------------------------------
	#args = null;
	#actionLock = false; // DEV

	//--------------------------------------------------
	// Constructor
	//--------------------------------------------------
	constructor(args) {
		this.#args = args;
		args.target.innerHTML = PageHTML;

		// INIT
		this.#fetchCategories((categories) => {
			const container =
				this.#args.target.querySelector('#containerCategory');
			container.innerHTML = this.#renderCategoryTree(categories);
		});

		// EVENTS
		this.#args.target.addEventListener('click', (e) => {
			const icon = e.target.closest('i[data-action]');
			if (!icon) return;

			const action = icon.dataset.action;
			const id = parseInt(icon.dataset.id);

			if (this.#actionLock) return;
			this.#actionLock = true;

			switch (action) {
				case 'add-subcat':
					this.#promptAndAddSubcategory(id);
					break;
				case 'rename-cat':
					this.#promptAndRename('Category', 'Category/Rename', id);
					break;
				case 'rename-subcat':
					this.#promptAndRename(
						'Subcategory',
						'Category/Subcategory/Rename',
						id
					);
					break;
				case 'delete-cat':
					this.#confirmAndDelete('Category', `Category/Delete/${id}`);
					break;
				case 'delete-subcat':
					this.#confirmAndDelete(
						'Subcategory',
						`Category/Subcategory/Delete/${id}`
					);
					break;
			}

			setTimeout(() => {
				this.#actionLock = false;
			}, 300); // DEV
		});
	}

	#fetchCategories(callback) {
		this.#args.app.apiGet(
			(res) => {
				console.log(res.categoriesDTO);
				if (res.success && Array.isArray(res.categoriesDTO)) {
					callback(res.categoriesDTO);
				} else {
					console.error('Invalid category response:', res);
				}
			},
			(err) => {
				console.error('Failed to load categories:', err.message || err);
			},
			`/Category/List`
		);
	}

	#renderCategoryTree(categories) {
		let html = '';

		for (const cat of categories) {
			const collapseId = `multiCollapseCategorie${cat.categoryId}`;

			const subHtml = cat.subcategories
				.map(
					(sub) => `
			<div class="list-group-item d-flex justify-content-between align-items-center ps-4">
				<span>${sub.subcategoryName}</span>
				<div class="d-flex gap-2">
					<i class="bi bi-pencil border p-2" data-action="rename-subcat" data-id="${sub.subcategoryId}" title="Rename Subcategory"></i>
					<i class="bi bi-trash3 border p-2" data-action="delete-subcat" data-id="${sub.subcategoryId}" title="Delete Subcategory"></i>
				</div>
			</div>
		`
				)
				.join('');

			html += `
			<div class="list-group-item d-flex justify-content-between align-items-center">
				<div data-bs-target="#${collapseId}"
					 data-bs-toggle="collapse"
					 aria-expanded="false"
					 aria-controls="${collapseId}"
					 class="hover-effect text-decoration-none flex-grow-1 py-3">
					<i class="bi bi-caret-up-square pe-2"></i>${cat.categoryName}
				</div>
				<div class="d-flex gap-2 ms-2">
					<i class="bi bi-plus border p-2" data-action="add-subcat" data-id="${cat.categoryId}" title="Add Subcategory"></i>
					<i class="bi bi-pencil border p-2" data-action="rename-cat" data-id="${cat.categoryId}" title="Rename Category"></i>
					<i class="bi bi-trash3 border p-2" data-action="delete-cat" data-id="${cat.categoryId}" title="Delete Category"></i>
				</div>
			</div>

			<div class="collapse multi-collapse ps-3" id="${collapseId}">
				${subHtml}
			</div>
		`;
		}

		return html;
	}
	#promptAndRename(type, url, id) {
		const newName = prompt(`Enter new ${type} name:`)?.trim();
		if (!newName) return;

		this.#args.app.apiNewSomethingPOST(
			(res) => {
				if (res.success) this.#refreshCategoryList();
				else alert(res.message || `Failed to rename ${type}.`);
			},
			(err) => alert(err.message || `Error renaming ${type}.`),
			url,
			{ id, newName }
		);
	}
	#promptAndAddSubcategory(categoryId) {
		const name = prompt('Enter Sub-Category name:')?.trim();
		if (!name) return;

		this.#args.app.apiNewSomethingPOST(
			(res) => {
				if (res.success) this.#refreshCategoryList();
				else alert(res.message || 'Failed to add subcategory.');
			},
			(err) => alert(err.message || 'Error adding subcategory.'),
			'Category/Subcategory/Add',
			{ categoryId, name }
		);
	}
	#confirmAndDelete(type, url) {
		if (!confirm(`Delete this ${type}? This cannot be undone.`)) return;

		this.#args.app.apiDeleteSomething(
			(res) => {
				if (res.success) this.#refreshCategoryList();
				else alert(res.message || `Failed to delete ${type}.`);
			},
			(err) => alert(err.message || `Error deleting ${type}.`),
			url
		);
	}
	#refreshCategoryList() {
		this.#fetchCategories((categories) => {
			const container =
				this.#args.target.querySelector('#containerCategory');
			container.innerHTML = this.#renderCategoryTree(categories);
		});
	}
}
