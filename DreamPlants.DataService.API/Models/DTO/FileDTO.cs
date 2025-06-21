public class FileDTO
{
  public int FileId { get; set; }
  public string FileName { get; set; }
  public string FileType { get; set; }
  public byte[] FileData { get; set; }

  public string FileBase64 { get; set; }
}
