using DreamPlants.DataService.API.Data;
using Microsoft.EntityFrameworkCore;


namespace DreamPlants.DataService.API
{
  public class Program
  {
    public static void Main(string[] args)
    {
      var builder = WebApplication.CreateBuilder(args);

      builder.Services.AddControllers();

      // Add services to the container.
      builder.Services.AddAuthorization();
      // This lines adds your DB to be used for API Calls.
      builder.Services.AddDbContext<DreamPlantsContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

      var app = builder.Build();

      // CORS Error
      app.UseCors((options) =>
      {
        options.WithOrigins("http://localhost:5501");
        options.AllowAnyHeader();
        options.AllowAnyMethod();
        options.AllowCredentials();
      });

      app.UseAuthorization();
      app.MapControllers();

      app.Run();

    }
  }
}
