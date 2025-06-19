namespace DreamPlants.DataService.API.Models.DTO
{
  public class CategoryDTO
  {
    public int CategoryId { get; set; }
    public string CategoryName { get; set; }
    public List<SubcategoryDTO> Subcategories { get; set; }
  }
}
