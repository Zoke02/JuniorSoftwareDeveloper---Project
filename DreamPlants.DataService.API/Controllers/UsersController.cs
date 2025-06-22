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

        string email = this.Request.Form["email"].ToString();
        string password = this.Request.Form["password"].ToString();
        User user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

        if (user == null || !user.CheckPassword(password))
        {
          return Ok(new { success = false, message = "Invalid email or password!" });
        }

        if (!user.UserStatus)
        {
          this.Response.Cookies.Delete("LoginToken");
          return Ok(new { success = false, message = "User Status: Disabled!" }); // check init aswell if user gets disabled while logged in.
        }

        SHA512 sha = SHA512.Create();
        user.LoginToken = Convert.ToBase64String(sha.ComputeHash(Encoding.UTF8.GetBytes($"{user.Email} {DateTime.Now:yyyyMMddHHmmssfff}")));
        user.LoginTokenLastLog = DateTime.Now;
        if (this.Request.Form["remember"] == "true")
        {
          user.LoginTokenTimeout = DateTime.Now.AddDays(30);
        }
        else
        {
          user.LoginTokenTimeout = DateTime.Now.AddDays(1);
        }


        this.Response.Cookies.Append("LoginToken", user.LoginToken, new CookieOptions
        {
          Expires = user.LoginTokenTimeout.Value,
          SameSite = SameSiteMode.Unspecified,
          Secure = true
        });

        UserDTO userDTO = new UserDTO
        {
          FirstName = user.FirstName,
          LastName = user.LastName,
          Email = user.Email,
          PhoneNumber = user.PhoneNumber,
          RoleId = user.RoleId,
          AvatarBase64 = user.AvatarBase64 != null ? Convert.ToBase64String(user.AvatarBase64) : null,
          AvatarFileType = user.AvatarFileType
        };

        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = "Login successful!", user = userDTO });
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
    // Login

    [HttpPost("Logout")]
    public async Task<ActionResult> Logout()
    {
      try
      {
        string token = Request.Cookies["LoginToken"];

        User user = await _context.Users.FirstOrDefaultAsync(u => u.LoginToken == token);
        if (user != null)
        {
          user.LoginToken = null;
          user.LoginTokenTimeout = null;

          // DSouble Check? ...why sometimes gives error only the entity god knows
          _context.Entry(user).Property(u => u.LoginToken).IsModified = true;
          _context.Entry(user).Property(u => u.LoginTokenTimeout).IsModified = true;
        // save
          await _context.SaveChangesAsync();
        }

        this.Response.Cookies.Delete("LoginToken");

        return Ok(new { success = true, message = "Logout successful!" });
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
    // Logout

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
          LoginTokenTimeout = DateTime.Now.AddDays(days),
          UserStatus = true
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
            RoleId = user.RoleId,
            AvatarBase64 = user.AvatarBase64 != null ? Convert.ToBase64String(user.AvatarBase64) : null,
            AvatarFileType = user.AvatarFileType != null ? user.AvatarFileType : null

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

    [HttpPost("UploadPicture")]
    public async Task<ActionResult> UploadPicture()
    {
      try
      {
        // 1. Auth check
        string token = Request.Cookies["LoginToken"];
        if (string.IsNullOrEmpty(token))
          return BadRequest(new { success = false, message = "Unauthorized Token" });

        User user = await _context.Users.FirstOrDefaultAsync(u => u.LoginToken == token);
        if (user == null)
          return BadRequest(new { success = false, message = "Unauthorized User" });

        // 2. Extract form data
        var imageBase64 = Request.Form["image64Bit"].ToString();
        var imageType = Request.Form["imageType"].ToString();

        // 3. Validate size like 3 mb
        int estimatedBytes = (int)(imageBase64.Length * 0.75);
        if (estimatedBytes > 3 * 1024 * 1024) 
        {
          return BadRequest(new { success = false, message = "Image is too large. Max 3MB allowed." });
        }

        // 4. Validate file extension
        if (imageType != "png" && imageType != "jpg" && imageType != "jpeg")
        {
          return BadRequest(new { success = false, message = "Only .png, .jpg, or .jpeg allowed." });
        }

        // 5. Convert base64 to byte[]
        byte[] imageBytes;
        try
        {
          imageBytes = Convert.FromBase64String(imageBase64);
        }
        catch
        {
          return BadRequest(new { success = false, message = "Invalid base64 image data." });
        }

        // 6. Check if replacing existing image
        bool isReplacing = user.AvatarBase64 != null;

        // 7. Save to DB
        user.AvatarBase64 = imageBytes;
        user.AvatarFileType = imageType;

        await _context.SaveChangesAsync();

        return Ok(new
        {
          success = true,
          message = isReplacing ? "Profile image updated." : "Profile image uploaded." // is it upload or new add?
        });
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { success = false, message = ex.Message });
#else
    return StatusCode(500, new { success = false, message = "An error occurred." });
#endif
      }
    } // UploadPicture

  }
}
