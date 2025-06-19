using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DreamPlants.DataService.API.Data;
using DreamPlants.DataService.API.Models.Generated;
using DreamPlants.DataService.API.Models.DTO;

namespace DreamPlants.DataService.API.Controllers
{
  [Route("[controller]")]
  [ApiController]
  public class ProductsController : ControllerBase
  {
    private readonly DreamPlantsContext _context;

    public ProductsController(DreamPlantsContext context)
    {
      _context = context;
    }

    // GET: Products/5
    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDTO>> GetProduct(string id)
    {
      try
      {
        // Security check if user logged in for the API.
        string token = Request.Cookies["LoginToken"];
        if (string.IsNullOrEmpty(token))
        {
          return Unauthorized();
        }
        User user = await _context.Users.FirstOrDefaultAsync(u => u.LoginToken == token);
        if (user == null)
        {
          return Unauthorized();
        } // Security End.
        else
        {
          var product = await _context.Products
          .Include(sc => sc.Subcategory)
              .ThenInclude(c => c.Category)
          .Include(s => s.Stocks)
          .Where(s => s.Stocks.Any(s => s.StockUid == id))
          .Select(p => new ProductDTO
          {
            Name = p.Name,
            CategoryName = p.Subcategory.Category.CategoryName,
            SubcategoryName = p.Subcategory.SubcategoryName,
            SubcategoryId = p.Subcategory.SubcategoryId,
            Stocks = p.Stocks.Select(s => new StockDTO
            {
              StockUid = s.StockUid,
              VariantSize = s.VariantSize,
              Price = s.Price,
              Quantity = s.Quantity,
              StockNumber = s.StockNumber
            }).ToList()
          })
          .FirstOrDefaultAsync();

          if (product == null)
          {
            return NotFound();
          }
          return Ok(product);
        }
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { message = ex.Message });
#else
        return StatusCode(500);
#endif
      }
    }// GET: Products/5

    // GET: Products/Category/5
    [HttpGet("Category/{id}")]
    public async Task<ActionResult<List<ProductDTO>>> GetProductByCategory(int id)
    {
      try
      {
        // Security check for the API.
        string token = Request.Cookies["LoginToken"];
        if (string.IsNullOrEmpty(token))
        {
          return Unauthorized();
        }
        User user = await _context.Users.FirstOrDefaultAsync(u => u.LoginToken == token);
        if (user == null)
        {
          return Unauthorized();
        } // Security End.
        else
        {
          var product = await _context.Products
          .Include(sc => sc.Subcategory)
              .ThenInclude(c => c.Category)
          .Include(p => p.Stocks)
          .Where(sc => sc.Subcategory.SubcategoryId == id)
          .Select(p => new ProductDTO
          {
            Name = p.Name,
            CategoryName = p.Subcategory.Category.CategoryName,
            SubcategoryName = p.Subcategory.SubcategoryName,
            Stocks = p.Stocks.Select(s => new StockDTO
            {
              StockUid = s.StockUid,
              VariantSize = s.VariantSize,
              Price = s.Price,
              Quantity = s.Quantity,
              StockNumber = s.StockNumber
            }).ToList()
          })
          .ToListAsync();

          if (product == null)
          {
            return NotFound();
          }
          return product;
        }
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { message = ex.Message });
#else
        return StatusCode(500);
#endif
      }
    }// GET: Products/Category/5

    // Products/Filter
    [HttpGet("Filter")]
    public async Task<ActionResult<List<ProductDTO>>> FilterProducts([FromQuery] string catIds = "", [FromQuery] string subcatIds = "")
    {
      try
      {
        // Security check
        string token = Request.Cookies["LoginToken"];
        if (string.IsNullOrEmpty(token))
          return Unauthorized();

        User user = await _context.Users.FirstOrDefaultAsync(u => u.LoginToken == token);
        if (user == null)
          return Unauthorized();

        // Parse ID strings to int lists
        var catIdList = catIds.Split(',', StringSplitOptions.RemoveEmptyEntries)
                              .Select(int.Parse)
                              .ToList();

        var subcatIdList = subcatIds.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                     .Select(int.Parse)
                                     .ToList();

        // Base query
        var query = _context.Products
          .Include(p => p.Subcategory)
            .ThenInclude(c => c.Category)
          .Include(p => p.Stocks)
          .AsQueryable();

        // Apply filters
        if (catIdList.Any())
        {
          query = query.Where(p => catIdList.Contains(p.Subcategory.Category.CategoryId));
        }

        if (subcatIdList.Any())
        {
          query = query.Where(p => subcatIdList.Contains(p.Subcategory.SubcategoryId));
        }

        var products = await query
          .Select(p => new ProductDTO
          {
            Name = p.Name,
            CategoryName = p.Subcategory.Category.CategoryName,
            SubcategoryName = p.Subcategory.SubcategoryName,
            SubcategoryId = p.Subcategory.SubcategoryId,
            Stocks = p.Stocks.Select(s => new StockDTO
            {
              StockUid = s.StockUid,
              VariantSize = s.VariantSize,
              Price = s.Price,
              Quantity = s.Quantity,
              StockNumber = s.StockNumber
            }).ToList()
          })
          .ToListAsync();

        return products;
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

















































    //// PUT: api/Products/5
    //// To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    //[HttpPut("{id}")]
    //public async Task<IActionResult> PutProduct(int id, Product product)
    //{
    //    if (id != product.ProductId)
    //    {
    //        return BadRequest();
    //    }

    //    _context.Entry(product).State = EntityState.Modified;

    //    try
    //    {
    //        await _context.SaveChangesAsync();
    //    }
    //    catch (DbUpdateConcurrencyException)
    //    {
    //        if (!ProductExists(id))
    //        {
    //            return NotFound();
    //        }
    //        else
    //        {
    //            throw;
    //        }
    //    }

    //    return NoContent();
    //}

    //// POST: api/Products
    //// To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    //[HttpPost]
    //public async Task<ActionResult<Product>> PostProduct(Product product)
    //{
    //    _context.Products.Add(product);
    //    await _context.SaveChangesAsync();

    //    return CreatedAtAction("GetProduct", new { id = product.ProductId }, product);
    //}

    //// DELETE: api/Products/5
    //[HttpDelete("{id}")]
    //public async Task<IActionResult> DeleteProduct(int id)
    //{
    //    var product = await _context.Products.FindAsync(id);
    //    if (product == null)
    //    {
    //        return NotFound();
    //    }

    //    _context.Products.Remove(product);
    //    await _context.SaveChangesAsync();

    //    return NoContent();
    //}

    //private bool ProductExists(int id)
    //{
    //    return _context.Products.Any(e => e.ProductId == id);
    //}
  }
}
