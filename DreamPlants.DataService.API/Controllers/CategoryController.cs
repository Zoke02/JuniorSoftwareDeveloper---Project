using DreamPlants.DataService.API.Data;
using DreamPlants.DataService.API.Models.DTO;
using DreamPlants.DataService.API.Models.Generated;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Xml.Linq;

namespace DreamPlants.DataService.API.Controllers
{
  [Route("[controller]")]
  [ApiController]
  public class CategoryController : Controller
  {

    private readonly DreamPlantsContext _context;

    // Always initialize in the constructor or els you will get a null reference exception.
    public CategoryController(DreamPlantsContext context)
    {
      _context = context;
    }

    [HttpGet("List")]
    public async Task<ActionResult> GetAllCategories()
    {
      try
      {
        // no securty for alter one as filter. FromQuery

        var categoriesDTO = await _context.Categories
          .Include(c => c.Subcategories)
          .OrderBy(c => c.CategoryId)
          .Select(c => new CategoryDTO
          {
            CategoryId = c.CategoryId,
            CategoryName = c.CategoryName,
            Subcategories = c.Subcategories
              .OrderBy(sc => sc.SubcategoryId)
              .Select(sc => new SubcategoryDTO
              {
                SubcategoryId = sc.SubcategoryId,
                SubcategoryName = sc.SubcategoryName
              })
              .ToList()
          })
          .ToListAsync();

        return Ok(new { success = true, message = "List of Categories", categoriesDTO });
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { success = false, message = ex.Message });
#else
		return StatusCode(500, new { success = false, message = "Failed to load categories." });
#endif
      }
    }

    [HttpPost("Add")]
    public async Task<ActionResult> AddCategory([FromBody] string dto)
    {
      try
      {
        var user = await ValidateAdminAsync();
        if (user == null) return Unauthorized();

        string name = dto.Trim();

        bool exists = await _context.Categories
          .AnyAsync(c => c.CategoryName.ToLower() == name.ToLower());

        if (exists)
          return Ok(new { success = false, message = "Category name already exists." });

        var category = new Category { CategoryName = name };
        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Category added." });
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { success = false, message = ex.Message });
#else
		return StatusCode(500, new { success = false, message = "Failed to add category." });
#endif
      }
    }

    [HttpPost("Rename")]
    public async Task<ActionResult> RenameCategory([FromBody] RenameDTO dto)
    {
      try
      {
        var user = await ValidateAdminAsync();
        if (user == null) return Unauthorized();

        var category = await _context.Categories.FindAsync(dto.Id);
        if (category == null)
          return NotFound(new { success = false, message = "Category not found." });

        string name = dto.NewName.Trim();
        if (string.IsNullOrWhiteSpace(name))
          return BadRequest(new { success = false, message = "Name cannot be empty." });

        // Check for duplicate name
        bool exists = await _context.Categories
          .AnyAsync(c => c.CategoryId != dto.Id && c.CategoryName.ToLower() == name.ToLower());

        if (exists)
          return Ok(new { success = false, message = "A category with this name already exists." });

        category.CategoryName = name;
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Category renamed." });
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { success = false, message = ex.Message });
#else
		return StatusCode(500, new { success = false, message = "Failed to rename category." });
#endif
      }
    }

    [HttpDelete("Delete/{id}")]
    public async Task<ActionResult> DeleteCategory(int id)
    {
      try
      {
        var user = await ValidateAdminAsync();
        if (user == null) return Unauthorized();

        var category = await _context.Categories
          .Include(c => c.Subcategories)
          .FirstOrDefaultAsync(c => c.CategoryId == id);

        if (category == null)
          return NotFound(new { success = false, message = "Category not found." });

        var subcatIds = category.Subcategories.Select(sc => sc.SubcategoryId).ToList();

        if (subcatIds.Any())
        {
          bool anyProductUsesSubcat = await _context.Products
            .AnyAsync(p => subcatIds.Contains(p.SubcategoryId));

          if (anyProductUsesSubcat)
            return Ok(new
            {
              success = false,
              message = "A product is using a subcategory in this category. You cannot delete it."
            });
        }

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Category deleted." });
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { success = false, message = ex.Message });
#else
		return StatusCode(500, new { success = false, message = "Failed to delete category." });
#endif
      }
    }

    [HttpPost("Subcategory/Add")]
    public async Task<ActionResult> AddSubcategory([FromBody] AddSubcategoryDTO dto)
    {
      try
      {
        var user = await ValidateAdminAsync();
        if (user == null) return Unauthorized();

        var category = await _context.Categories.FindAsync(dto.CategoryId);
        if (category == null)
          return NotFound(new { success = false, message = "Category not found." });

        bool exists = await _context.Subcategories
          .AnyAsync(s => s.CategoryId == dto.CategoryId && s.SubcategoryName.ToLower() == dto.Name.Trim().ToLower());

        if (exists)
          return Ok(new { success = false, message = "Subcategory already exists in this category." });


        var sub = new Subcategory
        {
          SubcategoryName = dto.Name.Trim(),
          CategoryId = dto.CategoryId
        };

        _context.Subcategories.Add(sub);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Subcategory added." });
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { success = false, message = ex.Message });
#else
		return StatusCode(500, new { success = false, message = "Failed to add subcategory." });
#endif
      }
    }

    [HttpPost("Subcategory/Rename")]
    public async Task<ActionResult> RenameSubcategory([FromBody] RenameDTO dto)
    {
      try
      {
        var user = await ValidateAdminAsync();
        if (user == null) return Unauthorized();

        // Load sub to get its CategoryId
        var sub = await _context.Subcategories.FindAsync(dto.Id);
        if (sub == null)
          return NotFound(new { success = false, message = "Subcategory not found." });

        string name = dto.NewName.Trim();

        // Check for duplicate in the same category
        bool exists = await _context.Subcategories
          .AnyAsync(s =>
            s.CategoryId == sub.CategoryId &&
            s.SubcategoryId != dto.Id &&
            s.SubcategoryName.ToLower() == name.ToLower()
          );

        if (exists)
          return Ok(new { success = false, message = "A subcategory with this name already exists in this category." });

        sub.SubcategoryName = name;
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Subcategory renamed." });
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { success = false, message = ex.Message });
#else
		return StatusCode(500, new { success = false, message = "Failed to rename subcategory." });
#endif
      }
    }

    [HttpDelete("Subcategory/Delete/{id}")]
    public async Task<ActionResult> DeleteSubcategory(int id)
    {
      try
      {
        var user = await ValidateAdminAsync();
        if (user == null) return Unauthorized();

        var sub = await _context.Subcategories.FindAsync(id);
        if (sub == null)
          return NotFound(new { success = false, message = "Subcategory not found." });

        bool subcatInUse = await _context.Products.AnyAsync(p => p.SubcategoryId == id);
        if (subcatInUse)
          return Ok(new { success = false, message = "A product is using this subcategory. You cannot delete it." });

        _context.Subcategories.Remove(sub);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Subcategory deleted." });
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { success = false, message = ex.Message });
#else
		return StatusCode(500, new { success = false, message = "Failed to delete subcategory." });
#endif
      }
    }

    private async Task<User> ValidateAdminAsync()
    {
      string token = Request.Cookies["LoginToken"];
      if (string.IsNullOrEmpty(token)) return null;

      var user = await _context.Users.FirstOrDefaultAsync(u => u.LoginToken == token);
      if (user == null || user.LoginTokenTimeout < DateTime.Now) return null;

      if (user.RoleId != 1 && user.RoleId != 2) return null;

      return user;
    }

  }
}
