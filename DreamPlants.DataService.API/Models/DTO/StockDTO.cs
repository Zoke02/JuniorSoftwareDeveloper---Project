namespace DreamPlants.DataService.API.Models.DTO
{
  public class StockDTO
  {
    public string VariantSize { get; set; }
    public string VariantColor { get; set; }
    public string VariantText { get; set; }


    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public string StockUid { get; set; }
    public int StockNumber { get; set; }
    public string Note { get; set; }
    public string CreatedBy { get; set; }

  }
}