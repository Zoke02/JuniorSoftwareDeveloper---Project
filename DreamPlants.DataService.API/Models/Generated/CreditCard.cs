using System;
using System.Collections.Generic;

namespace DreamPlants.DataService.API.Models.Generated;

public partial class CreditCard
{
    public int CardId { get; set; }

    public int UserId { get; set; }

    public string CardholderName { get; set; }

    public string CardNumber { get; set; }

    public string CardExpiry { get; set; }

    public string CardCvv { get; set; }

    public virtual User User { get; set; }
}
