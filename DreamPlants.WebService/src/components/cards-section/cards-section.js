import ComponentHTML from './cards-section.html';

export default class CardsSection {
    constructor(args) {
        args.target.innerHTML = ComponentHTML;
        
    }
}
