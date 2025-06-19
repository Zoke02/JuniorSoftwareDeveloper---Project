import ComponentHTML from './footer-section.html';

export default class FooterSection {
	constructor(args) {
		args.target.innerHTML = ComponentHTML;
	}
}
