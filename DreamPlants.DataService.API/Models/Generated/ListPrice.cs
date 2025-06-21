using System;
using System.Collections.Generic;

namespace DreamPlants.DataService.API.Models.Generated;

public partial class ListPrice
{
    public int Id { get; set; }

    public string Type { get; set; }

    public string Label { get; set; }

    public decimal Value { get; set; }

    public virtual ICollection<Order> OrderShippings { get; set; } = new List<Order>();

    public virtual ICollection<Order> OrderTaxes { get; set; } = new List<Order>();
}
