using DreamPlants.DataService.API.Models.Generated;

namespace DreamPlants.DataService.API.Models.DTO
{
  public class AddressDTO
  {
    public int AddressId { get; set; }

    public string Street { get; set; }

    public string HouseNr { get; set; }

    public string Door { get; set; }

    public string City { get; set; }

    public string PostalCode { get; set; }

    public string FirstName { get; set; }

    public string LastName { get; set; }

  }
}
