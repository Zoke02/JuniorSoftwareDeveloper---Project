namespace DreamPlants.DataService.API.Models.DTO
{
  public class CategoryDTO
  {
    public int CategoryId { get; set; }
    public string CategoryName { get; set; }
    public List<SubcategoryDTO> Subcategories { get; set; }
  }
  public class RenameDTO
  {
    public int Id { get; set; }
    public string NewName { get; set; }
  }

  public class AddSubcategoryDTO
  {
    public int CategoryId { get; set; }
    public string Name { get; set; }
  }

}
