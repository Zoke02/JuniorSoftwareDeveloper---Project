🌱 Junior Software Developer Project – DreamPlants Webshop

A full-stack web application for managing and ordering plant products.  
The project features an admin dashboard for managing items and users, a RESTful API for data communication, and a 
clean, object-oriented backend built with Entity Framework.

This project was developed as part of my diploma at WIFI Salzburg (2024–2025). 
It implements key concepts like modular architecture, backend logic, PWA features, and role-based access.

--------------------------------------------------------------------------------------------------------------------

🖼️ Screenshots
| Feature                                | Preview                                                                                                                                                    |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Homepage**                        | [home\_page.png](https://github.com/Zoke02/JuniorSoftwareDeveloper-Project/blob/main/Screenshots/home_page.png)                                            |
| **Best Seller Section (Dark Mode)** | [best\_seller\_section\_dark\_mode.png](https://github.com/Zoke02/JuniorSoftwareDeveloper-Project/blob/main/Screenshots/best_seller_section_dark_mode.png) |
| **Login / Register**                | [login\_register.png](https://github.com/Zoke02/JuniorSoftwareDeveloper-Project/blob/main/Screenshots/login_register.png)                                  |
| **Shopping Cart**                   | [shop\_cart.png](https://github.com/Zoke02/JuniorSoftwareDeveloper-Project/blob/main/Screenshots/shop_cart.png)                                            |
| **User Profile**                    | [user\_profile.png](https://github.com/Zoke02/JuniorSoftwareDeveloper-Project/blob/main/Screenshots/user_profile.png)                                      |
| **User Order History**              | [user\_order\_history.png](https://github.com/Zoke02/JuniorSoftwareDeveloper-Project/blob/main/Screenshots/user_order_history.png)                         |
| **User Management (Admin)**      | [user\_management.png](https://github.com/Zoke02/JuniorSoftwareDeveloper-Project/blob/main/Screenshots/user_management.png)                                |
| **Category Management (Admin)**     | [categories\_management.png](https://github.com/Zoke02/JuniorSoftwareDeveloper-Project/blob/main/Screenshots/categories_management.png)                    |
| **Product Management (Admin)**      | [products\_management.png](https://github.com/Zoke02/JuniorSoftwareDeveloper-Project/blob/main/Screenshots/products_management.png)                        |
| **Add / Edit Products (Admin)**     | [products\_add\_edit.png](https://github.com/Zoke02/JuniorSoftwareDeveloper-Project/blob/main/Screenshots/products_add_edit.png)                           |


--------------------------------------------------------------------------------------------------------------------

🌐 Technologies Used  
**Languages & Frameworks**  
C#, ASP.NET Core (Web API), Entity Framework Core, JavaScript (for frontend logic), HTML5, CSS3

**Database & Infrastructure**  
PostgreSQL, RESTful API structure, LINQ & Data Annotations

**Tools & Development Environment**  
Visual Studio 2022, Swagger (API documentation), GitHub (version control), .NET CLI

--------------------------------------------------------------------------------------------------------------------

✨ Features & Functionality  
**Shopping Cart with Backend Logic**  
All price calculations (including tax and shipping) are handled on the backend to ensure accurate totals.

**LocalStorage Integration**  
Products added to the shopping cart are stored in the browser’s localStorage, allowing persistence between sessions.

**Admin Dashboard**  
Admins can create, update, and delete products, manage categories, users, and stock levels.  
Includes basic analytics such as order status counts and top-selling products.

**Token-Based Login & Role Management**  
User authentication is handled via a string token stored on the server.  
Each token includes a login timeout and is validated on every page load.  
Role-based access is enforced using the token data to control permissions (Admin, Employee, Customer).

**Order System & Status Management**  
Orders are stored in an object-oriented structure with references to stock, users, and shipping.  
Admins and employees can update order statuses at any time.

Supported order statuses:  
1. Pending  
2. Confirmed  
3. Shipped  
4. Delivered  
5. Cancelled

Users can also view their order history and reorder previous purchases with a single click.

**Progressive Web App (PWA)**  
The project includes a service worker and installable frontend – users can install it like a native app.

**Offline Support**  
A static fallback page is available when the user is offline or the connection is lost.

**Modular Project Structure**  
The solution is split into backend services and a separate frontend web application for better scalability and 
separation of concerns.

--------------------------------------------------------------------------------------------------------------------

Screenshots