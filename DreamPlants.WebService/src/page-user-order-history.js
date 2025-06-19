import PageHTML from './page-user-order-history.html';

export default class PageUserOrderHistory {
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
