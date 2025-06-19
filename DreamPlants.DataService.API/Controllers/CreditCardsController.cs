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
        // 1 - Is there a token cookie
        string token = Request.Cookies["LoginToken"];
        if (string.IsNullOrEmpty(token))
          return Unauthorized(new { success = false, message = "Unauthorized" });
        // 2 - Is the token same as the DataBank one. 
        User user = await _context.Users.FirstOrDefaultAsync(u => u.LoginToken == token);
        if (user == null)
          return Unauthorized(new { success = false, message = "Unauthorized" });
        // 3 - with user.UserId find user adresses
        List<CreditCardDTO> creditCardsDTO = await _context.CreditCards
            .Where(a => a.UserId == user.UserId)
            .Select(a => new CreditCardDTO
            {
              CardId = a.CardId,
              CardNumberLastDigits = a.CardNumber.Substring(Math.Max(0, a.CardNumber.Length - 4))
            })
            .ToListAsync();

        // 4 - if no adresses send ok with a message (Check if you need to send notfound) 
        if (creditCardsDTO == null || creditCardsDTO.Count == 0)
          return Ok(new { success = true, message = "User doesnt have any adresses saved." });

        // Last - Return Adresses
        return Ok(new { success = true, message = "Address saved!", creditCardsDTO });
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { success = false, message = ex.Message });
#else
        return StatusCode(500, new { success = false, message = "An error occurred." });
#endif
      }
    } // GetCards

    [HttpPost("NewCard")]
    public async Task<ActionResult> NewCard()
    {
      try
      {
        string token = Request.Cookies["LoginToken"];
        if (string.IsNullOrEmpty(token))
          return Unauthorized(new { success = false, message = "Unauthorized - No Token" });

        User user = await _context.Users.FirstOrDefaultAsync(u => u.LoginToken == token);
        if (user == null)
          return Unauthorized(new { success = false, message = "Unauthorized - False Token" });

        var cardholderName = Request.Form["cardholderName"].ToString();
        var cardNumber = Request.Form["cardNumber"].ToString();
        var cardExpiry = Request.Form["cardExpiry"].ToString();
        var cardCVV = Request.Form["cardCVV"].ToString();


        if (string.IsNullOrWhiteSpace(cardholderName) ||
        string.IsNullOrWhiteSpace(cardNumber) ||
        string.IsNullOrWhiteSpace(cardExpiry) ||
        string.IsNullOrWhiteSpace(cardCVV))
        {
          return Ok(new { success = false, message = "All fields are required." });
        }

        CreditCard newCreditCard = new CreditCard
        {
          UserId = user.UserId,
          CardholderName = cardholderName,
          CardNumber = cardNumber,
          CardExpiry = cardExpiry,
          CardCVV = cardCVV,
        };

        // Add user to the database
        _context.CreditCards.Add(newCreditCard);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Address saved!"});
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { success = false, message = ex.Message });
#else
        return StatusCode(500, new { success = false, message = "An error occurred." });
#endif
      }
    } // NewAddress

    [HttpDelete("DelCard/{id}")]
    public async Task<ActionResult> DelCard(int id)
    {
      try
      {
        string token = Request.Cookies["LoginToken"];
        if (string.IsNullOrEmpty(token))
          return Unauthorized(new { success = false, message = "Unauthorized" });

        User user = await _context.Users.FirstOrDefaultAsync(u => u.LoginToken == token);
        if (user == null)
          return Unauthorized(new { success = false, message = "Unauthorized" });

        var card = await _context.CreditCards.FirstOrDefaultAsync(a => a.UserId == user.UserId && a.CardId == id);
        if (card == null)
          return Ok(new { success = false, message = "Card not found or does not belong to user." });

        _context.CreditCards.Remove(card);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Card deleted!" });
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { success = false, message = ex.Message });
#else
        return StatusCode(500, new { success = false, message = "An error occurred." });
#endif
      }
    } // DelAddress
  }
}
