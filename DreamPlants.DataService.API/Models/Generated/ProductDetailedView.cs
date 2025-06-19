using System;
using System.Collections.Generic;

namespace DreamPlants.DataService.API.Models.Generated;

public partial class ProductDetailedView
{
    public int? ProductId { get; set; }

    public int? ProductNumber { get; set; }

    public string Name { get; set; }

    public string Description { get; set; }

    public DateTime? ProductCreatedAt { get; set; }

    public DateTime? ProductUpdatedAt { get; set; }

    public int? StockId { get; set; }

    public int? StockNumber { get; set; }

    public string VariantSize { get; set; }

    public string VariantColor { get; set; }

    public string VariantText { get; set; }

    public decimal? Price { get; set; }

    public int? Quantity { get; set; }

    public string Note { get; set; }

    public DateTime? StockCreatedAt { get; set; }

    public DateTime? StockUpdatedAt { get; set; }

    public string CreatedBy { get; set; }

    public int? SubcategoryId { get; set; }

    public string SubcategoryName { get; set; }

    public int? CategoryId { get; set; }

    public string CategoryName { get; set; }
}
