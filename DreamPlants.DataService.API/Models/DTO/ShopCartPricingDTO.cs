namespace DreamPlants.DataService.API.Models.DTO
{
  public class ShopCartPricingDTO
  {
    public decimal TaxMultiplier { get; set; }
    public decimal ShippingStandard { get; set; }
    public decimal ShippingExpress { get; set; }
    public decimal ShippingFree { get; set; }

  }
}
