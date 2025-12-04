using Microsoft.EntityFrameworkCore;

namespace Backend;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<SocialAccount> SocialAccounts => Set<SocialAccount>();
    public DbSet<Review> Reviews => Set<Review>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.TelegramId)
            .IsUnique();

        modelBuilder.Entity<SocialAccount>()
            .HasIndex(a => new { a.Platform, a.Handle })
            .IsUnique();

        modelBuilder.Entity<Review>()
            .HasOne(r => r.Author)
            .WithMany(u => u.Reviews)
            .HasForeignKey(r => r.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Review>()
            .HasOne(r => r.SocialAccount)
            .WithMany(a => a.Reviews)
            .HasForeignKey(r => r.SocialAccountId);
    }
}



