import PageHTML from './page-users-management.html';

export default class PageUsersManagement {
	//--------------------------------------------------
	// Private Variables
	//--------------------------------------------------

	#args = null;
	#currentPage = 1;
	#totalPages = 1;
	#actionLock = false; // DEV

	//--------------------------------------------------
	// Constructor
	//--------------------------------------------------
	constructor(args) {
		this.#args = args;
		args.target.innerHTML = PageHTML;
		// INIT
		this.#readUsers();
		// EVENTS
		this.#args.target.addEventListener('click', (e) => {
			if (this.#actionLock) return;
			const btn = e.target.closest('.btn-save-user');
			if (!btn) return;

			this.#actionLock = true;

			const userId = parseInt(btn.dataset.userId);
			const roleSelect = this.#args.target.querySelector(
				`.role-select[data-user-id="${userId}"]`
			);
			const statusSelect = this.#args.target.querySelector(
				`.status-select[data-user-id="${userId}"]`
			);

			const roleId = parseInt(roleSelect.value);
			const userStatus = statusSelect.value === 'true';

			this.#updateUserAdmin(userId, roleId, userStatus);

			// DEV
			setTimeout(() => {
				this.#actionLock = false;
			}, 300); // DEV
		});
	}

	//--------------------------------------------------
	// Public Methods
	//--------------------------------------------------
	#fetchAllUsers() {
		this.#args.app.apiGet(
			(res) => {
				if (res.success && Array.isArray(res.users)) {
					this.#renderUsers(res.users);
				} else {
					console.error('Invalid user response', res);
				}
			},
			(err) => {
				console.error('Failed to fetch users:', err.message || err);
			},
			'/Users/GetAllUsersAndOrders'
		);
	}

	#readUsers() {
		const container = this.#args.target.querySelector('#targetUsersAdmin');
		container.innerHTML = '';

		const query = `/Users/GetAllUsersAndOrders?page=${
			this.#currentPage
		}&pageSize=5`;

		this.#args.app.apiGet(
			(res) => {
				if (res.success) {
					this.#totalPages = Math.ceil(res.totalCount / res.pageSize);
					this.#renderUsers(res.users);

					this.#renderPagination();
				} else {
					container.innerHTML = `<p class="text-danger">Failed to load users.</p>`;
				}
			},
			(err) => {
				container.innerHTML = `<p class="text-danger">${
					err.message || err
				}</p>`;
			},
			query
		);
	}

	#renderUsers(users) {
		const container = this.#args.target.querySelector('#targetUsersAdmin');
		container.innerHTML = '';

		for (const user of users) {
			const div = document.createElement('div');
			div.className = 'col-12';
			div.innerHTML = `
			<div class="card rounded-0 mb-4">
				<div class="card-body d-flex flex-column">
					<div class="row">
						<div class="col-md-8">
							<h5 class="card-title mb-2">${user.firstName} ${user.lastName}</h5>
							<p class="mb-1"><strong>Email:</strong> ${user.email}</p>
							<p class="mb-1"><strong>Phone:</strong> ${user.phoneNumber}</p>
						</div>
						<div class="col-md-4 d-flex flex-column flex-md-row justify-content-md-end gap-3">
							<div>
								<label class="form-label fw-bold mb-0">Role</label>
								<select class="form-select form-select-sm role-select" data-user-id="${
									user.userId
								}">
									<option value="1" ${user.roleId === 1 ? 'selected' : ''}>Admin</option>
									<option value="2" ${user.roleId === 2 ? 'selected' : ''}>Employee</option>
									<option value="3" ${user.roleId === 3 ? 'selected' : ''}>Customer</option>
								</select>
							</div>
							<div>
								<label class="form-label fw-bold mb-0">Status</label>
								<select class="form-select form-select-sm status-select" data-user-id="${
									user.userId
								}">
									<option value="true" ${user.userStatus ? 'selected' : ''}>Active</option>
									<option value="false" ${!user.userStatus ? 'selected' : ''}>Disabled</option>
								</select>
							</div>
						</div>
					</div>

					<h6 class="fw-bold mt-4">Last 5 Orders</h6>
					<div class="table-responsive mb-3">
						<table class="table table-sm table-bordered mb-0">
							<thead class="table-light">
								<tr>
									<th>Order #</th>
									<th>Date</th>
									<th>Total</th>
									<th>Status</th>
									<th class="text-center">Action</th>
								</tr>
							</thead>
							<tbody>
								${user.orders
									.map(
										(order) => `
									<tr>
										<td>#${order.orderId}</td>
										<td>${new Date(order.orderDate)
											.toLocaleString('en-GB', {
												day: '2-digit',
												month: '2-digit',
												year: '2-digit',
												hour: '2-digit',
												minute: '2-digit',
												hour12: false,
											})
											.replace(/\//g, '-')}</td>

										<td>€${order.totalPrice.toFixed(2)}</td>
										<td><span class="badge bg-secondary">${order.status}</span></td>
										<td class="text-center">
											<a href="#user-order-history" class="btn btn-sm btn-outline-secondary" title="View Order">
												<i class="bi bi-eye"></i>
											</a>
										</td>
									</tr>
								`
									)
									.join('')}
							</tbody>
						</table>
					</div>

					<div class="d-flex justify-content-end">
						<button class="btn btn-success btn-save-user" data-user-id="${
							user.userId
						}">Save</button>
					</div>
				</div>
			</div>
		`;

			container.appendChild(div);
		}
	}

	#renderPagination() {
		const paginationContainer =
			this.#args.target.querySelector('#pagination');
		paginationContainer.innerHTML = '';

		const createItem = (label, page, disabled = false, active = false) => {
			const li = document.createElement('li');
			li.className = `page-item ${disabled ? 'disabled' : ''} ${
				active ? 'active' : ''
			}`;

			const a = document.createElement('a');
			a.className = 'page-link';
			a.href = '#';
			a.innerText = label;

			a.addEventListener('click', (e) => {
				e.preventDefault();
				if (!disabled && this.#currentPage !== page) {
					this.#currentPage = page;
					this.#readUsers();
				}
			});

			li.appendChild(a);
			paginationContainer.appendChild(li);
		};

		createItem('Previous', this.#currentPage - 1, this.#currentPage === 1);

		for (let i = 1; i <= this.#totalPages; i++) {
			createItem(i, i, false, i === this.#currentPage);
		}

		createItem(
			'Next',
			this.#currentPage + 1,
			this.#currentPage === this.#totalPages
		);
	}

	#updateUserAdmin(userId, roleId, userStatus) {
		this.#args.app.apiNewSomethingPOST(
			(res) => {
				alert(res.message || 'User updated.');
				this.#fetchAllUsers();
			},
			(err) => {
				alert(err.message || 'Update failed.');
			},
			'Users/UpdateUserAdmin',
			{ userId, roleId, userStatus }
		);
	}
}
