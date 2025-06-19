using System;
using System.Collections.Generic;
using DreamPlants.DataService.API.Models.Generated;
using Microsoft.EntityFrameworkCore;
using File = DreamPlants.DataService.API.Models.Generated.File;


namespace DreamPlants.DataService.API.Data;

public partial class DreamPlantsContext : DbContext
{
    public DreamPlantsContext()
    {
    }

    public DreamPlantsContext(DbContextOptions<DreamPlantsContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Address> Addresses { get; set; }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<CreditCard> CreditCards { get; set; }

    public virtual DbSet<File> Files { get; set; }

    public virtual DbSet<Order> Orders { get; set; }

    public virtual DbSet<OrderProduct> OrderProducts { get; set; }

    public virtual DbSet<Product> Products { get; set; }

    public virtual DbSet<ProductDetailedView> ProductDetailedViews { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<Stock> Stocks { get; set; }

    public virtual DbSet<Subcategory> Subcategories { get; set; }

    public virtual DbSet<User> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Address>(entity =>
        {
            entity.HasKey(e => e.AddressId).HasName("addresses_pkey");

            entity.ToTable("addresses", "dreamplants");

            entity.Property(e => e.AddressId).HasColumnName("address_id");
            entity.Property(e => e.City)
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("city");
            entity.Property(e => e.Door)
                .HasMaxLength(10)
                .HasColumnName("door");
            entity.Property(e => e.FirstName)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnName("first_name");
            entity.Property(e => e.HouseNr)
                .IsRequired()
                .HasMaxLength(10)
                .HasColumnName("house_nr");
            entity.Property(e => e.LastName)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnName("last_name");
            entity.Property(e => e.PostalCode)
                .IsRequired()
                .HasMaxLength(10)
                .HasColumnName("postal_code");
            entity.Property(e => e.Street)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnName("street");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.Addresses)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("addresses_user_id_fkey");
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.CategoryId).HasName("categories_pkey");

            entity.ToTable("categories", "dreamplants");

            entity.HasIndex(e => e.CategoryName, "categories_category_name_key").IsUnique();

            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.CategoryName)
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("category_name");
        });

        modelBuilder.Entity<CreditCard>(entity =>
        {
            entity.HasKey(e => e.CardId).HasName("credit_cards_pkey");

            entity.ToTable("credit_cards", "dreamplants");

            entity.Property(e => e.CardId).HasColumnName("card_id");
            entity.Property(e => e.CardCVV)
              .IsRequired()
              .HasMaxLength(4)
              .HasColumnName("card_cvv");
            entity.Property(e => e.CardExpiry)
                .IsRequired()
                .HasMaxLength(5)
                .HasColumnName("card_expiry");
            entity.Property(e => e.CardNumber)
                .IsRequired()
                .HasMaxLength(20)
                .HasColumnName("card_number");
            entity.Property(e => e.CardholderName)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnName("cardholder_name");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.CreditCards)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("credit_cards_user_id_fkey");
        });

        modelBuilder.Entity<File>(entity =>
        {
            entity.HasKey(e => e.FileId).HasName("files_pkey");

            entity.ToTable("files", "dreamplants");

            entity.Property(e => e.FileId).HasColumnName("file_id");
            entity.Property(e => e.FileData)
                .IsRequired()
                .HasColumnName("file_data");
            entity.Property(e => e.FileName)
                .IsRequired()
                .HasMaxLength(255)
                .HasColumnName("file_name");
            entity.Property(e => e.FileType)
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("file_type");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.UploadedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("uploaded_at");

            entity.HasOne(d => d.Product).WithMany(p => p.Files)
                .HasForeignKey(d => d.ProductId)
                .HasConstraintName("files_product_id_fkey");
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.OrderId).HasName("orders_pkey");

            entity.ToTable("orders", "dreamplants");

            entity.Property(e => e.OrderId).HasColumnName("order_id");
            entity.Property(e => e.OrderDate)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("order_date");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasColumnName("status");
            entity.Property(e => e.TotalPrice)
                .HasPrecision(10, 2)
                .HasColumnName("total_price");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.Orders)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("orders_user_id_fkey");
        });

        modelBuilder.Entity<OrderProduct>(entity =>
        {
            entity.HasKey(e => e.OrderProductId).HasName("order_products_pkey");

            entity.ToTable("order_products", "dreamplants");

            entity.Property(e => e.OrderProductId).HasColumnName("order_product_id");
            entity.Property(e => e.AddressId).HasColumnName("address_id");
            entity.Property(e => e.OrderId).HasColumnName("order_id");
            entity.Property(e => e.Quantity).HasColumnName("quantity");
            entity.Property(e => e.StockId).HasColumnName("stock_id");
            entity.Property(e => e.TotalPrice)
                .HasPrecision(10, 2)
                .HasColumnName("total_price");

            entity.HasOne(d => d.Address).WithMany(p => p.OrderProducts)
                .HasForeignKey(d => d.AddressId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("order_products_address_id_fkey");

            entity.HasOne(d => d.Order).WithMany(p => p.OrderProducts)
                .HasForeignKey(d => d.OrderId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("order_products_order_id_fkey");

            entity.HasOne(d => d.Stock).WithMany(p => p.OrderProducts)
                .HasForeignKey(d => d.StockId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("order_products_stock_id_fkey");
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.ProductId).HasName("products_pkey");

            entity.ToTable("products", "dreamplants");

            entity.HasIndex(e => e.Name, "products_name_key").IsUnique();

            entity.HasIndex(e => e.ProductNumber, "products_product_number_key").IsUnique();

            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnName("name");
            entity.Property(e => e.ProductNumber)
                .HasDefaultValueSql("nextval('dreamplants.product_number_seq'::regclass)")
                .HasColumnName("product_number");
            entity.Property(e => e.SubcategoryId).HasColumnName("subcategory_id");
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.Subcategory).WithMany(p => p.Products)
                .HasForeignKey(d => d.SubcategoryId)
                .HasConstraintName("products_subcategory_id_fkey");
        });

        modelBuilder.Entity<ProductDetailedView>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("product_detailed_view", "dreamplants");

            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.CategoryName)
                .HasMaxLength(50)
                .HasColumnName("category_name");
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(50)
                .HasColumnName("created_by");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
            entity.Property(e => e.Note)
                .HasMaxLength(255)
                .HasColumnName("note");
            entity.Property(e => e.Price)
                .HasPrecision(10, 2)
                .HasColumnName("price");
            entity.Property(e => e.ProductCreatedAt)
                .HasColumnType("timestamp without time zone")
                .HasColumnName("product_created_at");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.ProductNumber).HasColumnName("product_number");
            entity.Property(e => e.ProductUpdatedAt)
                .HasColumnType("timestamp without time zone")
                .HasColumnName("product_updated_at");
            entity.Property(e => e.Quantity).HasColumnName("quantity");
            entity.Property(e => e.StockCreatedAt)
                .HasColumnType("timestamp without time zone")
                .HasColumnName("stock_created_at");
            entity.Property(e => e.StockId).HasColumnName("stock_id");
            entity.Property(e => e.StockNumber).HasColumnName("stock_number");
            entity.Property(e => e.StockUpdatedAt)
                .HasColumnType("timestamp without time zone")
                .HasColumnName("stock_updated_at");
            entity.Property(e => e.SubcategoryId).HasColumnName("subcategory_id");
            entity.Property(e => e.SubcategoryName)
                .HasMaxLength(50)
                .HasColumnName("subcategory_name");
            entity.Property(e => e.VariantColor)
                .HasMaxLength(50)
                .HasColumnName("variant_color");
            entity.Property(e => e.VariantSize)
                .HasMaxLength(50)
                .HasColumnName("variant_size");
            entity.Property(e => e.VariantText).HasColumnName("variant_text");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.RoleId).HasName("roles_pkey");

            entity.ToTable("roles", "dreamplants");

            entity.HasIndex(e => e.RoleName, "roles_role_name_key").IsUnique();

            entity.Property(e => e.RoleId).HasColumnName("role_id");
            entity.Property(e => e.RoleName)
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("role_name");
        });

        modelBuilder.Entity<Stock>(entity =>
        {
            entity.HasKey(e => e.StockId).HasName("stock_pkey");

            entity.ToTable("stock", "dreamplants");

            entity.Property(e => e.StockId).HasColumnName("stock_id");
            entity.Property(e => e.CreatedAt)
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(50)
                .HasColumnName("created_by");
            entity.Property(e => e.Note)
                .HasMaxLength(255)
                .HasColumnName("note");
            entity.Property(e => e.Price)
                .HasPrecision(10, 2)
                .HasColumnName("price");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.Quantity)
                .HasDefaultValue(0)
                .HasColumnName("quantity");
            entity.Property(e => e.StockNumber).HasColumnName("stock_number");
            entity.Property(e => e.StockUid)
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("stock_uid");
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updated_at");
            entity.Property(e => e.VariantColor)
                .HasMaxLength(50)
                .HasColumnName("variant_color");
            entity.Property(e => e.VariantSize)
                .HasMaxLength(50)
                .HasColumnName("variant_size");
            entity.Property(e => e.VariantText).HasColumnName("variant_text");

            entity.HasOne(d => d.Product).WithMany(p => p.Stocks)
                .HasForeignKey(d => d.ProductId)
                .HasConstraintName("stock_product_id_fkey");
        });

        modelBuilder.Entity<Subcategory>(entity =>
        {
            entity.HasKey(e => e.SubcategoryId).HasName("subcategories_pkey");

            entity.ToTable("subcategories", "dreamplants");

            entity.HasIndex(e => new { e.CategoryId, e.SubcategoryName }, "subcategories_category_id_subcategory_name_key").IsUnique();

            entity.Property(e => e.SubcategoryId).HasColumnName("subcategory_id");
            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.SubcategoryName)
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("subcategory_name");

            entity.HasOne(d => d.Category).WithMany(p => p.Subcategories)
                .HasForeignKey(d => d.CategoryId)
                .HasConstraintName("subcategories_category_id_fkey");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("users_pkey");

            entity.ToTable("users", "dreamplants");

            entity.HasIndex(e => e.Email, "users_email_key").IsUnique();

            entity.HasIndex(e => e.PhoneNumber, "users_phone_number_key").IsUnique();

            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.Email)
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("email");
            entity.Property(e => e.FirstName)
                .HasMaxLength(50)
                .HasColumnName("first_name");
            entity.Property(e => e.LastName)
                .HasMaxLength(50)
                .HasColumnName("last_name");
            entity.Property(e => e.LoginToken)
                .HasMaxLength(255)
                .HasColumnName("login_token");
            entity.Property(e => e.LoginTokenLastLog)
                .HasColumnType("timestamp without time zone")
                .HasColumnName("login_token_last_log");
            entity.Property(e => e.LoginTokenTimeout)
                .HasColumnType("timestamp without time zone")
                .HasColumnName("login_token_timeout");
            entity.Property(e => e.PasswordHash)
                .IsRequired()
                .HasMaxLength(255)
                .HasColumnName("password_hash");
            entity.Property(e => e.PhoneNumber)
                .HasMaxLength(20)
                .HasColumnName("phone_number");
            entity.Property(e => e.RoleId).HasColumnName("role_id");
            entity.Property(e => e.UserStatus)
                .HasDefaultValue(true)
                .HasColumnName("user_status");

            entity.HasOne(d => d.Role).WithMany(p => p.Users)
                .HasForeignKey(d => d.RoleId)
                .HasConstraintName("users_role_id_fkey");
        });
        modelBuilder.HasSequence("product_number_seq", "dreamplants").StartsAt(10000L);

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
