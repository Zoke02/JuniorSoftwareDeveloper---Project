import HeroSection from './components/hero-section/hero-section';
import CardsSection from './components/cards-section/cards-section';
import PlantCareSection from './components/plant-care-section/plant-care-section';

import PageHTML from './page-home.html';

export default class PageHome {
	constructor(args) {
		args.target.innerHTML = PageHTML;

		//--------------------------------------------------
		// Constants
		//--------------------------------------------------
		const heroSection = args.target.querySelector('#heroSection');
		const cardsSection = args.target.querySelector('#cardsSection');
		const plantCareSection = args.target.querySelector('#plantCareSection');
		//--------------------------------------------------
		// Init
		//--------------------------------------------------
		new HeroSection({
			target: heroSection,
		});
		new CardsSection({
			target: cardsSection,
		});
		new PlantCareSection({
			target: plantCareSection,
		});
	}
} // Class
