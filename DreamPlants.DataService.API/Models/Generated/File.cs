using System;
using System.Collections.Generic;

namespace DreamPlants.DataService.API.Models.Generated;

public partial class File
{
    public int FileId { get; set; }

    public int ProductId { get; set; }

    public string FileName { get; set; }

    public string FileType { get; set; }

    public byte[] FileData { get; set; }

    public DateTime? UploadedAt { get; set; }

    public virtual Product Product { get; set; }
}
