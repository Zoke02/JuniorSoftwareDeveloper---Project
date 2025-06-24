using DreamPlants.DataService.API.Data;
using DreamPlants.DataService.API.Models.DTO;
using DreamPlants.DataService.API.Models.Generated;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace DreamPlants.DataService.API.Controllers
{
  [Route("[controller]")]
  [ApiController]
  public class OrderController : Controller
  {

    private readonly DreamPlantsContext _context;

    public OrderController(DreamPlantsContext context)
    {
      _context = context;
    }

    [HttpPost("CalculateShopCartTotal")]
    public async Task<ActionResult> CalculateShopCartTotal([FromBody] ShopCartCalculateDTO request)
    {
      try
      {
        if (request.Items == null || !request.Items.Any())
          return BadRequest(new { success = false, message = "Cart is empty" });

        // Load all required stocks
        var stockUids = request.Items.Select(i => i.StockUid).ToList();
        var stocks = await _context.Stocks
            .Where(s => stockUids.Contains(s.StockUid))
            .ToListAsync();

        // Load tax + shipping
        var tax = await _context.ListPrices.FirstOrDefaultAsync(p => p.Type == "Tax");
        var standard = await _context.ListPrices.FirstOrDefaultAsync(p => p.Label == "Standard");
        var express = await _context.ListPrices.FirstOrDefaultAsync(p => p.Label == "Express");
        var freeShippingLimit = await _context.ListPrices.FirstOrDefaultAsync(p => p.Label == "Free");

        if (tax == null || standard == null || express == null || freeShippingLimit == null)
          return Ok(new { success = false, message = "Pricing data incomplete" });

        // Calculate subtotal
        decimal itemTotal = 0;
        foreach (var item in request.Items)
        {
          var stock = stocks.FirstOrDefault(s => s.StockUid == item.StockUid);
          if (stock != null)
          {
            itemTotal += stock.Price * item.Quantity;
          }
        }

        // Choose shipping price
        decimal shipping = request.ShippingType.ToLower() == "express" ? express.Value : standard.Value;
        decimal finalTotal;

        // Calculate final total with tax; apply free shipping if threshold met
        if (itemTotal >= freeShippingLimit.Value) // Fix: Compare itemTotal with freeShippingLimit.Value
        {
          finalTotal = itemTotal * (1 + tax.Value / 100);
        }
        else
        {
          finalTotal = (itemTotal + shipping) * (1 + tax.Value / 100);
        }

        var dto = new ShopCartPriceResultDTO
        {
          ItemTotal = itemTotal,
          FinalTotal = finalTotal
        };

        return Ok(new { success = true, dto });
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { message = ex.Message });
#else
        return StatusCode(500);
#endif
      }
    }

    [HttpPost("PlaceOrder")]
    public async Task<ActionResult> PlaceOrder([FromBody] OrderCreateDTO request)
    {
      string token = Request.Cookies["LoginToken"];
      if (string.IsNullOrEmpty(token))
        return Unauthorized();

      User user = await _context.Users.FirstOrDefaultAsync(u => u.LoginToken == token);
      if (user == null || user.LoginTokenTimeout < DateTime.Now)
        return Unauthorized();

      if (request.Items == null || !request.Items.Any())
        return Ok(new { success = false, message = "Your cart is empty." });

      Address address = await _context.Addresses
        .FirstOrDefaultAsync(a => a.AddressId == request.AddressId && a.UserId == user.UserId && !a.Deleted);
      CreditCard card = await _context.CreditCards
        .FirstOrDefaultAsync(c => c.CardId == request.CardId && c.UserId == user.UserId && !c.Deleted);

      if (address == null || card == null)
        return Ok(new { success = false, message = "Invalid address or card." });

      ListPrice tax = await _context.ListPrices.FirstOrDefaultAsync(p => p.Type == "Tax");
      ListPrice standard = await _context.ListPrices.FirstOrDefaultAsync(p => p.Label == "Standard");
      ListPrice express = await _context.ListPrices.FirstOrDefaultAsync(p => p.Label == "Express");
      ListPrice freeShippingLimit = await _context.ListPrices.FirstOrDefaultAsync(p => p.Label == "Free");
      if (tax == null || standard == null || express == null || freeShippingLimit == null)
        return Ok(new { success = false, message = "Pricing data incomplete." });

      List<string> stockUids = request.Items.Select(i => i.StockUid).ToList();
      var stockItems = await _context.Stocks
        .Where(s => stockUids.Contains(s.StockUid))
        .ToDictionaryAsync(s => s.StockUid, s => s);

      if (stockItems.Count != request.Items.Count)
        return Ok(new { success = false, message = "Some stock items were not found." });

      decimal itemTotal = 0;
      foreach (var item in request.Items)
      {
        Stock stock = stockItems[item.StockUid];
        if (stock.Quantity < item.Quantity)
          return Ok(new { success = false, message = "Sorry, Product Sold OUT!" });

        itemTotal += stock.Price * item.Quantity;
      }

      decimal shipping = request.ShippingType.ToLower() == "express" ? express.Value : standard.Value;
      if (itemTotal >= freeShippingLimit.Value)
        shipping = 0;

      decimal finalTotal = (itemTotal + shipping) * (1 + tax.Value / 100);

      // wtf do you cast transaction to - CHECK LATER
      using var transaction = await _context.Database.BeginTransactionAsync();
      try
      {
        string orderNumber = await Order.GenerateUniqueOrderNumberAsync(_context);

        Order newOrder = new Order
        {
          UserId = user.UserId,
          AddressId = address.AddressId,
          CardId = card.CardId,
          OrderDate = DateTime.Now,
          ShippingId = request.ShippingType.ToLower() == "express" ? express.Id : standard.Id,
          TaxId = tax.Id,
          TotalPrice = finalTotal,
          StatusId = 1, // Pending
          OrderNumber = orderNumber
        };

        _context.Orders.Add(newOrder);
        await _context.SaveChangesAsync();

        foreach (CartItemDTO item in request.Items)
        {
          var stock = stockItems[item.StockUid];
          stock.Quantity -= item.Quantity;

          _context.OrderProducts.Add(new OrderProduct
          {
            OrderId = newOrder.OrderId,
            StockId = stock.StockId,
            Quantity = item.Quantity,
            TotalPrice = stock.Price * item.Quantity
          });
        }

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return Ok(new { success = true, message = "Order Placed!", orderId = newOrder.OrderId });
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { success = false, message = ex.Message });
#else
    return StatusCode(500, new { success = false, message = "An error occurred while placing the order." });
#endif
      }
    } // Place Order

    [HttpGet("OrderHistory")]
    public async Task<ActionResult> GetUserOrderHistory([FromQuery] int page = 1, [FromQuery] int pageSize = 4)
    {
      try
      {
        string token = Request.Cookies["LoginToken"];
        if (string.IsNullOrEmpty(token))
          return Unauthorized();

        var user = await _context.Users.FirstOrDefaultAsync(u => u.LoginToken == token);
        if (user == null || user.LoginTokenTimeout < DateTime.Now)
          return Unauthorized();

        var query = _context.Orders.AsQueryable();

        if (user.RoleId != 1 && user.RoleId != 2)
          query = query.Where(o => o.UserId == user.UserId);

        int totalOrders = await query.CountAsync();

        // Get paged order IDs
        var pagedOrders = await query
          .OrderByDescending(o => o.OrderDate)
          .Skip((page - 1) * pageSize)
          .Take(pageSize)
          .Select(o => o.OrderId)
          .ToListAsync();

        // Load full order data with includes
        var fullOrders = await _context.Orders
          .Where(o => pagedOrders.Contains(o.OrderId))
          .Include(o => o.Status)
          .Include(o => o.Tax)
          .Include(o => o.Shipping) // pulls ListPrice.Label -change from int
          .Include(o => o.OrderProducts)
            .ThenInclude(op => op.Stock)
              .ThenInclude(s => s.Product)
              .Include(o => o.User)
          .OrderByDescending(o => o.OrderDate)
          .ToListAsync();

        // DTO
        var result = fullOrders.Select(o => new OrderHistoryDTO
        {
          OrderId = o.OrderId,
          OrderNumber = o.OrderNumber,
          OrderDate = o.OrderDate,
          Status = o.Status.StatusName,
          TotalPrice = o.TotalPrice,
          AddressId = o.AddressId,
          CardId = o.CardId,
          Tax = o.Tax.Value,
          UserId = o.UserId,
          ShippingName = o.Shipping?.Label ?? "Unknown",
          FirstName = o.User.FirstName,
          LastName = o.User.LastName,
          Items = o.OrderProducts.Select(op => new OrderItemDTO
          {
            ProductName = op.Stock.Product.Name,
            VariantSize = op.Stock?.VariantSize ?? "-",
            VariantColor = op.Stock?.VariantColor ?? "-",
            Quantity = op.Quantity,
            UnitPrice = op.Quantity == 0 ? 0 : op.TotalPrice / op.Quantity,
            TotalPrice = op.TotalPrice
          }).ToList()
        }).ToList();


        // DEV show order
        fullOrders = pagedOrders
        .Select(id => fullOrders.First(o => o.OrderId == id))
        .ToList();

        return Ok(new
        {
          success = true,
          page,
          pageSize,
          totalOrders,
          totalPages = (int)Math.Ceiling((double)totalOrders / pageSize),
          orders = result
        });
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { success = false, message = ex.Message });
#else
    return StatusCode(500, new { success = false, message = "An error occurred while loading order history." });
#endif
      }
    } // Order History

    [HttpPost("Cancel/{orderId}")]
    public async Task<ActionResult> CancelOrder(int orderId)
    {
      try
      {
        string token = Request.Cookies["LoginToken"];
        if (string.IsNullOrEmpty(token)) return Unauthorized();

        var user = await _context.Users.FirstOrDefaultAsync(u => u.LoginToken == token);
        if (user == null) return Unauthorized();

        var order = await _context.Orders.FirstOrDefaultAsync(o => o.OrderId == orderId && o.UserId == user.UserId);
        if (order == null)
          return NotFound(new { success = false, message = "Order not found." });

        if (order.StatusId != 1 && order.StatusId != 2)
          return BadRequest(new { success = false, message = "You can only cancel Pending or Confirmed orders." });

        order.StatusId = 5; // Cancelled
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Order cancelled." });
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { success = false, message = ex.Message });
#else
    return StatusCode(500, new { success = false, message = "An error occurred while cancelling the order." });
#endif
      }
    } // CancelOrder

    [HttpPost("Reorder/{orderId}")]
    public async Task<ActionResult> Reorder(int orderId)
    {
      try
      {
        string token = Request.Cookies["LoginToken"];
        if (string.IsNullOrEmpty(token)) return Unauthorized();

        var user = await _context.Users.FirstOrDefaultAsync(u => u.LoginToken == token);
        if (user == null || user.LoginTokenTimeout < DateTime.Now) 
          return Unauthorized();

          var originalOrder = await _context.Orders
          .Include(o => o.OrderProducts)
          .FirstOrDefaultAsync(o => o.OrderId == orderId && o.UserId == user.UserId);

        // safe Check so u can only reorder your own order.
        if (originalOrder == null || user.UserId != originalOrder.UserId)
          return Ok(new { success = false, message = "Order does not belong to you." });

        // Regenerate order number
        string newOrderNumber = await Order.GenerateUniqueOrderNumberAsync(_context);

        var newOrder = new Order
        {
          UserId = user.UserId,
          AddressId = originalOrder.AddressId,
          CardId = originalOrder.CardId,
          OrderDate = DateTime.Now,
          ShippingId = originalOrder.ShippingId,
          TaxId = originalOrder.TaxId,
          TotalPrice = originalOrder.TotalPrice,
          StatusId = 1, // Pending
          OrderNumber = newOrderNumber
        };

        _context.Orders.Add(newOrder);
        await _context.SaveChangesAsync();

        foreach (var item in originalOrder.OrderProducts)
        {
          _context.OrderProducts.Add(new OrderProduct
          {
            OrderId = newOrder.OrderId,
            StockId = item.StockId,
            Quantity = item.Quantity,
            TotalPrice = item.TotalPrice
          });
        }

        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Order placed again.", orderId = newOrder.OrderId });
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { success = false, message = ex.Message });
#else
    return StatusCode(500, new { success = false, message = "An error occurred while reordering." });
#endif
      }
    } // Reorder

    [HttpGet("DeliveryStatuses")]
    public async Task<ActionResult> GetDeliveryStatuses()
    {
      try
      {
        string token = Request.Cookies["LoginToken"];
        if (string.IsNullOrEmpty(token)) return Unauthorized();

        var user = await _context.Users.FirstOrDefaultAsync(u => u.LoginToken == token);
        if (user == null || user.LoginTokenTimeout < DateTime.Now)
          return Unauthorized();

        var statuses = await _context.StatusDeliveries
          .OrderBy(s => s.StatusId)
          .Select(s => new { id = s.StatusId, name = s.StatusName })
          .ToListAsync();

        return Ok(new { success = true, statuses });
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { success = false, message = ex.Message });
#else
    return StatusCode(500, new { success = false, message = "Failed to load statuses." });
#endif
      }
    } // GET DeliveryStatuses

    [HttpPost("UpdateOrderStatus")]
    public async Task<ActionResult> UpdateOrderStatus([FromBody] UpdateOrderStatusDTO dto)
    {
      try
      {
        string token = Request.Cookies["LoginToken"];
        if (string.IsNullOrEmpty(token)) return Unauthorized();

        var user = await _context.Users.FirstOrDefaultAsync(u => u.LoginToken == token);
        if (user == null || user.LoginTokenTimeout < DateTime.Now)
          return Unauthorized();

        var order = await _context.Orders.FindAsync(dto.OrderId);
        if (order == null)
          return NotFound(new { success = false, message = "Order not found." });

        // admins & employees can update any order
        if (user.RoleId == 1 || user.RoleId == 2)
        {
          order.StatusId = dto.StatusId;
        }
        else
        {
          // Customers can only change their own orders
          if (order.UserId != user.UserId)
            return Unauthorized();

          // Customers can only change to Pending (1) or Cancelled (5)
          if (dto.StatusId != 1 && dto.StatusId != 5)
            return Ok(new { success = false, message = "You are not allowed to set this status." });

          order.StatusId = dto.StatusId;
        }
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Order status updated." });
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { success = false, message = ex.Message });
#else
		return StatusCode(500, new { success = false, message = "Failed to update order status." });
#endif
      }
    } // UpdateOrderStatus


  }
}
