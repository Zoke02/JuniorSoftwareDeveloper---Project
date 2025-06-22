import ComponentHTML from './plant-care-section.html';

export default class PlantCareSection {
	constructor(args) {
		args.target.innerHTML = ComponentHTML;

		const shippingPriceChange = args.target.querySelector(
			'#shippingPriceChange'
		);
		if (!shippingPriceChange) {
			console.warn('#shippingPriceChange not found in DOM');
			return;
		}

		args.app.apiGet(
			(response) => {
				if (
					!response.success ||
					!response.dto ||
					response.dto.shippingFree == null
				) {
					shippingPriceChange.innerHTML = 'Check our Contact';
					return;
				}
				shippingPriceChange.innerHTML = `${parseFloat(
					response.dto.shippingFree
				)} €`;
			},
			(err) => {
				console.warn('Failed to load shopcart pricing:', err);
				shippingPriceChange.innerHTML = 'Check our Contact';
			},
			'/page/shopcart/pricing'
		);
	}
}
