using DreamPlants.DataService.API.Data;
using DreamPlants.DataService.API.Models.DTO;
using DreamPlants.DataService.API.Models.Generated;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
      try
      {
        string token = Request.Cookies["LoginToken"];
        if (string.IsNullOrEmpty(token)) return Unauthorized();

        var user = await _context.Users.FirstOrDefaultAsync(u => u.LoginToken == token);
        if (user == null) return Unauthorized();

        // Validate card & address ownership
        var address = await _context.Addresses.FirstOrDefaultAsync(a => a.AddressId == request.AddressId && a.UserId == user.UserId);
        var card = await _context.CreditCards.FirstOrDefaultAsync(c => c.CardId == request.CardId && c.UserId == user.UserId);
        if (address == null || card == null)
          return BadRequest(new { success = false, message = "Invalid address or card." });

        // Fetch pricing info
        var tax = await _context.ListPrices.FirstOrDefaultAsync(p => p.Type == "Tax");
        var standard = await _context.ListPrices.FirstOrDefaultAsync(p => p.Label == "Standard");
        var express = await _context.ListPrices.FirstOrDefaultAsync(p => p.Label == "Express");
        var freeShippingLimit = await _context.ListPrices.FirstOrDefaultAsync(p => p.Label == "Free");

        if (tax == null || standard == null || express == null || freeShippingLimit == null)
          return BadRequest(new { success = false, message = "Pricing data incomplete." });

        // Match stocks
        var stockUids = request.Items.Select(i => i.StockUid).ToList();
        var stockItems = await _context.Stocks
          .Where(s => stockUids.Contains(s.StockUid))
          .ToDictionaryAsync(s => s.StockUid, s => s);

        decimal itemTotal = 0;

        foreach (var item in request.Items)
        {
          if (!stockItems.TryGetValue(item.StockUid, out var stock)) continue;
          itemTotal += stock.Price * item.Quantity;
        }

        decimal shipping = request.ShippingType.ToLower() == "express" ? express.Value : standard.Value;
        if (itemTotal >= freeShippingLimit.Value)
          shipping = 0;

        decimal finalTotal = (itemTotal + shipping) * (1 + tax.Value / 100);

        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
          var newOrder = new Order
          {
            UserId = user.UserId,
            AddressId = address.AddressId,
            CardId = card.CardId,
            OrderDate = DateTime.Now,
            ShippingId = request.ShippingType.ToLower() == "express" ? express.Id : standard.Id,
            TaxId = tax.Id,
            TotalPrice = finalTotal,
            StatusId = 1 // Pending
          };

          _context.Orders.Add(newOrder);
          await _context.SaveChangesAsync();

          decimal totalPriceProduct = 0;

          foreach (var item in request.Items)
          {
            if (!stockItems.TryGetValue(item.StockUid, out var stock)) continue;
            totalPriceProduct += stock.Price * item.Quantity;

            _context.OrderProducts.Add(new OrderProduct
            {
              OrderId = newOrder.OrderId,
              StockId = stock.StockId,
              Quantity = item.Quantity,
              TotalPrice = totalPriceProduct
            });
          }

          await _context.SaveChangesAsync();
          await transaction.CommitAsync();

          return Ok(new { success = true, orderId = newOrder.OrderId });
        }
        catch (Exception ex)
        {
          await transaction.RollbackAsync();
#if DEBUG
          return StatusCode(500, new { success = false, message = ex.Message });
#else
			return StatusCode(500, new { success = false });
#endif
        }
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { success = false, message = ex.Message });
#else
		return StatusCode(500, new { success = false });
#endif
      }
    }


  }
}
