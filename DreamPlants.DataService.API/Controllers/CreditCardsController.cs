using DreamPlants.DataService.API.Data;
using DreamPlants.DataService.API.Models.DTO;
using DreamPlants.DataService.API.Models.Generated;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IO;

namespace DreamPlants.DataService.API.Controllers
{
  [Route("[controller]")]
  [ApiController]
  public class CreditCardsController : Controller
  {
    private readonly DreamPlantsContext _context;

    public CreditCardsController(DreamPlantsContext context)
    {
      _context = context;
    }

    [HttpGet("GetCards")]
    public async Task<ActionResult> GetCards()
    {
      try
      {
        string token = Request.Cookies["LoginToken"];
        if (string.IsNullOrEmpty(token))
          return Unauthorized(new { success = false, message = "Unauthorized Token" });

        User user = await _context.Users.FirstOrDefaultAsync(u => u.LoginToken == token);
        if (user == null)
          return Unauthorized(new { success = false, message = "Unauthorized User" });

        List<CreditCardDTO> creditCardsDTO = await _context.CreditCards
            .Where(a => a.UserId == user.UserId && !a.Deleted)
            .Select(a => new CreditCardDTO
            {
              CardId = a.CardId,
              CardNumberLastDigits = a.CardNumber.Substring(Math.Max(0, a.CardNumber.Length - 4))
            })
            .ToListAsync();

        if (creditCardsDTO == null || creditCardsDTO.Count == 0)
          return Ok(new { success = false, message = "User doesnt have any Credit Cards saved." });

        return Ok(new { success = true, message = "Cards saved!", creditCardsDTO });
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { success = false, message = ex.Message });
#else
        return StatusCode(500, new { success = false, message = "An error occurred." });
#endif
      }
    }

    [HttpPost("NewCard")]
    public async Task<ActionResult> NewCard()
    {
      try
      {
        string token = Request.Cookies["LoginToken"];
        if (string.IsNullOrEmpty(token))
          return Unauthorized(new { success = false, message = "Unauthorized - No Token" });

        User user = await _context.Users.FirstOrDefaultAsync(u => u.LoginToken == token);
        if (user == null || user.LoginTokenTimeout < DateTime.Now)
          return Unauthorized(new { success = false, message = "Unauthorized - False Token" });

        var cardholderName = Request.Form["cardholderName"].ToString().Trim();
        var cardNumber = Request.Form["cardNumber"].ToString().Replace(" ", "").Trim();
        var cardExpiry = Request.Form["cardExpiry"].ToString().Trim();
        var cardCVV = Request.Form["cardCVV"].ToString().Trim();


        if (string.IsNullOrWhiteSpace(cardholderName) ||
        string.IsNullOrWhiteSpace(cardNumber) ||
        string.IsNullOrWhiteSpace(cardExpiry) ||
        string.IsNullOrWhiteSpace(cardCVV))
        {
          return Ok(new { success = false, message = "All fields are required." });
        }

        if (!long.TryParse(cardNumber, out _) || cardNumber.Length < 13 || cardNumber.Length > 19)
        {
          return Ok(new { success = false, message = "Invalid card number. Must be 13–19 digits." });
        }

        if (cardExpiry.Length != 5 || cardExpiry[2] != '/')
        {
          return Ok(new { success = false, message = "Invalid expiry format. Use MM/YY." });
        }

        var monthStr = cardExpiry.Substring(0, 2);
        if (!int.TryParse(monthStr, out int month) || month < 1 || month > 12)
        {
          return Ok(new { success = false, message = "Invalid expiry month." });
        }

        if (cardCVV.Length > 4 || !int.TryParse(cardCVV, out _)) // with _ u can discard (check if you need manual discard)
        {
          return Ok(new { success = false, message = "Invalid CVV. Must be numeric and max 4 digits." });
        }

        CreditCard newCreditCard = new CreditCard
        {
          UserId = user.UserId,
          CardholderName = cardholderName,
          CardNumber = cardNumber,
          CardExpiry = cardExpiry,
          CardCvv = cardCVV,
        };

        // Add user to the database
        _context.CreditCards.Add(newCreditCard);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Card saved!"});
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { success = false, message = ex.Message });
#else
        return StatusCode(500, new { success = false, message = "An error occurred." });
#endif
      }
    }

    [HttpDelete("DelCard/{id}")]
    public async Task<ActionResult> DelCard(int id)
    {
      await using var transaction = await _context.Database.BeginTransactionAsync();

      try
      {
        string token = Request.Cookies["LoginToken"];
        if (string.IsNullOrEmpty(token))
          return Unauthorized(new { success = false, message = "Unauthorized" });

        var user = await _context.Users.FirstOrDefaultAsync(u => u.LoginToken == token);
        if (user == null)
          return Unauthorized(new { success = false, message = "Unauthorized" });

        var card = await _context.CreditCards.FirstOrDefaultAsync(c => c.UserId == user.UserId && c.CardId == id);
        if (card == null)
          return Ok(new { success = false, message = "Card not found or does not belong to user." });

        bool isInUse = await _context.Orders.AnyAsync(o => o.CardId == id);

        if (isInUse)
        {
          // Soft delete
          card.Deleted = true;
          card.DeleteDate = DateTime.Now;
          await _context.SaveChangesAsync();
          await transaction.CommitAsync();  
          return Ok(new { success = true, message = "Card deleted." });
        }
        else
        {
          // Hard delete
          _context.CreditCards.Remove(card);
          await _context.SaveChangesAsync();
          await transaction.CommitAsync();

          return Ok(new { success = true, message = "Card deleted!" });
        }
      }
      catch (Exception ex)
      {
#if DEBUG
        await transaction.RollbackAsync();  
        return StatusCode(500, new { success = false, message = ex.Message });
#else
    return StatusCode(500, new { success = false, message = "An error occurred." });
#endif
      }
    }

  }
}
