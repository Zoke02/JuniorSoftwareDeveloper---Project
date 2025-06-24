import PageHTML from './page-user-order-history.html';

export default class PageUserOrderHistory {
	//--------------------------------------------------
	// Private Variables
	//--------------------------------------------------

	#args = null;
	#currentPage = 1;
	#totalPages = 1;
	#clickLock = false;
	#boundClickHandler = null;

	//--------------------------------------------------
	// Constructor
	//--------------------------------------------------
	constructor(args) {
		this.#args = args;
		this.#clickLock = false;
		args.target.innerHTML = PageHTML;

		this.#fetchOrders();

		// 👇 Attach to local wrapper instead of <main>
		const container = args.target.querySelector('#userOrderHistoryPage');

		if (!this.#boundClickHandler) {
			this.#boundClickHandler = this.#handleClick.bind(this);
			container.addEventListener('click', this.#boundClickHandler);
		}
	}

	#handleClick = (e) => {
		if (this.#clickLock) return;
		this.#clickLock = true;
		console.log('Click TRUE');
		setTimeout(() => (this.#clickLock = false), 10);

		const btn = e.target.closest('button');
		if (!btn || !this.#args.target.contains(btn)) return;

		e.preventDefault();

		switch (true) {
			case btn.classList.contains('btnCancelOrder'): {
				const orderId = btn.dataset.orderId;
				if (confirm('Are you sure you want to cancel this order?')) {
					this.#cancelOrder(orderId);
				}
				break;
			}
			case btn.classList.contains('btnReorder'): {
				const orderId = btn.dataset.orderId;
				if (confirm('Reorder this same order?')) {
					this.#reorder(orderId);
				}
				break;
			}
			case btn.classList.contains('btnSaveStatus'): {
				const orderId = parseInt(btn.dataset.orderId);
				const select = this.#args.target.querySelector(
					`.status-dropdown[data-order-id="${orderId}"]`
				);
				const statusId = parseInt(select?.value);
				if (!isNaN(orderId) && !isNaN(statusId)) {
					this.#updateOrderStatus(orderId, statusId);
				}
				break;
			}
			default:
				break;
		}
	};

	//--------------------------------------------------
	// Public Methods
	//--------------------------------------------------
	#fetchOrders() {
		this.#fetchDeliveryStatuses((statuses) => {
			this.#args.app.apiGet(
				(res) => {
					const container =
						this.#args.target.querySelector('#ordersList');
					container.innerHTML = this.#renderOrders(
						res.orders,
						statuses
					);
					this.#totalPages = res.totalPages;
					this.#renderPagination();
				},
				(err) => {
					console.error('Failed to load orders:', err.message || err);
				},
				`/Order/OrderHistory?page=${this.#currentPage}&pageSize=4`
			);
		});
	}

	#renderOrders(orders, statuses = []) {
		const isAdmin = [1, 2].includes(this.#args.app.user.roleId);

		if (!orders || orders.length === 0) {
			return `<p class="text-muted text-center">You have no orders yet.</p>`;
		}

		let html = '';

		for (const order of orders) {
			const status = order.status.toLowerCase();
			const canCancel = ['pending', 'confirmed', 'shipped'].includes(
				status
			);
			const isFinal = ['delivered'].includes(status);
			const isOwnOrder =
				order.firstName === this.#args.app.user.firstName;

			const itemsHtml = order.items
				.map(
					(item) => `
				<tr>
					<td>${item.productName}</td>
					<td>${item.variantSize}</td>
					<td>${item.variantColor}</td>
					<td>${item.quantity}</td>
					<td>${item.unitPrice.toFixed(2)} €</td>
					<td>${item.totalPrice.toFixed(2)} €</td>
				</tr>
				`
				)
				.join('');

			const table = `
			<div class="table-responsive">
				<table class="table table-bordered mb-0">
				<thead class="table-light text-uppercase">
					<tr>
					<th>Product</th>
					<th>Variant Size</th>
					<th>Variant Color</th>
					<th>Quantity</th>
					<th>Price</th>
					<th>Subtotal</th>
					</tr>
				</thead>
				<tbody>${itemsHtml}</tbody>
				<tfoot>
					<tr>
						<td colspan="5" class="text-end">Shipping</td>
						<td class="text-end">${order.shippingName}</td>
					</tr>
					<tr>
						<td colspan="5" class="text-end">Taxes</td>
						<td class="text-end">+ ${order.tax} %</td>
					</tr>
					<tr>
						<td colspan="5" class="text-end fw-bold">Total</td>
						<td class="fw-bold text-end">${order.totalPrice.toFixed(2)} €</td>
					</tr>
					<tr>
						<td colspan="6" class="text-end">
							<span class="badge bg-secondary">${order.status}</span>
						</td>
					</tr>
				</tfoot>
				</table>
			</div>`;

			const buttonBlock = `
			<div class="d-flex align-items-center gap-3">
				${
					!isFinal && canCancel && !isAdmin
						? `<button data-order-id="${order.orderId}" class="btn btn-danger btnCancelOrder">CANCEL Order</button>`
						: ''
				}
				${
					isOwnOrder
						? `<button data-order-id="${order.orderId}" class="btn btn-secondary btnReorder">Reorder</button>`
						: ''
				}
			</div>`;

			const header = `
			<div class="d-flex justify-content-between align-items-center mb-3">
				<div>
					<h5 class="mb-1">Order #${order.orderNumber}</h5>
					<h5 class="mb-1">${order.firstName} ${order.lastName}</h5>
					<small class="text-muted">Placed on: ${new Date(
						order.orderDate
					).toLocaleString()}</small>
				</div>
				${buttonBlock}
			</div>`;

			const statusOptions = statuses
				.map(
					(statusItem) =>
						`<option value="${statusItem.id}" ${
							statusItem.name === order.status ? 'selected' : ''
						}>${statusItem.name}</option>`
				)
				.join('');

			const statusControl =
				isAdmin && !isFinal
					? `
			<div class="d-flex justify-content-end pt-3">
				<select class="form-select w-auto me-3 status-dropdown" 
						style="min-width: 150px"
						data-order-id="${order.orderId}">
					${statusOptions}
				</select>
				<button class="btn btn-success btnSaveStatus" 
						data-order-id="${order.orderId}">
					Save Status
				</button>
			</div>`
					: '';

			// Final Card HTML
			html += `
			<div class="card mb-4 rounded-0">
				<div class="card-body">
					${header}
					${table}
					${statusControl}
				</div>
			</div>`;
		}

		return html;
	}

	#cancelOrder(orderId) {
		this.#args.app.apiNewSomethingPOST(
			(res) => {
				alert(res.message);
				this.#fetchOrders();
			},
			(err) => {
				alert(err.message || 'Failed to cancel order.');
			},
			`Order/Cancel/${orderId}`,
			null
		);
	}

	#reorder(orderId) {
		this.#args.app.apiNewSomethingPOST(
			(res) => {
				alert(res.message);
				this.#fetchOrders();
			},
			(err) => {
				alert(err.message || 'Failed to reorder.');
			},
			`Order/Reorder/${orderId}`,
			null
		);
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
			a.className = 'page-link text-color';
			a.href = '#';
			a.innerText = label;

			a.addEventListener('click', (e) => {
				e.preventDefault();
				if (!disabled && this.#currentPage !== page) {
					this.#currentPage = page;
					this.#fetchOrders(); // <- key change
				}
			});

			li.appendChild(a);
			paginationContainer.appendChild(li);
		};

		// Previous
		createItem('Previous', this.#currentPage - 1, this.#currentPage === 1);

		// Pages
		for (let i = 1; i <= this.#totalPages; i++) {
			createItem(i, i, false, i === this.#currentPage);
		}

		// Next
		createItem(
			'Next',
			this.#currentPage + 1,
			this.#currentPage === this.#totalPages
		);
	}
	// DEV
	#fetchDeliveryStatuses(callback) {
		this.#args.app.apiGet(
			(res) => {
				callback(res.statuses); // extract 'statuses' array from response
				console.log(res.statuses); // dev
			},
			(err) => {
				console.error(
					'Failed to fetch delivery statuses:',
					err.message || err
				);
			},
			`/Order/DeliveryStatuses`
		);
	}

	#updateOrderStatus(orderId, statusId) {
		this.#args.app.apiNewSomethingPOST(
			(res) => {
				alert(res.message || 'Status updated!');
				this.#fetchOrders(); // Refresh orders list
			},
			(err) => {
				alert(err.message || 'Failed to update status.');
			},
			`Order/UpdateOrderStatus`,
			{ orderId, statusId }
		);
	}
}
