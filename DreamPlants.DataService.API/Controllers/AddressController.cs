using DreamPlants.DataService.API.Data;
using DreamPlants.DataService.API.Models.DTO;
using DreamPlants.DataService.API.Models.Generated;
using Microsoft.AspNetCore.Mvc;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.Web.CodeGenerators.Mvc.Templates.BlazorIdentity.Pages.Manage;
using Npgsql;
using System.Security.Cryptography;
using System.Text;

namespace DreamPlants.DataService.API.Controllers
{
  [Route("[controller]")]
  [ApiController]
  public class AddressController : ControllerBase
  {
    private readonly DreamPlantsContext _context;

    public AddressController(DreamPlantsContext context)
    {
      _context = context;
    } // Constructor

    [HttpGet("GetAddresses")]
    public async Task<ActionResult> GetAddresses()
    {
      try
      {
        string token = Request.Cookies["LoginToken"];
        if (string.IsNullOrEmpty(token))
          return Unauthorized(new { success = false, message = "Unauthorized" });

        User user = await _context.Users.FirstOrDefaultAsync(u => u.LoginToken == token);
        if (user == null || user.UserStatus == false)
          return Unauthorized(new { success = false, message = "Unauthorized" });

        if (user.LoginTokenTimeout < DateTime.Now)
          return Unauthorized(new { success = false, message = "Unauthorized - Login token expired. Please login again. " });


        List<AddressDTO> addressesDTO = await _context.Addresses
            .Where(a => a.UserId == user.UserId && !a.Deleted)
            .Select(a => new AddressDTO
            {
              AddressId = a.AddressId,
              Street = a.Street,
              HouseNr = a.HouseNr,
              Door = a.Door,
              City = a.City,
              PostalCode = a.PostalCode,
              FirstName = a.FirstName,
              LastName = a.LastName
            })
            .ToListAsync();

        if (addressesDTO == null || addressesDTO.Count == 0)
          return Ok(new { success = false, message = "User doesnt have any adresses saved." });

        return Ok(new { success = true, message = "Addresses found!", addressesDTO });
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { success = false, message = ex.Message });
#else
        return StatusCode(500, new { success = false, message = "An error occurred." });
#endif
      }
    } // GetAddresses

    [HttpPost("NewAddress")]
    public async Task<ActionResult> NewAddress()
    {
      try
      {
        string token = Request.Cookies["LoginToken"];
        if (string.IsNullOrEmpty(token))
          return Unauthorized(new { success = false, message = "Unauthorized" });

        User user = await _context.Users.FirstOrDefaultAsync(u => u.LoginToken == token);
        if (user == null || user.UserStatus == false)
          return Unauthorized(new { success = false, message = "Unauthorized" });

        if (user.LoginTokenTimeout < DateTime.Now)
          return Unauthorized(new { success = false, message = "Unauthorized - Login token expired. Please login again. " });

        var firstName = Request.Form["addressFirstName"].ToString();
        var lastName = Request.Form["addressLastName"].ToString();
        var street = Request.Form["addressStreet"].ToString();
        var houseNr = Request.Form["addressHouseNr"].ToString();
        var door = Request.Form["addressDoor"].ToString();
        var city = Request.Form["addressCity"].ToString();
        var postalCode = Request.Form["addressPostalCode"].ToString();

        if (string.IsNullOrWhiteSpace(firstName) ||
        string.IsNullOrWhiteSpace(lastName) ||
        string.IsNullOrWhiteSpace(street) ||
        string.IsNullOrWhiteSpace(houseNr) ||
        string.IsNullOrWhiteSpace(door) ||
        string.IsNullOrWhiteSpace(city) ||
        string.IsNullOrWhiteSpace(postalCode))
        {
          return Ok(new { success = false, message = "All fields are required." });
        }

        Address newAddress = new Address
        {
          UserId = user.UserId,
          FirstName = firstName,
          LastName = lastName,
          Street = street,
          HouseNr = houseNr,
          Door = door,
          City = city,
          PostalCode = postalCode,
        };

        _context.Addresses.Add(newAddress);
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

    [HttpDelete("DelAddress/{id}")]
    public async Task<ActionResult> DelAddress(int id)
    {
      await using var transaction = await _context.Database.BeginTransactionAsync();
      try
      {
        string token = Request.Cookies["LoginToken"];
        if (string.IsNullOrEmpty(token))
          return Unauthorized(new { success = false, message = "Unauthorized" });

        User user = await _context.Users.FirstOrDefaultAsync(u => u.LoginToken == token);
        if (user == null || user.UserStatus == false)
          return Unauthorized(new { success = false, message = "Unauthorized" });

        if (user.LoginTokenTimeout < DateTime.Now)
          return Unauthorized(new { success = false, message = "Unauthorized - Login token expired. Please login again. " });

        var address = await _context.Addresses.FirstOrDefaultAsync(a => a.UserId == user.UserId && a.AddressId == id);
        if (address == null)
          return Ok(new { success = false, message = "Address not found or does not belong to user." });


        bool isInUse = await _context.Orders.AnyAsync(o => o.AddressId == id);
        if (isInUse)
        {
          // Soft delete
          address.Deleted = true;
          address.DeleteDate = DateTime.Now;
          await _context.SaveChangesAsync();
          await transaction.CommitAsync();

          return Ok(new { success = true, message = "Address deleted." });
        }
        else
        {
          // Hard delete
          _context.Addresses.Remove(address);
          await _context.SaveChangesAsync();
          await transaction.CommitAsync();
          return Ok(new { success = true, message = "Address deleted!" });
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
    } // DelAddress with Transaction
  }
}
