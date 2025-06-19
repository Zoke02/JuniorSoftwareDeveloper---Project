import PageHTML from './page-category-detail.html';

export default class PageCategoryDetail {
	//--------------------------------------------------
	// Private Variables
	//--------------------------------------------------
	#args = null;

	//--------------------------------------------------
	// Constructor
	//--------------------------------------------------
	constructor(args) {
		this.#args = args;
		args.target.innerHTML = PageHTML;

		this.#args.target.addEventListener('click', (e) => {
			const actionEl = e.target.closest('[data-action]');
			const collapseTrigger = e.target.closest(
				'[data-bs-toggle="collapse"]'
			);

			// Handle icon button actions (delete, add, rename)
			if (actionEl) {
				const action = actionEl.dataset.action;
				const dataId = actionEl.dataset.id;

				switch (action) {
					case 'add-cat':
						console.log('Add new category');
						break;
					case 'delete-cat':
						console.log(`Delete category with ID: ${dataId}`);
						break;
					case 'delete-subcat':
						console.log(`Delete subcategory with ID: ${dataId}`);
						break;
					case 'add-subcat':
						console.log(
							`Add subcategory to category ID: ${dataId}`
						);
						break;
					case 'rename-cat':
						console.log(`Rename category ID: ${dataId}`);
						break;
					case 'rename-subcat':
						console.log(`Rename subcategory ID: ${dataId}`);
						break;
				}

				// Do NOT trigger collapse if an icon was clicked
				e.stopPropagation();
				return;
			}

			// Handle collapse toggle icon switching
			if (collapseTrigger) {
				const icon = collapseTrigger.querySelector('i');
				if (icon) {
					icon.classList.toggle('bi-caret-up-square');
					icon.classList.toggle('bi-caret-down-square');
				}
			}
		});
	}
}
