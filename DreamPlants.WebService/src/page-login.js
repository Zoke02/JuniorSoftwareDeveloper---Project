import PageHTML from './page-login.html';
import * as bootstrap from 'bootstrap';

export default class PageLogin {
	#args = null;
	#registerTab = null;
	#textEmail = null;
	#textPassword = null;
	#checkboxRemember = null;
	#firstName = null;
	#lastName = null;
	#phone = null;
	#toastMessage = null;
	#toastMessageBody = null;
	#actionLock = false; // DEV

	constructor(args) {
		this.#args = args;
		args.target.innerHTML = PageHTML;

		// TABS Login/Register
		this.#textEmail = args.target.querySelector('#textEmail');
		this.#textPassword = args.target.querySelector('#textPassword');
		this.#firstName = args.target.querySelector('#textFirstName');
		this.#lastName = args.target.querySelector('#textLastName');
		this.#phone = args.target.querySelector('#textPhone');
		this.#toastMessage = args.target.querySelector('#toastMessage');
		this.#toastMessageBody = args.target.querySelector('#toastBody');

		const loginTab = args.target.querySelector('#btnLoginTab');
		const registerTab = args.target.querySelector('#btnRegisterTab');
		this.#registerTab = registerTab;
		// Fields
		const registerFields = args.target.querySelectorAll('.register-only');
		// Checkbox
		const checkboxRemember = args.target.querySelector('#checkboxRemember');
		this.#checkboxRemember = checkboxRemember;
		const buttonSubmit = args.target.querySelector('#buttonSubmit');

		// Load saved fields if available - FINISHED
		this.#loadPersistentInput('textFirstName', 'firstName');
		this.#loadPersistentInput('textLastName', 'lastName');
		this.#loadPersistentInput('textPhone', 'phone');
		this.#loadPersistentInput('textEmail', 'email');

		// -----------------------------------------------------------------
		// EVENT LISTENERS
		// -----------------------------------------------------------------

		// Login/Register toggle - FINISHED
		loginTab.addEventListener('click', () => {
			loginTab.classList.add('active');
			registerTab.classList.remove('active');
			registerFields.forEach((el) => el.classList.add('d-none'));
			buttonSubmit.textContent = 'Login';
		});
		registerTab.addEventListener('click', () => {
			registerTab.classList.add('active');
			loginTab.classList.remove('active');
			registerFields.forEach((el) => el.classList.remove('d-none'));
			buttonSubmit.textContent = 'Register';
		});

		// Real-time input cleanup - FINISHED
		args.target.querySelectorAll('input').forEach((input) => {
			input.addEventListener('input', () => {
				input.classList.remove('is-invalid');
			});
		});
		// Phone only digits - FINISHED
		this.#phone.addEventListener('input', (e) => {
			e.target.value = e.target.value.replace(/[^\d +]/g, ''); // Remove all non-digits
			// /   /g is a negated character class:
			// \d → allows digits (0–9)
			//  → allows space
			// + → allows plus sign
			// [^...] → means “anything not in this list”
			// Documentation: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#character_classes
		});

		// Show/hide password - FISNISHED
		const togglePassword = args.target.querySelector(
			'#togglePasswordVisibility'
		);
		togglePassword.addEventListener('click', () => {
			// First check if element is type
			const isPasswordVisible = this.#textPassword.type === 'text';
			if (isPasswordVisible) {
				this.#textPassword.type = 'password';
				togglePassword.classList.remove('bi-eye-slash-fill');
				togglePassword.classList.add('bi-eye-fill');
			} else {
				this.#textPassword.type = 'text';
				togglePassword.classList.remove('bi-eye-fill');
				togglePassword.classList.add('bi-eye-slash-fill');
			}
		});

		// Remember Me checkbox - FINISHED
		const rememberStored = localStorage.getItem('remember');
		checkboxRemember.checked = rememberStored === 'true';
		checkboxRemember.addEventListener('change', () => {
			localStorage.setItem('remember', checkboxRemember.checked);
		});

		// Enter key submit - FINISHED
		args.target.addEventListener('keyup', (e) => {
			if (e.key === 'Enter') {
				const isTextField = e.target.matches('input, textarea');
				if (!isTextField) return;

				e.preventDefault();
				if (!this.#actionLock) this.#handleSubmit();
			}
		});

		// Submit - NEEDS WORK
		buttonSubmit.addEventListener('click', () => this.#handleSubmit());
	}
	// Login Handler - WOKRING ON
	#handleSubmit() {
		if (this.#actionLock) return;
		if (!this.#validateAuthForm()) return;

		this.#actionLock = true;
		setTimeout(() => (this.#actionLock = false), 500); //  lock

		const isRegister = this.#registerTab.classList.contains('active');
		if (isRegister) {
			this.#handleRegister(this.#args);
			if (!this.#checkboxRemember.checked) {
				localStorage.removeItem('email');
			}
			if (localStorage.getItem('firstName'))
				localStorage.removeItem('firstName');
			if (localStorage.getItem('lastName'))
				localStorage.removeItem('lastName');
			if (localStorage.getItem('phone')) localStorage.removeItem('phone');
		} else {
			this.#handleLogin(this.#args);
			if (!this.#checkboxRemember.checked) {
				if (localStorage.getItem('email'))
					localStorage.removeItem('email');
			}
			if (localStorage.getItem('firstName'))
				localStorage.removeItem('firstName');
			if (localStorage.getItem('lastName'))
				localStorage.removeItem('lastName');
			if (localStorage.getItem('phone')) localStorage.removeItem('phone');
		}
	}

	// Login Handler - FINISHED
	#handleLogin(args) {
		const loginData = new FormData();
		loginData.append('email', this.#textEmail.value.trim());
		loginData.append('password', this.#textPassword.value.trim());
		loginData.append(
			'remember',
			this.#checkboxRemember.checked ? 'true' : 'false'
		);

		args.app.apiLogin(
			(r) => {
				if (r.success) {
					args.app.user = r.user;
					localStorage.setItem('user', JSON.stringify(r.user));
					window.open('#home', '_self');
				} else {
					alert(r.message);
				}
			},
			(ex) => alert(ex),
			loginData
		);
	}

	#handleRegister(args) {
		const registerData = new FormData();
		registerData.append('email', this.#textEmail.value.trim());
		registerData.append('password', this.#textPassword.value.trim());
		registerData.append('firstName', this.#firstName.value.trim());
		registerData.append('lastName', this.#lastName.value.trim());
		registerData.append('phone', this.#phone.value.trim());
		registerData.append(
			'remember',
			this.#checkboxRemember.checked ? 'true' : 'false'
		);

		args.app.apiRegister(
			(r) => {
				if (r.success) {
					args.app.user = r.user;
					localStorage.setItem('user', JSON.stringify(r.user));
					window.open('#home', '_self');
				} else {
					// TOAST MESSAGE FROM API
					this.#toastMessageBody.textContent = r.message;
					this.#toastMessage.classList.remove(
						'text-bg-success',
						'text-bg-danger'
					);
					this.#toastMessage.classList.add(
						r.success ? 'text-bg-success' : 'text-bg-danger'
					);

					const toast = new bootstrap.Toast(this.#toastMessage);
					toast.show();
				}
			},
			(ex) => alert(ex),
			registerData
		);
	}
	// Validation Function - FINISHED
	#validateAuthForm() {
		// Login Fields
		const fields = [
			{ id: 'textEmail', name: 'Email' },
			{ id: 'textPassword', name: 'Password' },
		];

		// Check if register tab is active
		const isRegister = this.#registerTab.classList.contains('active');
		// If register, add additional fields
		if (isRegister) {
			fields.push(
				{ id: 'textFirstName', name: 'First Name' },
				{ id: 'textLastName', name: 'Last Name' },
				{ id: 'textPhone', name: 'Phone' },
				{ id: 'textConfirmPassword', name: 'Confirm Password' }
			);
		}

		let allValid = true;

		// Validate each field
		fields.forEach(({ id, name }) => {
			const input = document.getElementById(id);
			if (!input.value.trim()) {
				allValid = false;
				input.classList.add('is-invalid');
				input.placeholder = `Please enter your ${name}`;
			} else {
				input.classList.remove('is-invalid');
			}
		});

		// Check password match
		if (isRegister) {
			const pw = document.getElementById('textPassword').value.trim();
			const pwconfirm = document
				.getElementById('textConfirmPassword')
				.value.trim();
			if (pw !== pwconfirm) {
				allValid = false;
				const confirmInput = document.getElementById(
					'textConfirmPassword'
				);
				confirmInput.classList.add('is-invalid');
				confirmInput.value = '';
				confirmInput.placeholder = 'Passwords do not match';
			}
		}
		// Return TRUE
		return allValid;
	}
	// Input Fields save state - FINISHED
	#loadPersistentInput(inputId, storageKey) {
		const input = document.getElementById(inputId);
		if (!input) return;

		// Load saved value
		input.value = localStorage.getItem(storageKey) || '';

		// Save value on input
		input.addEventListener('input', () => {
			localStorage.setItem(storageKey, input.value);
		});
	}
}
