using System.Security.Cryptography;
using System.Text;

namespace DreamPlants.DataService.API.Models.Generated
{
  public partial class User
  {
    //My Methods
    public bool CheckPassword(string password)
    {
      SHA512 sha = SHA512.Create();
      return Convert.ToBase64String(sha.ComputeHash(Encoding.UTF8.GetBytes(password))) == this.PasswordHash;
    }

    public string setPassword(string password)
    {
      SHA512 sha = SHA512.Create();
      this.PasswordHash = Convert.ToBase64String(sha.ComputeHash(Encoding.UTF8.GetBytes(password)));
      return this.PasswordHash;
    }

  }
}
