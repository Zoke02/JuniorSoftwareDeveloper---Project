using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DreamPlants.DataService.API.Data;
using DreamPlants.DataService.API.Models.Generated;
using System.Security.Cryptography;
using System.Text;
using Humanizer;
using DreamPlants.DataService.API.Models.DTO;
using Microsoft.AspNetCore.Http.HttpResults;

namespace DreamPlants.DataService.API.Controllers
{
  [Route("[controller]")]
  [ApiController]
  public class UsersController : ControllerBase
  {
    private readonly DreamPlantsContext _context;

    // Always initialize in the constructor or els you will get a null reference exception.
    public UsersController(DreamPlantsContext context)
    {
        _context = context;
    }

    [HttpPost("Login")]
    public async Task<ActionResult<User>> Login()
    {
      try
      {
        if (string.IsNullOrEmpty(this.Request.Form["email"]) || string.IsNullOrEmpty(this.Request.Form["password"]))
        {
          return Ok(new { success = false, message = "Email and Password are required!" });
        }

        User user = await _context.Users.FirstOrDefaultAsync(user => user.Email == this.Request.Form["email"].ToString());

        if (user != null && user.CheckPassword(this.Request.Form["password"]))
        {
          // First save changers then send the DataTransferObject you dumbass.
          user.LoginTokenLastLog = DateTime.Now;
          // Remember me if statement.
          if (this.Request.Form["remember"] == "true")
          {
            user.LoginTokenTimeout = DateTime.Now.AddDays(30);
          } else
          {
            user.LoginTokenTimeout = DateTime.Now.AddDays(1);
          }
          // Login Token
          SHA512 sha = SHA512.Create();
          user.LoginToken = Convert.ToBase64String(sha.ComputeHash(Encoding.UTF8.GetBytes($"{user.Email} {DateTime.Now:yyyyMMddHHmmssfff}")));
          // Now set the cookie to the users browser.
          this.Response.Cookies.Append("LoginToken", user.LoginToken, new CookieOptions()
          {
            Expires = user.LoginTokenTimeout.Value,
            SameSite = SameSiteMode.Unspecified,
            Secure = true
          });
          // Dara Transfer Object
          UserDTO userDTO = new UserDTO{
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            RoleId = user.RoleId,
            //LoginToken = user.LoginToken,
          };

          await _context.SaveChangesAsync();
          return Ok(new { success = true, message = "Login successful!", user = userDTO });
        }
        return Unauthorized(new { success = false, message = "Invalid Email/Password!" });
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { success = false, message = ex.Message });
#else
        return StatusCode(500, new { success = false, message = "An error occurred." });
#endif
      }
    } // Login

    [HttpPost("Register")]
    public async Task<ActionResult<User>> Register()
    {
      try
      {
        // Varriables
        var email = Request.Form["email"].ToString();
        var password = Request.Form["password"].ToString();
        var firstName = Request.Form["firstName"].ToString();
        var lastName = Request.Form["lastName"].ToString();
        var phone = Request.Form["phone"].ToString();
        var remember = Request.Form["remember"].ToString() == "true";
        var days = remember ? 30 : 1;


        // Basic validation
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName) || string.IsNullOrWhiteSpace(phone))
          return Ok(new { success = false, message = "All fields must be filled." });

        if (_context.Users.Any(p => p.PhoneNumber == phone))
          return Ok(new { success = false, message = "Phone already registered." });

        if (_context.Users.Any(u => u.Email == email))
          return Ok(new { success = false, message = "Email already registered." });

        // Create user
        User newUser = new User
        {
          Email = email,
          FirstName = firstName,
          LastName = lastName,
          PhoneNumber = phone,
          RoleId = 3, // Customer
          LoginTokenLastLog = DateTime.Now,
          LoginTokenTimeout = DateTime.Now.AddDays(days)
        };

        // SetPassword new Method
        newUser.setPassword(password);

        // Login Token
        SHA512 sha = SHA512.Create();
        newUser.LoginToken = Convert.ToBase64String(sha.ComputeHash(Encoding.UTF8.GetBytes($"{newUser.Email} {DateTime.Now:yyyyMMddHHmmssfff}")));
        // Now set the cookie to the users browser.
        this.Response.Cookies.Append("LoginToken", newUser.LoginToken, new CookieOptions()
        {
          Expires = newUser.LoginTokenTimeout.Value,
          SameSite = SameSiteMode.Unspecified,
          Secure = true
        });

        // Add user to the database
        _context.Users.Add(newUser);
        await _context.SaveChangesAsync();

        // Dara Transfer Object 
        UserDTO userDTO = new UserDTO
        {
          FirstName = newUser.FirstName,
          LastName = newUser.LastName,
          Email = newUser.Email,
          PhoneNumber = newUser.PhoneNumber,
          RoleId = newUser.RoleId,
        };

        // Success response
        return Ok(new { success = true, message = "Registration successful!", user = userDTO });
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { success = false, message = ex.Message });
#else
        return StatusCode(500, new { success = false, message = "An error occurred." });
#endif
      }
    } // Register

    [HttpPost("ValidatePassword")]
    public async Task<ActionResult<User>> ValidatePassword()
    {
      try
      {
        string token = Request.Cookies["LoginToken"];
        if (string.IsNullOrEmpty(token))
          return Unauthorized();

        User user = await _context.Users.FirstOrDefaultAsync(u => u.LoginToken == token);
        if (user == null)
          return Unauthorized();

        string oldPass = Request.Form["oldPassword"];

        if (!user.CheckPassword(oldPass))
        {
          return Ok(new { success = false, message = "Old password is incorrect." });
        }

        return Ok(new { success = true, message = "Password match successfully." });
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { message = ex.Message });
#else
		return StatusCode(500, new { message = "An error occurred." });
#endif
      }
    } // ValidatePassword

    [HttpPut("UpdateUser")]
    public async Task<ActionResult<User>> UpdateUser([FromForm] UserDTO dto)
    {
      try
      {
        string token = Request.Cookies["LoginToken"];
        if (string.IsNullOrEmpty(token))
          return Ok(new { success = false, message = "Unauthorized!" });

        User user = await _context.Users.FirstOrDefaultAsync(u => u.LoginToken == token);

        if (user != null)
        {
          user.FirstName = dto.FirstName?.Trim();
          user.LastName = dto.LastName?.Trim();
          user.PhoneNumber = dto.PhoneNumber?.Trim();
          user.Email = dto.Email?.Trim();

          if (!string.IsNullOrWhiteSpace(dto.NewPassword))
          {
            user.setPassword(dto.NewPassword.Trim());
          }

          await _context.SaveChangesAsync();

          var updatedUser = new UserDTO
          {
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            RoleId = user.RoleId
          };

          return Ok(new { success = true, message = "User Profile Updated!", user = updatedUser });
        }

        return Ok(new { success = false, message = "Unauthorized!"});

      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { success = false, message = ex.Message });
#else
        return StatusCode(500, new { success = false, message = "An error occurred." });
#endif
      }
    } // UpdateUser

  }
}
