import PageHTML from './page-user-detail.html';
import * as bootstrap from 'bootstrap';

export default class PageUserDetail {
	#args = null;
	#newPassword = '';

	#inputFirstName = '';
	#inputLastName = '';
	#inputEmail = '';
	#inputPhone = '';
	#avatarImage = '';

	#adresses = [];
	#cards = [];

	//DEV
	#image64Bit = '';
	#imageType = '';

	constructor(args) {
		this.#args = args;
		args.target.innerHTML = PageHTML;

		const inputFirstName = document.querySelector('#inputFirstName');
		const inputLastName = document.querySelector('#inputLastName');
		const inputPhone = document.querySelector('#inputPhone');
		const inputEmail = document.querySelector('#inputEmail');
		const savePersonalInfo = document.querySelector('#savePersonalInfo');
		const saveDeliveryAdress = document.querySelector(
			'#saveDeliveryAdress'
		);
		const saveCard = document.querySelector('#saveCard');

		this.#inputFirstName = inputFirstName;
		this.#inputLastName = inputLastName;
		this.#inputEmail = inputEmail;
		this.#inputPhone = inputPhone;

		// Toastie
		const toastLiveExample = document.getElementById('liveToast');
		const toastTitle = document.getElementById('toastTitle');
		const toastBody = document.getElementById('toastBody');

		// LiveReplace
		const cardExpiry = document.getElementById('cardExpiry');
		const cardNumber = document.getElementById('cardNumber');
		const cardCVV = document.getElementById('cardCVV');

		// ------------------------------
		// DEV
		// ------------------------------

		const avatarButton = document.getElementById('avatarButton');
		const avatarImage = document.getElementById('avatarImage');
		this.#avatarImage = avatarImage;
		const avatarFileInput = document.getElementById('avatarFileInput');

		avatarButton.addEventListener('click', () => {
			avatarFileInput.click();
		});

		avatarFileInput.addEventListener('change', (e) => {
			const file = e.target.files[0];
			if (!file) return;

			if (!file.type.match(/^image\/(jpeg|png)$/)) {
				alert('Only JPG and PNG files are allowed.');
				return;
			}

			const reader = new FileReader();
			reader.onload = function (e) {
				const result = e.target.result;
				avatarImage.src = result;

				// Extract data
				const userAvatarBase64 = result.split(',')[1]; // Raw base64
				const extension = file.name.split('.').pop().toLowerCase(); // "png" or "jpeg"

				// Save to private vars
				this.#image64Bit = userAvatarBase64;
				this.#imageType = extension;

				// Upload AFTER data is ready
				const formData = new FormData();
				formData.append('image64Bit', this.#image64Bit);
				formData.append('imageType', this.#imageType);

				this.#args.app.apiUploadPicture(
					(successCallback) => {
						if (successCallback.success) {
							toastTitle.innerText = 'User Profile';
							toastBody.innerText = successCallback.message;
							const toastBootstrap =
								bootstrap.Toast.getOrCreateInstance(
									toastLiveExample
								);
							toastBootstrap.show();
							//  refresh user data here?
						}
					},
					(errorCallback) => {
						console.error('API error:', errorCallback);
					},
					formData
				);
			}.bind(this); // bind 'this' so private fields work

			reader.readAsDataURL(file);
		});

		// ------------------------------
		// ------------------------------

		['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
			avatarImage.addEventListener(eventName, (e) => {
				e.preventDefault();
				e.stopPropagation();
			});
		});

		avatarImage.addEventListener('dragover', () => {
			avatarImage.classList.add('border', 'border-primary');
		});

		avatarImage.addEventListener('dragleave', () => {
			avatarImage.classList.remove('border', 'border-primary');
		});

		avatarImage.addEventListener('drop', (e) => {
			e.preventDefault();
			avatarImage.classList.remove('border', 'border-primary');

			const file = e.dataTransfer.files[0];
			if (!file) return;

			if (!file.type.match(/^image\/(jpeg|png)$/)) {
				alert('Only JPG and PNG files are allowed.');
				return;
			}

			const reader = new FileReader();
			reader.onload = function (e) {
				const result = e.target.result;
				avatarImage.src = result;

				// Extract and store image data
				const base64 = result.split(',')[1];
				const extension = file.name.split('.').pop().toLowerCase(); // "png" or "jpeg"

				this.#image64Bit = base64;
				this.#imageType = extension;

				// Upload AFTER data is ready
				const formData = new FormData();
				formData.append('image64Bit', this.#image64Bit);
				formData.append('imageType', this.#imageType);

				this.#args.app.apiUploadPicture(
					(successCallback) => {
						if (successCallback.success) {
							toastTitle.innerText = 'User Profile';
							toastBody.innerText = successCallback.message;
							const toastBootstrap =
								bootstrap.Toast.getOrCreateInstance(
									toastLiveExample
								);
							toastBootstrap.show();
							//  refresh user data here?
						}
					},
					(errorCallback) => {
						console.error('API error:', errorCallback);
					},
					formData
				);
			}.bind(this); //

			reader.readAsDataURL(file);
		});

		// ------------------------------
		// ------------------------------
		// DEV
		// ------------------------------
		// ------------------------------

		// Get User Data - INITIAL INSERT
		// ------------------------------
		this.#refreshUserFields();
		// Handle User Data
		document.addEventListener('click', (e) => {
			const buttonEdit = e.target.closest('button[data-field]');
			if (!buttonEdit) return;

			const field = buttonEdit.dataset.field;

			switch (field) {
				case 'firstname': {
					this.#setupEditModal(
						'firstname',
						inputFirstName.value,
						(val) => {
							inputFirstName.value = val.trim();
						}
					);
					break;
				}

				case 'lastname': {
					this.#setupEditModal(
						'lastname',
						inputLastName.value,
						(val) => {
							inputLastName.value = val.trim();
						}
					);
					break;
				}

				case 'email':
					this.#setupEditModal('email', inputEmail.value, (val) => {
						inputEmail.value = val.trim();
					});
					break;

				case 'phone':
					this.#setupEditModal('phone', inputPhone.value, (val) => {
						inputPhone.value = val.trim();
					});
					break;

				case 'password':
					this.#setupEditModal(
						'password',
						['', '', ''],
						(oldPass, newPass, confirmPass, modal) => {
							if (!this.#validatePasswordModal()) return;
							if (newPass !== confirmPass) return;

							const passwordData = new FormData();
							passwordData.append('oldPassword', oldPass);

							this.#args.app.apiValidatePassword(
								(data) => {
									if (data.success) {
										this.#newPassword = newPass;

										document
											.getElementById('modalFirstInput')
											.classList.remove('is-invalid');

										document.activeElement.blur();
										setTimeout(() => modal.hide(), 50);
									} else {
										const oldPassInput =
											document.getElementById(
												'modalFirstInput'
											);
										oldPassInput.classList.add(
											'is-invalid'
										);
										oldPassInput.value = '';
										oldPassInput.placeholder =
											data.message || 'Invalid password';
									}
								},
								(err) => {
									console.error('API error:', err);
									alert('Something went wrong. Try again.');
								},
								passwordData
							);
						}
					);
					break;
			}
		});
		// Save User Data
		savePersonalInfo.addEventListener('click', () => {
			const personalInfoData = new FormData();
			// Toastie
			const toastBootstrap =
				bootstrap.Toast.getOrCreateInstance(toastLiveExample);

			if (this.#newPassword?.trim()) {
				personalInfoData.append(
					'newPassword',
					this.#newPassword.trim()
				);
			}

			personalInfoData.append('firstName', inputFirstName.value.trim());
			personalInfoData.append('lastName', inputLastName.value.trim());
			personalInfoData.append('phoneNumber', inputPhone.value.trim());
			personalInfoData.append('email', inputEmail.value.trim());

			this.#args.app.apiUpdateUser(
				(successCallback) => {
					if (successCallback.success) {
						// Scucess Code
						this.#args.app.user = successCallback.user;
						this.#newPassword = '';
						// Check if you need to actualize the fields
						this.#refreshUserFields();
						toastTitle.innerText = 'User Profile';
						toastBody.innerText = successCallback.message;
						toastBootstrap.show();
					}
				},
				(errorCallback) => {
					console.error('API error:', errorCallback);
				},
				personalInfoData
			);
		});

		// Get Delivery Data - INITIAL INSERT
		// ----------------------------------
		// Get Delivery Data
		this.#getAndInsertAddresses();
		this.#insertAddresses([]);
		// Save Delivery Data
		saveDeliveryAdress.addEventListener('click', () => {
			const fields = [
				'addressFirstName',
				'addressLastName',
				'addressStreet',
				'addressHouseNr',
				'addressDoor',
				'addressCity',
				'addressPostalCode',
			];

			let allValid = true;

			fields.forEach((id) => {
				const input = document.getElementById(id);
				input.classList.remove('is-invalid');
				if (!input.value.trim()) {
					input.classList.add('is-invalid');
					allValid = false;
				}
			});

			if (!allValid) {
				fields.forEach((id) => {
					const input = document.getElementById(id);
					input.placeholder = 'Field cannot be empty';
				});
				return;
			}

			// If all valid save.
			const addressInfoData = new FormData();
			const toastBootstrap =
				bootstrap.Toast.getOrCreateInstance(toastLiveExample);

			// DYNAMIC BABY!
			fields.forEach((id) => {
				const input = document.getElementById(id);
				addressInfoData.append(id, input.value.trim());
			});

			this.#args.app.apiNewAddress(
				(successCallback) => {
					if (successCallback.success) {
						// Sucsess Code
						toastTitle.innerText = 'Delivery Address';
						toastBody.innerText = successCallback.message;
						toastBootstrap.show();

						// Get Delivery Data
						this.#getAndInsertAddresses();
					}
				},
				(errorCallback) => {
					console.error('API error:', errorCallback);
				},
				addressInfoData
			);
		});
		// Del Delivery Data
		document.addEventListener('click', (e) => {
			if (!e.target.classList.contains('removeAddress')) return;
			const addressId = e.target.dataset.setId;
			const toastBootstrapDelete =
				bootstrap.Toast.getOrCreateInstance(toastLiveExample);

			this.#args.app.apiDelAddress(
				(successCallback) => {
					if (successCallback.success) {
						// Sucsess Code
						toastTitle.innerText = 'Delivery Address';
						toastBody.innerText = successCallback.message;
						toastBootstrapDelete.show();
						this.#getAndInsertAddresses();
						this.#insertAddresses([]);
					} else {
						console.warn('Delete failed:', successCallback.message);
					}
				},
				(errorCallback) => {
					console.error('API error:', errorCallback);
				},
				addressId
			);
		});

		// Get Card Data - INITIAL INSERT
		// ----------------------------------
		// Get Card Data
		this.#getAndInsertCards();
		this.#insertCards([]);

		// Handle Card
		cardNumber.addEventListener('input', (e) => {
			let val = e.target.value.replace(/\D/g, '');
			val = val.match(/.{1,4}/g)?.join(' ') || ''; // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match
			if (val.length > 19) {
				val = val.slice(0, 19); // Splice stops the number there. This works fine for visa and mastercard.
			}

			e.target.value = val;
		});
		cardExpiry.addEventListener('input', (e) => {
			let val = e.target.value.replace(/\D/g, ''); // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp
			if (val.length > 2) {
				val = val.slice(0, 2) + '/' + val.slice(2, 4);
			}
			e.target.value = val;
		});
		cardCVV.addEventListener('input', (e) => {
			let val = e.target.value.replace(/\D/g, ''); // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp
			if (val.length > 4) {
				val = val.slice(0, 4);
			}
			e.target.value = val;
		});
		// Save Card Data
		saveCard.addEventListener('click', () => {
			if (!this.#validateFieldsCard()) return;
			// If all valid save.
			const fields = [
				'cardholderName',
				'cardNumber',
				'cardExpiry',
				'cardCVV',
			];

			const creditCardInfoData = new FormData();
			const toastBootstrap =
				bootstrap.Toast.getOrCreateInstance(toastLiveExample);

			fields.forEach((id) => {
				const input = document.getElementById(id);
				creditCardInfoData.append(id, input.value.trim());
			});

			this.#args.app.apiNewCard(
				(successCallback) => {
					if (successCallback.success) {
						// Sucsess Code
						this.#cards = successCallback.creditCardsDTO;
						toastTitle.innerText = 'Credit Card';
						toastBody.innerText = successCallback.message;
						toastBootstrap.show();

						// Get Delivery Data
						this.#getAndInsertCards();
					}
				},
				(errorCallback) => {
					console.error('API error:', errorCallback);
				},
				creditCardInfoData
			);
		});
		// Del Card Data
		document.addEventListener('click', (e) => {
			if (!e.target.classList.contains('removeCard')) return;
			const cardId = e.target.dataset.setId;
			const toastBootstrapDelete =
				bootstrap.Toast.getOrCreateInstance(toastLiveExample);

			this.#args.app.apiDelCard(
				(successCallback) => {
					if (successCallback.success) {
						// Sucsess Code
						toastTitle.innerText = 'Credit Card';
						toastBody.innerText = successCallback.message;
						toastBootstrapDelete.show();
						this.#getAndInsertCards();
						this.#insertCards([]);
					} else {
						console.warn('Delete failed:', successCallback.message);
					}
				},
				(errorCallback) => {
					console.error('API error:', errorCallback);
				},
				cardId
			);
		});
	} // Constructor

	#setupEditModal(field, value, callback) {
		const modalEl = document.getElementById('modalEditFullName');
		const modal = new bootstrap.Modal(modalEl);
		const confirmBtn = document.getElementById('confirmEdit');

		const group1 = document.getElementById('modalGroup1');
		const group2 = document.getElementById('modalGroup2');
		const group3 = document.getElementById('modalGroup3');

		const firstInput = document.getElementById('modalFirstInput');
		const secondInput = document.getElementById('modalSecondInput');
		const thirdInput = document.getElementById('modalThirdInput');

		const firstLabel = document.getElementById('modalFirstLabel');
		const secondLabel = document.getElementById('modalSecondLabel');
		const thirdLabel = document.getElementById('modalThirdLabel');

		const togglePasswordVisibility = document.getElementById(
			'togglePasswordVisibility'
		);

		// Hide all groups initially
		group1.classList.add('d-none');
		group2.classList.add('d-none');
		group3.classList.add('d-none');
		togglePasswordVisibility.classList.add('d-none');

		// Reset validation state
		[firstInput, secondInput, thirdInput].forEach((input) => {
			input.classList.remove('is-invalid');
			input.placeholder = '';
		});

		const title = document.getElementById('modalEditTitle');

		if (field === 'firstname') {
			title.textContent = 'Edit First Name';
			firstInput.type = 'text';

			group1.classList.remove('d-none');
			firstLabel.textContent = 'First Name';
			firstInput.value = value;
		} else if (field === 'lastname') {
			title.textContent = 'Edit Last Name';
			firstInput.type = 'text';

			group1.classList.remove('d-none');
			firstLabel.textContent = 'Last Name';
			firstInput.value = value;
		} else if (field === 'email') {
			title.textContent = 'Edit Email';
			firstInput.type = 'text';

			group1.classList.remove('d-none');
			firstLabel.textContent = 'Email Address';
			firstInput.value = value;
		} else if (field === 'phone') {
			title.textContent = 'Edit Phone';
			firstInput.type = 'text';

			group1.classList.remove('d-none');
			firstLabel.textContent = 'Phone Number';

			firstInput.value = value;
		} else if (field === 'password') {
			title.textContent = 'Change Password';
			firstInput.type = 'password';
			secondInput.type = 'password';
			thirdInput.type = 'password';

			group1.classList.remove('d-none');
			group2.classList.remove('d-none');
			group3.classList.remove('d-none');
			togglePasswordVisibility.classList.remove('d-none');

			firstLabel.textContent = 'Current Password';
			secondLabel.textContent = 'New Password';
			thirdLabel.textContent = 'Confirm New Password';

			firstInput.value = '';
			secondInput.value = '';
			thirdInput.value = '';

			togglePasswordVisibility.onclick = () => {
				const isVisible = firstInput.type === 'text';
				firstInput.type = isVisible ? 'password' : 'text';
				togglePasswordVisibility.classList.toggle(
					'bi-eye-slash-fill',
					!isVisible
				);
				togglePasswordVisibility.classList.toggle(
					'bi-eye-fill',
					isVisible
				);
			};
		}

		const handleConfirm = () => {
			if (!this.#validateModalInputs(field)) return;

			if (
				field === 'firstname' ||
				field === 'lastname' ||
				field === 'email' ||
				field === 'phone'
			) {
				callback(firstInput.value);
			} else if (field === 'password') {
				callback(
					firstInput.value,
					secondInput.value,
					thirdInput.value,
					modal
				);
				return;
			}

			document.activeElement.blur();
			setTimeout(() => {
				modal.hide();
			}, 50);
		};

		confirmBtn.onclick = handleConfirm;

		modalEl.onkeydown = (e) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				handleConfirm();
			}
		};

		modal.show();
	}

	#validatePasswordModal() {
		const fields = [
			{ id: 'modalFirstInput', name: 'Current Password' },
			{ id: 'modalSecondInput', name: 'New Password' },
			{ id: 'modalThirdInput', name: 'Confirm New Password' },
		];

		let allValid = true;

		fields.forEach(({ id, name }) => {
			const input = document.getElementById(id);
			if (!input.value.trim()) {
				allValid = false;
				input.classList.add('is-invalid');
				input.placeholder = `Please enter ${name}`;
			} else {
				input.classList.remove('is-invalid');
			}
		});

		const newPass = document
			.getElementById('modalSecondInput')
			.value.trim();
		const confirmPass = document
			.getElementById('modalThirdInput')
			.value.trim();

		if (newPass && confirmPass && newPass !== confirmPass) {
			allValid = false;
			const confirmInput = document.getElementById('modalThirdInput');
			confirmInput.classList.add('is-invalid');
			confirmInput.value = '';
			confirmInput.placeholder = 'Passwords do not match';
		}

		return allValid;
	}

	#validateModalInputs(field) {
		let valid = true;
		const firstInput = document.getElementById('modalFirstInput');

		firstInput.classList.remove('is-invalid');

		if (field === 'firstname') {
			if (!firstInput.value.trim()) {
				firstInput.classList.add('is-invalid');
				firstInput.placeholder = 'Please enter First Name';
				valid = false;
			}
		} else if (field === 'lastname') {
			if (!firstInput.value.trim()) {
				firstInput.classList.add('is-invalid');
				firstInput.placeholder = 'Please enter Last Name';
				valid = false;
			}
		} else if (field === 'email') {
			if (!firstInput.value.trim()) {
				firstInput.classList.add('is-invalid');
				firstInput.placeholder = 'Please enter Email Address';
				valid = false;
			} else if (
				!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(firstInput.value.trim())
			) {
				firstInput.classList.add('is-invalid');
				firstInput.value = '';
				firstInput.placeholder = 'Invalid Mail Adress';
				valid = false;
			}
		} else if (field === 'phone') {
			if (!firstInput.value.trim()) {
				firstInput.classList.add('is-invalid');
				firstInput.placeholder = 'Please enter your Phone Number';
				valid = false;
			} else if (!/^\+?[0-9 ]{7,20}$/.test(firstInput.value.trim())) {
				firstInput.classList.add('is-invalid');
				firstInput.value = '';
				firstInput.placeholder =
					'Phone Number must only contain numbers';
				valid = false;
			}
		} else if (field === 'password') {
			return this.#validatePasswordModal();
		}

		return valid;
	}

	#refreshUserFields() {
		const user = this.#args.app.user;
		this.#inputFirstName.value = user.firstName;
		this.#inputLastName.value = user.lastName;
		this.#inputEmail.value = user.email;
		this.#inputPhone.value = user.phoneNumber;
		if (user.avatarBase64 && user.avatarFileType)
			this.#avatarImage.src = `data:image/${user.avatarFileType};base64,${user.avatarBase64}`;
	}

	// Adresses
	#getAndInsertAddresses() {
		this.#args.app.apiGetAddresses(
			(successCallback) => {
				if (successCallback.success) {
					// Scucess Code
					this.#adresses = successCallback.addressesDTO;
					this.#insertAddresses(this.#adresses);
				}
			},
			(errorCallback) => {
				console.error('API error:', errorCallback);
			}
		);
	}

	#insertAddresses(addresses) {
		const target = document.querySelector('#targetAddresses');
		let html = '';

		if (!addresses || addresses.length === 0) {
			target.innerHTML = `<div class="text-muted mb-3">No addresses saved.</div>`;
			return;
		}

		addresses.forEach((address) => {
			html += `
			<div class="d-flex align-items-center mb-3">
				<i
					class="bi bi-truck d-flex justify-content-center align-items-center h-100 me-3"
					style="font-size: 2.5rem"
				></i>
				<input
					type="text"
					class="form-control form-control-lg me-3"
					value="${address.firstName} ${address.lastName}: ${address.street} ${address.houseNr} / ${address.door} , ${address.postalCode} ${address.city}" 
					readonly
				/>
				<i class="btn btn-secondary bi bi-trash3 d-flex justify-content-center align-items-center border h-100 px-3 removeAddress"
				data-set-id="${address.addressId}"
				
				></i>			
			</div>
		`;
		});
		target.innerHTML = html;
	}

	// Cards
	#validateFieldsCard() {
		const fields = [
			'cardholderName',
			'cardNumber',
			'cardExpiry',
			'cardCVV',
		];

		let allValid = true;

		fields.forEach((id) => {
			const input = document.getElementById(id);
			input.classList.remove('is-invalid');

			if (!input.value.trim()) {
				input.classList.add('is-invalid');
				input.placeholder = 'Field cannot be empty';
				allValid = false;
			}

			if (id === 'cardExpiry') {
				const date = input.value.trim();
				const month = date.slice(0, 2);
				if (+month > 12 || +month < 1) {
					input.classList.add('is-invalid');
					input.setAttribute(
						'data-bs-content',
						+month > 12 ? 'Max Month: 12' : 'Min Month: 01'
					);
					const popover = bootstrap.Popover.getOrCreateInstance(
						input,
						{
							trigger: 'manual',
							placement: 'top',
						}
					);
					popover.show();
					setTimeout(() => popover.hide(), 1500);
					allValid = false;
				}
			}

			if (id === 'cardNumber') {
				const cardNumber = input.value.replace(/\s/g, '').trim();
				if (cardNumber.length < 13 || cardNumber.length > 19) {
					input.classList.add('is-invalid');
					input.setAttribute(
						'data-bs-content',
						'Must be 13–19 digits'
					);
					const popover = bootstrap.Popover.getOrCreateInstance(
						input,
						{
							trigger: 'manual',
							placement: 'top',
						}
					);
					popover.show();
					setTimeout(() => popover.hide(), 1500);
					allValid = false;
				}
			}

			if (
				id !== 'cardholderName' &&
				id !== 'cardExpiry' &&
				id !== 'cardNumber'
			) {
				if (!/^[0-9 ]+$/.test(input.value.trim())) {
					input.classList.add('is-invalid');
					input.setAttribute(
						'data-bs-content',
						'Only numbers allowed!'
					);
					const popover = bootstrap.Popover.getOrCreateInstance(
						input,
						{
							trigger: 'manual',
							placement: 'top',
						}
					);
					popover.show();
					setTimeout(() => popover.hide(), 1500);
					allValid = false;
				}
			}
		});
		return allValid;
	}

	#getAndInsertCards() {
		this.#args.app.apiGetCards(
			(successCallback) => {
				if (successCallback.success) {
					// Scucess Code
					this.#cards = successCallback.creditCardsDTO;
					this.#insertCards(this.#cards);
				}
			},
			(errorCallback) => {
				console.error('API error:', errorCallback);
			}
		);
	}

	#insertCards(cards) {
		const target = document.querySelector('#targetCards');
		let html = '';

		if (!cards || cards.length === 0) {
			target.innerHTML = `<div class="text-muted mb-3">No cards saved.</div>`;
			return;
		}

		cards.forEach((card) => {
			html += `
			<div class="d-flex align-items-center mb-3">
				<i
					class="bi bi-credit-card d-flex justify-content-center align-items-center h-100"
					style="font-size: 2.5rem"
				></i>
				<input
					type="text"
					class="form-control form-control-lg mx-3"
					value="**** **** **** ${card.cardNumberLastDigits}"
					readonly
				/>
				<i
					class="btn btn-secondary bi bi-trash3 d-flex justify-content-center align-items-center border h-100 px-3 removeCard"
					data-set-id="${card.cardId}"
				></i>
			</div>
		`;
		});
		target.innerHTML = html;
	}
}
