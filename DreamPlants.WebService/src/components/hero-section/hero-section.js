import ComponentHTML from './hero-section.html';

export default class HeroSection {
	constructor(args) {
		args.target.innerHTML = ComponentHTML;
        
	}
}
