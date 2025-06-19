import ComponentHTML from './plant-care-section.html';

export default class PlantCareSection {
	constructor(args) {
		args.target.innerHTML = ComponentHTML;
	}
}
