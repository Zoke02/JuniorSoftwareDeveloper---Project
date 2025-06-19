import PageHTML from './page-user-detail.html';
import * as bootstrap from 'bootstrap';

export default class PageUserDetail {
	#args = null;
	#newPassword = '';

	#inputFirstName = '';
	#inputLastName = '';
	#inputEmail = '';
	#inputPhone = '';

	#adresses = [];

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

		this.#inputFirstName = inputFirstName;
		this.#inputLastName = inputLastName;
		this.#inputEmail = inputEmail;
		this.#inputPhone = inputPhone;

		// Toastie

		const toastLiveExample = document.getElementById('liveToast');
		const toastTitle = document.getElementById('toastTitle');
		const toastBody = document.getElementById('toastBody');

		// DEV

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
										console.log(
											'Old password verified. Ready to save.'
										);
										document
											.getElementById('modalFirstInput')
											.classList.remove('is-invalid');
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
					} else {
						console.warn('Delete failed:', successCallback.message);
					}
				},
				(errorCallback) => {
					console.error('API error:', errorCallback);
				},
				addressId
			);

			console.log(addressId);
		});
	} // Constructor

	#setupEditModal(field, value, callback) {
		const modalEl = document.getElementById('modalEditFullName');
		const modal = new bootstrap.Modal(modalEl);
		const confirmBtn = document.getElementById('confirmEdit');

		document.body.classList.remove('modal-open'); // remove modal-open class if stuck
		const oldBackdrop = document.querySelector('.modal-backdrop');
		if (oldBackdrop) oldBackdrop.remove(); // remove leftover backdrop

		modalEl.addEventListener('hidden.bs.modal', () => {
			document.body.classList.remove('modal-open');
			const stuckBackdrop = document.querySelector('.modal-backdrop');
			if (stuckBackdrop) stuckBackdrop.remove();
		});

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
	}

	#getAndInsertAddresses() {
		this.#args.app.apiGetAddresses(
			(successCallback) => {
				if (successCallback.success) {
					// Scucess Code
					this.#adresses = successCallback.addresses;
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
				<input
					type="text"
					class="form-control form-control-lg me-3"
					value="${address.street} ${address.houseNr} / ${address.door} , ${address.postalCode} ${address.city}" 
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
}
