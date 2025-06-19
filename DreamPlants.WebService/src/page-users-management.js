import PageHTML from './page-users-management.html';

export default class PageUsersManagement {
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
	}

	//--------------------------------------------------
	// Public Methods
	//--------------------------------------------------
}
