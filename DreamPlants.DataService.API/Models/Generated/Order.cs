using System;
using System.Collections.Generic;

namespace DreamPlants.DataService.API.Models.Generated;

public partial class Order
{
    public int OrderId { get; set; }

    public int UserId { get; set; }

    public DateTime OrderDate { get; set; }

    public int AddressId { get; set; }

    public int CardId { get; set; }

    public decimal TotalPrice { get; set; }

    public int StatusId { get; set; }

    public int ShippingId { get; set; }

    public int TaxId { get; set; }

    public virtual Address Address { get; set; }

    public virtual CreditCard Card { get; set; }

    public virtual ICollection<OrderProduct> OrderProducts { get; set; } = new List<OrderProduct>();

    public virtual ListPrice Shipping { get; set; }

    public virtual StatusDelivery Status { get; set; }

    public virtual ListPrice Tax { get; set; }

    public virtual User User { get; set; }
}
