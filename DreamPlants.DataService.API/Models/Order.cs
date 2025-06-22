using System;
using System.Threading.Tasks;
using DreamPlants.DataService.API.Data;
using Microsoft.EntityFrameworkCore;

namespace DreamPlants.DataService.API.Models.Generated
{
  public partial class Order
  {
    public static async Task<string> GenerateUniqueOrderNumberAsync(DreamPlantsContext context)
    {
      string orderNumber;
      bool exists;

      do
      {
        orderNumber = new Random().Next(100000000, 999999999).ToString(); // 9-digit number
        exists = await context.Orders.AnyAsync(o => o.OrderNumber == orderNumber);
      }
      while (exists);

      return orderNumber;
    }
  }
}
