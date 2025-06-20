using System;
using System.Collections.Generic;

namespace DreamPlants.DataService.API.Models.Generated;

public partial class Stock
{
    public int StockId { get; set; }

    public int ProductId { get; set; }

    public string VariantSize { get; set; }

    public string VariantColor { get; set; }

    public string VariantText { get; set; }

    public decimal Price { get; set; }

    public int Quantity { get; set; }

    public string Note { get; set; }

    public DateTime? CreatedAt { get; set; }

    public string CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public string StockUid { get; set; }

    public int StockNumber { get; set; }

    public int? UserId { get; set; }

    public virtual ICollection<OrderProduct> OrderProducts { get; set; } = new List<OrderProduct>();

    public virtual Product Product { get; set; }

    public virtual User User { get; set; }
}
