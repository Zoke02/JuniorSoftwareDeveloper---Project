using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace DreamPlants.DataService.API.Models.Generated;

public partial class Subcategory
{
  [Key]
  [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
  public int SubcategoryId { get; set; }

    public int CategoryId { get; set; }

    public string SubcategoryName { get; set; }

    public virtual Category Category { get; set; }

    public virtual ICollection<Product> Products { get; set; } = new List<Product>();
}
