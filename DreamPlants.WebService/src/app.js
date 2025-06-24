import NavigationBar from './components/navigation-bar/navigation-bar';
import FooterSection from './components/footer-section/footer-section';

import PageLogin from './page-login';
import PageHome from './page-home';
import PageProducts from './page-products';
import PageProductDetail from './page-product-detail';
import PageCategoryDetail from './page-category-detail';
import PageShopCart from './page-shopcart';
import PageUserDetail from './page-user-detail';
import PageUserOrderHistory from './page-user-order-history';
import PageUsersManagement from './page-users-management';
import PageSummary from './page-summary';
import PageAllProducts from './page-all-products';
import PageIndividualProduct from './page-individual-product';

export default class Application {
	//=========================================================================================
	// Private Variables
	//=========================================================================================

	#header = null;
	#main = null;
	#footer = null;
	#apiUrl = 'http://localhost:5075';
	#user = null;
	#loggedIn = null;
	//-----------------------------------------------------------------------------------------
	//-----------------------------------------------------------------------------------------

	//=========================================================================================
	// Constructor
	//=========================================================================================

	constructor() {
		// Main Elements of WebPage
		this.#header = document.querySelector('header');
		this.#main = document.querySelector('main');
		this.#footer = document.querySelector('footer');
		this.#loggedIn = document.cookie.includes('LoginToken');
		// DEV

		if ('serviceWorker' in navigator) {
			window.addEventListener('load', () => {
				navigator.serviceWorker
					.register('service-worker.js')
					.then((reg) =>
						console.log('Service Worker registered', reg)
					)
					.catch((err) =>
						console.error('Service Worker error:', err)
					);
			});
		}

		//=========================================================================================
		// Event
		//=========================================================================================
		// Events to change content of page accoding to popstate.
		window.addEventListener('hashchange', () => {
			this.#navigate(location.hash);
		});
		//-----------------------------------------------------------------------------------------
		//-----------------------------------------------------------------------------------------

		//=========================================================================================
		// Init
		//=========================================================================================

		// If user loged in check if LoginToken cookie matches the one in databank.
		if (document.cookie && document.cookie.startsWith('LoginToken=')) {
			this.apiGet(
				(r) => {
					this.#user = r;
					this.#navigate(location.hash);
				},
				(ex) => {
					console.error(ex); // for dev only
					this.#navigate('#login');
				},
				'/page/init'
			);
		} else {
			this.#navigate(location.hash);
		}

		// Light/Dark Mode
		if (!localStorage.getItem('dreamPlantsTheme')) {
			localStorage.setItem('dreamPlantsTheme', 'light');
		}
		const curentThemeStorage = localStorage.getItem('dreamPlantsTheme');
		if (curentThemeStorage) {
			document.documentElement.setAttribute(
				'data-bs-theme',
				curentThemeStorage
			);
		}
		//-----------------------------------------------------------------------------------------
		//-----------------------------------------------------------------------------------------
	}
	//=========================================================================================
	// User Properties for later use.
	//=========================================================================================

	get user() {
		return this.#user;
	}

	set user(v) {
		this.#user = v;
	}

	//-----------------------------------------------------------------------------------------
	//-----------------------------------------------------------------------------------------

	//=========================================================================================
	// Private Methods
	//=========================================================================================

	#navigate(completeHash) {
		this.#main.innerHTML = '';

		new NavigationBar({
			target: this.#header,
			app: this,
		});

		const args = {
			target: this.#main,
			app: this,
		};

		const hashParts = completeHash.split('?');
		let hash = completeHash;
		if (hashParts.length > 1) {
			hash = hashParts[0];
			const usp = new URLSearchParams(hashParts[1]);
			for (const [key, value] of usp) args[key] = value;
		}

		switch (hash) {
			case '#home':
				new PageHome(args);
				break;
			case '#shopcart':
				new PageShopCart(args);
				break;
			case '#product-detail':
				new PageProductDetail(args);
				break;
			case '#individual-product':
				new PageIndividualProduct(args);
				break;
			case '#login':
				if (document.cookie.includes('LoginToken')) new PageHome(args);
				else new PageLogin(args);
				break;
			case '#user-profile':
				if (document.cookie.includes('LoginToken'))
					new PageUserDetail(args);
				else window.open('#login', '_self');
				break;
			case '#user-order-history':
				if (document.cookie.includes('LoginToken')) {
					new PageUserOrderHistory(args);
				} else window.open('#login', '_self');
				break;
			case '#users-management':
				if (this.#hasToken() && this.#hasRole([1, 2]))
					new PageUsersManagement(args);
				else window.open('#login', '_self');
				break;
			case '#categories':
				if (this.#hasToken() && this.#hasRole([1, 2]))
					new PageCategoryDetail(args);
				else window.open('#login', '_self');
				break;
			case '#products':
				if (this.#hasToken() && this.#hasRole([1, 2]))
					new PageProducts(args);
				else window.open('#login', '_self');
				break;
			case '#user-summary':
				if (this.#hasToken() && this.#hasRole([1]))
					new PageSummary(args);
				else window.open('#login', '_self');
				break;
			case '#all-products':
				new PageAllProducts(args);
				break;
			default:
				new PageHome(args);
				break;
		}

		new FooterSection({
			target: this.#footer,
			app: this,
		});
	}

	//-----------------------------------------------------------------------------------------
	//-----------------------------------------------------------------------------------------

	//=========================================================================================
	// Api Calls
	//=========================================================================================

	apiGet(successCallback, errorCallback, url) {
		fetch(this.#apiUrl + url, {
			method: 'GET',
			cache: 'no-cache',
			credentials: 'include',
		})
			.then((r) => {
				if (r.status == 200) return r.json();
				throw new Error(r.status + ' ' + r.statusText);
			})
			.then(successCallback)
			.catch(errorCallback);
	}

	apiLogin(successCallback, errorCallback, loginData) {
		fetch(this.#apiUrl + '/Users/Login', {
			method: 'POST',
			body: loginData,
			cache: 'no-cache',
			credentials: 'include',
		})
			.then((r) => {
				if (r.status == 200 || r.status == 401) {
					return r.json();
				} else {
					throw new Error(r.status + ' ' + r.statusText);
				}
			})
			.then(successCallback)
			.catch(errorCallback);
	}

	apiLogout(successCallback, errorCallback) {
		fetch(this.#apiUrl + '/Users/Logout', {
			method: 'POST', // POST? or DEL?
			cache: 'no-cache',
			credentials: 'include',
		})
			.then((r) => {
				if (r.status == 200 || r.status == 401) {
					return r.json();
				} else {
					throw new Error(r.status + ' ' + r.statusText);
				}
			})
			.then(successCallback)
			.catch(errorCallback);
	}

	apiRegister(successCallback, errorCallback, registerData) {
		fetch(this.#apiUrl + '/Users/Register', {
			method: 'POST',
			body: registerData,
			cache: 'no-cache',
			credentials: 'include',
		})
			.then((r) => {
				if (r.status == 200 || r.status == 401) {
					return r.json();
				} else {
					throw new Error(r.status + ' ' + r.statusText);
				}
			})
			.then(successCallback)
			.catch(errorCallback);
	}

	apiValidatePassword(successCallback, errorCallback, formData) {
		fetch(this.#apiUrl + '/Users/ValidatePassword', {
			method: 'POST',
			body: formData,
			credentials: 'include',
		})
			.then((r) => {
				if (!r.ok) throw new Error('Status: ' + r.status);
				return r.json();
			})
			.then(successCallback)
			.catch(errorCallback);
	}

	apiUpdateUser(successCallback, errorCallback, formData) {
		fetch(this.#apiUrl + '/Users/UpdateUser', {
			method: 'PUT', // I changed to put in DataBase if it doesnt work go back to POST
			body: formData,
			cache: 'no-cache',
			credentials: 'include',
		})
			.then((r) => {
				if (r.status == 200 || r.status == 401) {
					return r.json();
				} else {
					throw new Error(r.status + ' ' + r.statusText);
				}
			})
			.then(successCallback)
			.catch(errorCallback);
	}

	apiUploadPicture(successCallback, errorCallback, formData) {
		fetch(this.#apiUrl + '/Users/UploadPicture', {
			method: 'POST', // I changed to put in DataBase if it doesnt work go back to POST
			body: formData,
			cache: 'no-cache',
			credentials: 'include',
		})
			.then((r) => {
				if (r.status == 200 || r.status == 401) {
					return r.json();
				} else {
					throw new Error(r.status + ' ' + r.statusText);
				}
			})
			.then(successCallback)
			.catch(errorCallback);
	}

	apiGetAddresses(successCallback, errorCallback) {
		fetch(this.#apiUrl + '/Address/GetAddresses', {
			method: 'GET',
			cache: 'no-cache',
			credentials: 'include',
		})
			.then((r) => {
				if (r.status == 200) return r.json();
				throw new Error(r.status + ' ' + r.statusText);
			})
			.then(successCallback)
			.catch(errorCallback);
	}

	apiNewAddress(successCallback, errorCallback, formData) {
		fetch(this.#apiUrl + '/Address/NewAddress', {
			method: 'POST',
			body: formData,
			cache: 'no-cache',
			credentials: 'include',
		})
			.then((r) => {
				if (r.status == 200 || r.status == 401) {
					return r.json();
				} else {
					throw new Error(r.status + ' ' + r.statusText);
				}
			})
			.then(successCallback)
			.catch(errorCallback);
	}

	apiDelAddress(successCallback, errorCallback, id) {
		fetch(this.#apiUrl + `/Address/DelAddress/${id}`, {
			method: 'DELETE',
			cache: 'no-cache',
			credentials: 'include',
		})
			.then((r) => {
				if (r.status == 200 || r.status == 401) {
					return r.json();
				} else {
					throw new Error(r.status + ' ' + r.statusText);
				}
			})
			.then(successCallback)
			.catch(errorCallback);
	}

	apiGetCards(successCallback, errorCallback) {
		fetch(this.#apiUrl + '/CreditCards/GetCards', {
			method: 'GET',
			cache: 'no-cache',
			credentials: 'include',
		})
			.then((r) => {
				if (r.status == 200) return r.json();
				throw new Error(r.status + ' ' + r.statusText);
			})
			.then(successCallback)
			.catch(errorCallback);
	}

	apiNewCard(successCallback, errorCallback, formData) {
		fetch(this.#apiUrl + '/CreditCards/NewCard', {
			method: 'POST',
			body: formData,
			cache: 'no-cache',
			credentials: 'include',
		})
			.then((r) => {
				if (r.status == 200 || r.status == 401) {
					return r.json();
				} else {
					throw new Error(r.status + ' ' + r.statusText);
				}
			})
			.then(successCallback)
			.catch(errorCallback);
	}

	apiDelCard(successCallback, errorCallback, id) {
		fetch(this.#apiUrl + `/CreditCards/DelCard/${id}`, {
			method: 'DELETE',
			cache: 'no-cache',
			credentials: 'include',
		})
			.then((r) => {
				if (r.status == 200 || r.status == 401) {
					return r.json();
				} else {
					throw new Error(r.status + ' ' + r.statusText);
				}
			})
			.then(successCallback)
			.catch(errorCallback);
	}

	// UNIVERSAL ADD?
	apiNewSomethingPOST(successCallback, errorCallback, url, data) {
		fetch(this.#apiUrl + '/' + url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
			cache: 'no-cache',
			credentials: 'include',
		})
			.then((r) => {
				if (r.status == 200 || r.status == 401) {
					return r.json();
				} else {
					throw new Error(r.status + ' ' + r.statusText);
				}
			})
			.then(successCallback)
			.catch(errorCallback);
	}
	apiDeleteSomething(successCallback, errorCallback, url) {
		fetch(this.#apiUrl + '/' + url, {
			method: 'DELETE',
			cache: 'no-cache',
			credentials: 'include',
		})
			.then((r) => {
				if (r.status === 200 || r.status === 401) return r.json();
				else throw new Error(r.status + ' ' + r.statusText);
			})
			.then(successCallback)
			.catch(errorCallback);
	}

	// DEV

	//-----------------------------------------------------------------------------------------
	//-----------------------------------------------------------------------------------------

	//=========================================================================================
	// Helper Methods
	//=========================================================================================
	#hasToken() {
		return document.cookie.includes('LoginToken');
	}

	#hasRole(allowedRoles) {
		return this.#user && allowedRoles.includes(this.#user.roleId);
	}

	//-----------------------------------------------------------------------------------------
	//-----------------------------------------------------------------------------------------
} // Class
