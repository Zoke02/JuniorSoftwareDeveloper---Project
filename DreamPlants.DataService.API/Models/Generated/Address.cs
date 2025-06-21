using System;
using System.Collections.Generic;

namespace DreamPlants.DataService.API.Models.Generated;

public partial class Address
{
    public int AddressId { get; set; }

    public int UserId { get; set; }

    public string Street { get; set; }

    public string HouseNr { get; set; }

    public string Door { get; set; }

    public string City { get; set; }

    public string PostalCode { get; set; }

    public string FirstName { get; set; }

    public string LastName { get; set; }

    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();

    public virtual User User { get; set; }
}
