namespace DreamPlants.DataService.API.Models.DTO
{
  public class ShopCartCalculateDTO
  {
    public string ShippingType { get; set; } = "standard";
    public List<CartItemDTO> Items { get; set; } = new();
  }

  public class OrderCreateDTO
  {
    public int AddressId { get; set; }
    public int CardId { get; set; }
    public string ShippingType { get; set; } = "standard";
    public List<CartItemDTO> Items { get; set; } = new();
  }

  public class CartItemDTO
  {
    public string StockUid { get; set; }
    public int Quantity { get; set; }
  }
}
