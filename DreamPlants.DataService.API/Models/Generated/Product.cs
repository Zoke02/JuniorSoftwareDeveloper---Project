using System;
using System.Collections.Generic;

namespace DreamPlants.DataService.API.Models.Generated;

public partial class Product
{
    public int ProductId { get; set; }

    public int ProductNumber { get; set; }

    public string Name { get; set; }

    public string Description { get; set; }

    public int SubcategoryId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<File> Files { get; set; } = new List<File>();

    public virtual ICollection<Stock> Stocks { get; set; } = new List<Stock>();

    public virtual Subcategory Subcategory { get; set; }
}
