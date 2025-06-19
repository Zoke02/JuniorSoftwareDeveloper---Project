import PageHTML from './page-summary.html';

export default class PageSummary {
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
