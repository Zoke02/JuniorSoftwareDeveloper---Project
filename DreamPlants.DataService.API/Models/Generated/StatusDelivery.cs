using System;
using System.Collections.Generic;

namespace DreamPlants.DataService.API.Models.Generated;

public partial class StatusDelivery
{
    public int StatusId { get; set; }

    public string StatusName { get; set; }

    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
}
