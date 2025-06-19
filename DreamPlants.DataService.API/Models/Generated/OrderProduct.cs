using System;
using System.Collections.Generic;

namespace DreamPlants.DataService.API.Models.Generated;

public partial class OrderProduct
{
    public int OrderProductId { get; set; }

    public int OrderId { get; set; }

    public int StockId { get; set; }

    public int AddressId { get; set; }

    public int Quantity { get; set; }

    public decimal TotalPrice { get; set; }

    public virtual Addresses Address { get; set; }

    public virtual Order Order { get; set; }

    public virtual Stock Stock { get; set; }
}
