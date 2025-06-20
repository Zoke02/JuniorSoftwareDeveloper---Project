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
        string token = Request.Cookies["LoginToken"];
        if (string.IsNullOrEmpty(token))
          return Unauthorized(new { success = false, message = "Unauthorized Token" });
        // 2 - Is the token same as the DataBank one. 
        User user = await _context.Users.FirstOrDefaultAsync(u => u.LoginToken == token);
        if (user == null)
          return Unauthorized(new { success = false, message = "Unauthorized User" });
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
            CategoryId = p.Subcategory.Category.CategoryId,
            CategoryName = p.Subcategory.Category.CategoryName,
            SubcategoryId = p.Subcategory.SubcategoryId,
            SubcategoryName = p.Subcategory.SubcategoryName,
            Stocks = p.Stocks
            .Where(s => s.StockUid == id)
            .Select(s => new StockDTO
            {
              StockUid = s.StockUid,
              VariantSize = s.VariantSize,
              VariantColor = s.VariantColor,
              VariantText = s.VariantText,
              Price = s.Price,
              Quantity = s.Quantity,
              StockNumber = s.StockNumber,
              Note = s.Note,
              CreatedBy = s.CreatedBy,
            }).ToList(),
            Files = p.Files.Select(f => new FileDTO
            {
              FileId = f.FileId,
              FileName = f.FileName,
              FileType = f.FileType,
              FileData = f.FileData
            }).ToList()

          })
          .FirstOrDefaultAsync();

          if (product == null)
          {
            return Ok(new { success = false, message = "Product not found!" });
          }
          return Ok(new { success = true, message = "Login successful!", product });
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
    }// GET: id

    [HttpPost("AddProduct")]
    public async Task<ActionResult> AddProduct([FromBody] ProductDTO dto)
    {
      await using var transaction = await _context.Database.BeginTransactionAsync();

      try
      {
        string token = Request.Cookies["LoginToken"];
        if (string.IsNullOrEmpty(token))
          return Unauthorized(new { success = false, message = "Unauthorized Token" });

        User user = await _context.Users.FirstOrDefaultAsync(u => u.LoginToken == token);
        if (user == null)
          return Unauthorized(new { success = false, message = "Unauthorized User" });

        // check if Name is empty
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
          return Ok(new { success = false, message = "Product name needed." });
        }
        //check for duplicate product name
        bool nameExists = await _context.Products
            .AnyAsync(p => p.Name.ToLower() == dto.Name.ToLower());

        if (nameExists)
        {
          return Ok(new { success = false, message = "A product with this name already exists." });
        }

        // Variant Validation if i have time i have it in frontend

        // check price format (assuming one stock per product for now) CHECK PREDICATE 
        if (dto.Stocks.Any(s =>
            s.Price <= 0 ||                      // must be greater than 0
            s.Price > 9999999.99m ||             // must be within allowed range
            decimal.Round(s.Price, 2) != s.Price // must have max 2 decimal places
            
        ))
        {
          return Ok(new { success = false, message = "Invalid price: must be greater than 0, max 9999999.99, and up to 2 decimal places." });
        }

        if (dto.SubcategoryId <= 0 || dto.CategoryId <= 0)
        {
          return Ok(new { success = false, message = "You must select a subcategory." });
        }

        // validate stock number uniqueness
        bool stockNumberExists = await _context.Stocks
            .AnyAsync(s => s.StockNumber == dto.Stocks[0].StockNumber);
        if (stockNumberExists)
        {
          return Ok(new { success = false, message = "Stock number already exists." });
        }

        // get category from subcategory
        var subcategory = await _context.Subcategories
            .Include(sc => sc.Category)
            .FirstOrDefaultAsync(sc => sc.SubcategoryId == dto.SubcategoryId);

        var random = new Random();
        string stockUid = random.Next(10000000, 99999999).ToString();

        var product = new Product
        {
          Name = dto.Name,
          SubcategoryId = dto.SubcategoryId,
          Subcategory = subcategory,
          Stocks = dto.Stocks.Select(s => new Stock
          {
            StockUid = stockUid,
            VariantSize = s.VariantSize,
            VariantColor = s.VariantColor,
            VariantText = s.VariantText,
            Price = s.Price,
            Quantity = s.Quantity,
            StockNumber = s.StockNumber,
            Note = s.Note,
            UserId = user.UserId,
            CreatedAt = DateTime.Now,
            CreatedBy = user.FirstName + " " + user.LastName,
          }).ToList(),
          Files = dto.Files.Select(f => new Models.Generated.File
          {
            FileName = f.FileName,
            FileType = f.FileType,
            FileData = f.FileData,
            UploadedAt = DateTime.Now
          }).ToList()
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return Ok(new { success = true, message = "Product created.", stockUid });
      }
      catch (Exception ex)
      {
        await transaction.RollbackAsync();
#if DEBUG
        return StatusCode(500, new { message = ex.Message });
#else
        return StatusCode(500);
#endif
      }
    } // AddProduct

    [HttpPost("UpdateProduct/{stockUid}")]
    public async Task<ActionResult> UpdateProduct(string stockUid, [FromBody] ProductDTO dto)

    {
      await using var transaction = await _context.Database.BeginTransactionAsync();

      try
      {
        string token = Request.Cookies["LoginToken"];
        if (string.IsNullOrEmpty(token))
          return Unauthorized(new { success = false, message = "Unauthorized Token" });

        User user = await _context.Users.FirstOrDefaultAsync(u => u.LoginToken == token);
        if (user == null)
          return Unauthorized(new { success = false, message = "Unauthorized User" });

        if (string.IsNullOrWhiteSpace(dto.Name))
          return Ok(new { success = false, message = "Product name needed." });

        if (dto.Stocks.Any(s =>
          string.IsNullOrWhiteSpace(s.VariantSize) &&
          string.IsNullOrWhiteSpace(s.VariantText)))
        {
          return Ok(new
          {
            success = false,
            message = "Each stock must have at least a Variant Size or a Variant Text."
          });
        }

        if (dto.Stocks.Any(s =>
          s.Price <= 0 ||
          s.Price > 9999999.99m ||
          decimal.Round(s.Price, 2) != s.Price))
        {
          return Ok(new { success = false, message = "Invalid price format." });
        }

        if (dto.SubcategoryId <= 0 || dto.CategoryId <= 0)
        {
          return Ok(new { success = false, message = "You must select a subcategory." });
        }

        var product = await _context.Products
          .Include(p => p.Stocks)
          .Include(p => p.Files)
          .Include(p => p.Subcategory)
          .FirstOrDefaultAsync(p => p.Stocks.Any(s => s.StockUid == stockUid));

        if (product == null)
          return NotFound(new { success = false, message = "Product not found." });

        // Check if new name already exists in another product
        if (dto.Name.ToLower() != product.Name.ToLower())
        {
          bool nameExists = await _context.Products
            .AnyAsync(p => p.Name.ToLower() == dto.Name.ToLower());
          if (nameExists)
            return Ok(new { success = false, message = "A product with this name already exists." });
        }

        // Update product
        product.Name = dto.Name;
        product.SubcategoryId = dto.SubcategoryId;

        // Update stock
        var stock = product.Stocks.FirstOrDefault(s => s.StockUid == stockUid);
        if (stock != null)
        {
          stock.VariantSize = dto.Stocks[0].VariantSize;
          stock.VariantColor = dto.Stocks[0].VariantColor;
          stock.VariantText = dto.Stocks[0].VariantText;
          stock.Price = dto.Stocks[0].Price;
          stock.Quantity = dto.Stocks[0].Quantity;
          stock.StockNumber = dto.Stocks[0].StockNumber;
          stock.Note = dto.Stocks[0].Note;
        }

        // Replace files
        _context.Files.RemoveRange(product.Files);
        product.Files = dto.Files.Select(f => new Models.Generated.File
        {
          FileName = f.FileName,
          FileType = f.FileType,
          FileData = f.FileData,
          UploadedAt = DateTime.Now
        }).ToList();

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return Ok(new { success = true, message = "Product updated." });
      }
      catch (Exception ex)
      {
        await transaction.RollbackAsync();
#if DEBUG
        return StatusCode(500, new { message = ex.Message });
#else
		return StatusCode(500);
#endif
      }
    } // UpdateProduct

    [HttpDelete("DeleteProduct/{stockUid}")]
    public async Task<ActionResult> DeleteProduct(string stockUid)
    {
      try
      {
        string token = Request.Cookies["LoginToken"];
        if (string.IsNullOrEmpty(token))
          return Unauthorized(new { success = false, message = "Unauthorized Token" });

        var user = await _context.Users.FirstOrDefaultAsync(u => u.LoginToken == token);
        if (user == null)
          return Unauthorized(new { success = false, message = "Unauthorized User" });

        var product = await _context.Products
          .Include(p => p.Stocks)
          .Include(p => p.Files)
          .FirstOrDefaultAsync(p => p.Stocks.Any(s => s.StockUid == stockUid));

        if (product == null)
          return Ok(new { success = false, message = "Product not found." });

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Product deleted." });
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { success = false, message = ex.Message });
#else
		return StatusCode(500);
#endif
      }
    } // DeleteProduct

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
    }// GET: Category/id

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
    } // FILTER


    // STOCK
    [HttpPost("AdjustStock/{adjust}")]
    public async Task<ActionResult> AdjustStock(string adjust, [FromBody] AdjustStockDTO dto)
    {
      try
      {
        string token = Request.Cookies["LoginToken"];
        if (string.IsNullOrEmpty(token))
          return Unauthorized(new { success = false, message = "Unauthorized Token" });

        var user = await _context.Users.FirstOrDefaultAsync(u => u.LoginToken == token);
        if (user == null)
          return Unauthorized(new { success = false, message = "Unauthorized User" });

        var stock = await _context.Stocks.FirstOrDefaultAsync(s => s.StockUid == dto.StockUid);
        if (stock == null)
          return NotFound(new { success = false, message = "Stock not found." });

        int newQuantity;
        if (adjust.ToLower() == "positiv")
        {
          newQuantity = stock.Quantity + dto.Amount;
        }
        else if (adjust.ToLower() == "negativ")
        {
          newQuantity = stock.Quantity - dto.Amount;
          if (newQuantity < 0)
            return Ok(new { success = false, message = "Quantity cannot be negative." });
        }
        else
        {
          return BadRequest(new { success = false, message = "Invalid adjust parameter. Use 'positiv' or 'negativ'." });
        }

        stock.Quantity = newQuantity;
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Stock updated.", newQuantity });
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { success = false, message = ex.Message });
#else
        return StatusCode(500);
#endif
      }
    }

    // IMAGE
    [HttpDelete("DeleteFile/{fileId}")]
    public async Task<ActionResult> DeleteFile(int fileId)
    {
      try
      {
        string token = Request.Cookies["LoginToken"];
        if (string.IsNullOrEmpty(token))
          return Unauthorized(new { success = false, message = "Unauthorized Token" });

        var user = await _context.Users.FirstOrDefaultAsync(u => u.LoginToken == token);
        if (user == null)
          return Unauthorized(new { success = false, message = "Unauthorized User" });

        var file = await _context.Files.FindAsync(fileId);
        if (file == null)
          return NotFound(new { success = false, message = "File not found." });

        _context.Files.Remove(file);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "File deleted successfully." });
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { success = false, message = ex.Message });
#else
        return StatusCode(500);
#endif
      }
    }


  }
}
