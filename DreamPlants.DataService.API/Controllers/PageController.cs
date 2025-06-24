using DreamPlants.DataService.API.Data;
using DreamPlants.DataService.API.Models.DTO;
using DreamPlants.DataService.API.Models.Generated;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Linq;

namespace DreamPlants.DataService.API.Controllers
{
  [Route("[controller]")]
  [ApiController]

  public class PageController : ControllerBase
  {
    private readonly DreamPlantsContext _context;

    public PageController(DreamPlantsContext context)
    {
      _context = context;
    }

    [HttpGet("init")]
    public async Task<ActionResult<User>> PageInitUser()
    {
      try
      {
        // Check later why u dont need a Uri escape string here? wtf does the enitty framework do it for you?
        // 1. Auth check
        string token = Request.Cookies["LoginToken"];
        if (string.IsNullOrEmpty(token))
          return BadRequest(new { success = false, message = "Unauthorized Token" });

        User user = await _context.Users.FirstOrDefaultAsync(u => u.LoginToken == token);
        if (user == null)
          return BadRequest(new { success = false, message = "Unauthorized User" });


        // NICE! 
        if (user.LoginTokenTimeout < DateTime.Now)
        {
          return Ok(new { success = false, message = "Token Timeout" });
        }

        if (!user.UserStatus)
        {
          this.Response.Cookies.Delete("LoginToken");
          return Ok(new { success = false, message = "User Status: Disabled" });
        }

        // Dara Transfer Object - 
        UserDTO userDTO = new UserDTO
        {
          FirstName = user.FirstName,
          LastName = user.LastName,
          Email = user.Email,
          PhoneNumber = user.PhoneNumber,
          RoleId = user.RoleId,
          AvatarBase64 = user.AvatarBase64 != null ? Convert.ToBase64String(user.AvatarBase64) : null,
          AvatarFileType = user.AvatarFileType != null ? user.AvatarFileType : null
        };

        return Ok(userDTO);
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { message = ex.Message });
#else
        return StatusCode(500);
#endif
      }
    } // ApiGet (Init)

    [HttpGet("product&categorieslist")]
    public async Task<ActionResult<User>> PageProdCatList()
    {
      try
      {
        // Dara Transfer Object - 
        var categoriesList = await _context.Categories
        .Include(sc => sc.Subcategories).Select(c => new CategoryDTO
        {
          CategoryId = c.CategoryId,
          CategoryName = c.CategoryName,
          Subcategories = c.Subcategories.Select(sc => new SubcategoryDTO
          {
            SubcategoryId = sc.SubcategoryId,
            SubcategoryName = sc.SubcategoryName
          }).ToList()
        })
        .ToListAsync();

        var productsList = await _context.Products
        .Include(sc => sc.Subcategory)
        .ThenInclude(c => c.Category)
        .Include(s => s.Stocks)
        .Select(p => new ProductDTO
        {
          ProductNumber = p.ProductNumber,
          Name = p.Name,
          SubcategoryName = p.Subcategory.SubcategoryName,
          CategoryName = p.Subcategory.Category.CategoryName,
          Stocks = p.Stocks.Select(s => new StockDTO
          {
            StockUid = s.StockUid,
            StockNumber = s.StockNumber,
            VariantSize = s.VariantSize,
            Price = s.Price,
            Quantity = s.Quantity
          }).ToList()
        })
        .ToListAsync();
        return Ok(new
        {
          productsList,
          categoriesList
        });
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { message = ex.Message });
#else
        return StatusCode(500);
#endif
      }
    } // apiGet (product&categorieslist)

    [HttpGet("product&categorieslist/Filter")]
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

        // Parse query params into ID lists
        var catIdList = catIds.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(int.Parse)
                    .ToList();

        var subcatIdList = subcatIds.Split(',', StringSplitOptions.RemoveEmptyEntries)
                       .Select(int.Parse)
                       .ToList();

        var query = _context.Products
          .Include(p => p.Subcategory)
            .ThenInclude(c => c.Category)
          .Include(p => p.Stocks)
          .AsQueryable();

        if (catIdList.Any() && !subcatIdList.Any())
        {
          query = query.Where(p =>
            catIdList.Contains(p.Subcategory.Category.CategoryId));
        }
        else if (!catIdList.Any() && subcatIdList.Any())
        {
          query = query.Where(p =>
            subcatIdList.Contains(p.Subcategory.SubcategoryId));
        }
        else if (catIdList.Any() && subcatIdList.Any())
        {
          // Get subcats grouped by category
          var catToSubcatMap = _context.Categories
            .Include(c => c.Subcategories)
            .Where(c => catIdList.Contains(c.CategoryId))
            .ToDictionary(
              c => c.CategoryId,
              c => c.Subcategories.Select(s => s.SubcategoryId).ToList()
            );

          // Find subcategories that belong to selected categories but have NONE selected
          var includeFullCats = new List<int>();

          foreach (var catId in catIdList)
          {
            if (catToSubcatMap.TryGetValue(catId, out var subcatListInCat))
            {
              bool hasSelectedSubcat = subcatListInCat.Any(sid => subcatIdList.Contains(sid));
              if (!hasSelectedSubcat)
              {
                includeFullCats.Add(catId);
              }
            }
          }

          query = query.Where(p =>
            subcatIdList.Contains(p.Subcategory.SubcategoryId) ||
            includeFullCats.Contains(p.Subcategory.Category.CategoryId));
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
    } // apiGet (product&categorieslist/Filter)

    // PAGINATION
    [HttpGet("product&categorieslist/Paginated")]
    public async Task<ActionResult> GetPaginatedProducts(
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 10,
    [FromQuery] string catIds = "",
    [FromQuery] string subcatIds = "",
    [FromQuery] string sortBy = "newest",
    [FromQuery] string stockUids = ""
    )
    {
      try
      {
        // Parse filter params
        var catIdList = catIds.Split(',', StringSplitOptions.RemoveEmptyEntries)
          .Select(int.Parse).ToList();

        var subcatIdList = subcatIds.Split(',', StringSplitOptions.RemoveEmptyEntries)
          .Select(int.Parse).ToList();

        var query = _context.Products
          .Include(p => p.Subcategory)
            .ThenInclude(c => c.Category)
          .Include(p => p.Stocks)
          .Include(p => p.Files)
          .Where(p => p.Stocks.Any()) // Initial base filter
          .AsQueryable();

        // If filtering by stockUids
        if (!string.IsNullOrEmpty(stockUids))
        {
          var uidList = stockUids
            .Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(s => s.Trim())
            .ToList();

          query = query.Where(p => p.Stocks.Any(s => uidList.Contains(s.StockUid)));
        }

        // Additional filtering
        if (catIdList.Any() && !subcatIdList.Any())
        {
          query = query.Where(p => catIdList.Contains(p.Subcategory.Category.CategoryId));
        }
        else if (!catIdList.Any() && subcatIdList.Any())
        {
          query = query.Where(p => subcatIdList.Contains(p.Subcategory.SubcategoryId));
        }
        else if (catIdList.Any() && subcatIdList.Any())
        {
          var catToSubcatMap = _context.Categories
            .Include(c => c.Subcategories)
            .Where(c => catIdList.Contains(c.CategoryId))
            .ToDictionary(
              c => c.CategoryId,
              c => c.Subcategories.Select(s => s.SubcategoryId).ToList()
            );

          var includeFullCats = new List<int>();

          foreach (var catId in catIdList)
          {
            if (catToSubcatMap.TryGetValue(catId, out var subcatListInCat))
            {
              bool hasSelected = subcatListInCat.Any(sid => subcatIdList.Contains(sid));
              if (!hasSelected) includeFullCats.Add(catId);
            }
          }

          query = query.Where(p =>
            subcatIdList.Contains(p.Subcategory.SubcategoryId) ||
            includeFullCats.Contains(p.Subcategory.Category.CategoryId));
        }

        // DEV - Missing DTO
        if (sortBy == "bestseller")
        {
          // grorup all producs in order 
          var bestsellerQuery = _context.OrderProducts
            .GroupBy(op => op.Stock.ProductId)
            .Select(g => new
            {
              ProductId = g.Key,
              TotalSold = g.Sum(op => op.Quantity)
            });

          query = query
            .GroupJoin(bestsellerQuery,
              p => p.ProductId,
              b => b.ProductId,
              (p, b) => new { Product = p, TotalSold = b.Select(x => x.TotalSold).FirstOrDefault() })
            .OrderByDescending(x => x.TotalSold)
            .Select(x => x.Product);
        } else  // DEV

        // Sort
        if (sortBy == "newest")
        {
          query = query.OrderByDescending(p => p.Stocks.FirstOrDefault().StockId);
        }
        else if (sortBy == "asc")
        {
          query = query.OrderBy(p => p.Name);
        }
        else if (sortBy == "desc")
        {
          query = query.OrderByDescending(p => p.Name);
        }

        // Paginate
        var totalCount = await query.CountAsync();
        var products = await query
          .Skip((page - 1) * pageSize)
          .Take(pageSize)
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
            }).ToList(),
            Files = p.Files.Select(f => new FileDTO
            {
              FileId = f.FileId,
              FileName = f.FileName,
              FileType = f.FileType,
              FileData = null,
              FileBase64 = Convert.ToBase64String(f.FileData)
            }).ToList()
          })
          .ToListAsync();

        return Ok(new
        {
          totalCount,
          page,
          pageSize,
          items = products
        });
      }
      catch (Exception ex)
      {
#if DEBUG
        return StatusCode(500, new { message = ex.Message });
#else
		return StatusCode(500);
#endif
      }
    } // PAGINATION

    [HttpGet("shopcart/pricing")]
    public async Task<ActionResult<ShopCartPricingDTO>> GetShopCartPricing()
    {
      try
      {
        var shippingTaxEntries = await _context.ListPrices.ToListAsync();

        var tax = shippingTaxEntries.FirstOrDefault(p => p.Type?.ToLower() == "tax");
        var standard = shippingTaxEntries.FirstOrDefault(p => p.Label?.ToLower() == "standard");
        var rapid = shippingTaxEntries.FirstOrDefault(p => p.Label?.ToLower() == "express");
        var free = shippingTaxEntries.FirstOrDefault(p => p.Label?.ToLower() == "free");



        if (tax == null || standard == null || rapid == null || free == null)
          return Ok(new { success = false, message = "Pricing data incomplete." });

        var dto = new ShopCartPricingDTO
        {
          TaxMultiplier = tax.Value,
          ShippingStandard = standard.Value,
          ShippingExpress = rapid.Value,
          ShippingFree = free.Value
        };

        return Ok(new { success = true, message = "Stock updated.", dto });
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




  } // Class
} // Namespace
