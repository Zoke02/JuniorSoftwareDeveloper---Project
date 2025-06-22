namespace DreamPlants.DataService.API.Models.DTO
{

  public class OrderItemDTO
  {
    public string ProductName { get; set; }
    public string VariantSize { get; set; }
    public string VariantColor { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
  }

  public class OrderHistoryDTO
  {
    public string FirstName { get; set; }
    public string LastName { get; set; }

    public int OrderId { get; set; }
    public string OrderNumber { get; set; } 
    public DateTime OrderDate { get; set; }
    public string Status { get; set; }
    public decimal TotalPrice { get; set; }
    public int AddressId { get; set; }
    public int CardId { get; set; }
    public decimal Tax { get; set; }
    public string ShippingName { get; set; }

    public List<OrderItemDTO> Items { get; set; }
  }

  public class UpdateOrderStatusDTO
  {
    public int OrderId { get; set; }
    public int StatusId { get; set; }
  }


}
