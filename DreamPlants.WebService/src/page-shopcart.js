import PageHTML from './page-shopcart.html';

export default class PageShopCart {
	//--------------------------------------------------
	// Private Variables
	//--------------------------------------------------

	#args = null;
	#cart = null;

	//--------------------------------------------------
	// Constructor
	//--------------------------------------------------
	constructor(args) {
		this.#args = args;
		args.target.innerHTML = PageHTML;
	}
}
