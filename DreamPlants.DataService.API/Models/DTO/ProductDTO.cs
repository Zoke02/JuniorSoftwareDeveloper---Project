namespace DreamPlants.DataService.API.Models.DTO
{
  public class ProductDTO
  {
    public int ProductNumber { get; set; }
    public string Name { get; set; }
    public int SubcategoryId { get; set; }
    public string SubcategoryName { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; }
    public List<StockDTO> Stocks { get; set; }

    public List<FileDTO> Files { get; set; } = new();

  }
}
